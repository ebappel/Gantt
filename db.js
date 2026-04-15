// ============================================================
//  Database Layer — Firebase Auth + Firestore
//  Handles authentication, real-time sync, and role management
// ============================================================

import firebaseConfig from './firebase-config.js';

// Firebase SDK (loaded via importmap in index.html)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInAnonymously, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot, writeBatch, serverTimestamp } from 'firebase/firestore';

// ── Init ──────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ── State ─────────────────────────────────────────────────
let currentUser = null;
let userRole = 'viewer'; // 'admin' | 'editor' | 'viewer'
let unsubCharts = null;
let authReadyResolve;
const authReady = new Promise(r => { authReadyResolve = r; });

// Callbacks set by app.js
let onChartsUpdate = null;
let onAuthUpdate = null;

// ── Auth ──────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user && user.email) {   // ← FIXED: only load role if user has an email (not anonymous)
    await loadUserRole(user);
  } else {
    userRole = 'viewer';
  }
  if (onAuthUpdate) onAuthUpdate(currentUser, userRole);
  authReadyResolve();
});

async function loadUserRole(user) {
  if (!user.email) {          // ← FIXED: guard against null email crashing Firestore path
    userRole = 'viewer';
    return;
  }
  const roleDoc = await getDoc(doc(db, 'roles', user.email));
  if (roleDoc.exists()) {
    userRole = roleDoc.data().role;
  } else {
    // Check if there are ANY roles — if not, first user becomes admin
    const rolesSnap = await getDocs(collection(db, 'roles'));
    if (rolesSnap.empty) {
      userRole = 'admin';
      await setDoc(doc(db, 'roles', user.email), {
        role: 'admin',
        email: user.email,
        name: user.displayName || '',
        addedAt: serverTimestamp()
      });
    } else {
      userRole = 'viewer';
    }
  }
}

function signIn() {
  return signInWithPopup(auth, provider);
}

function logOut() {
  return signOut(auth);
}

function getUser() { return currentUser; }
function getRole() { return userRole; }
function canEdit() { return userRole === 'admin' || userRole === 'editor'; }
function isAdmin() { return userRole === 'admin'; }

// ── Charts CRUD ───────────────────────────────────────────

// Start real-time listener for all charts
function subscribeToCharts(callback) {
  onChartsUpdate = callback;
  unsubCharts = onSnapshot(collection(db, 'charts'), (snapshot) => {
    const charts = [];
    snapshot.forEach(d => {
      charts.push({ id: d.id, ...d.data() });
    });
    // Sort by createdAt
    charts.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return ta - tb;
    });
    if (onChartsUpdate) onChartsUpdate(charts);
  });
}

function unsubscribeCharts() {
  if (unsubCharts) { unsubCharts(); unsubCharts = null; }
}

async function saveChart(chart) {
  const { id, ...data } = chart;
  // Ensure tasks are serializable (no undefined)
  if (data.tasks) {
    data.tasks = data.tasks.map(t => {
      const clean = {};
      for (const [k, v] of Object.entries(t)) {
        if (v !== undefined) clean[k] = v;
      }
      return clean;
    });
  }
  data.updatedAt = serverTimestamp();
  data.updatedBy = currentUser?.email || 'anonymous';
  await setDoc(doc(db, 'charts', id), data, { merge: true });
}

async function createChart(chart) {
  const { id, ...data } = chart;
  data.createdAt = serverTimestamp();
  data.updatedAt = serverTimestamp();
  data.createdBy = currentUser?.email || 'anonymous';
  data.updatedBy = currentUser?.email || 'anonymous';
  await setDoc(doc(db, 'charts', id), data);
}

async function deleteChart(chartId) {
  await deleteDoc(doc(db, 'charts', chartId));
}

// ── Seed default data if no charts exist ──────────────────
async function seedDefaultIfEmpty(zegoTemplate, uid) {
  const snap = await getDocs(collection(db, 'charts'));
  if (snap.empty) {
    const defaultChart = {
      name: 'Zego Integration',
      subtitle: '90-Day Implementation Timeline',
      totalDays: 92,
      ...zegoTemplate(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser?.email || 'system',
      updatedBy: currentUser?.email || 'system'
    };
    await setDoc(doc(db, 'charts', 'chart-1'), defaultChart);
  }
}

// ── Roles Management (admin only) ─────────────────────────
async function getAllRoles() {
  const snap = await getDocs(collection(db, 'roles'));
  const roles = [];
  snap.forEach(d => roles.push({ email: d.id, ...d.data() }));
  return roles;
}

async function setUserRole(email, role) {
  if (userRole !== 'admin') return;
  await setDoc(doc(db, 'roles', email), {
    role,
    email,
    addedAt: serverTimestamp()
  }, { merge: true });
}

async function removeUser(email) {
  if (userRole !== 'admin') return;
  if (email === currentUser?.email) return; // Can't remove yourself
  await deleteDoc(doc(db, 'roles', email));
}

// ── Invite Tokens (anonymous viewer access) ──────────────
let activeToken = null; // Set when viewer accesses via ?token=

async function signInWithToken(tokenId) {
  // Sign in anonymously so Firestore rules allow reads
  const snap = await signInAnonymously(auth);
  // Validate the token
  const tokenDoc = await getDoc(doc(db, 'invite_tokens', tokenId));
  if (!tokenDoc.exists() || tokenDoc.data().revoked) {
    await signOut(auth);
    return { valid: false };
  }
  activeToken = { id: tokenId, ...tokenDoc.data() };
  userRole = 'viewer';
  return { valid: true, token: activeToken };
}

function getActiveToken() { return activeToken; }
function isTokenViewer() { return !!activeToken; }

async function createInviteToken(label, chartIds) {
  if (userRole !== 'admin') return null;
  const id = 'tok-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const tokenData = {
    label: label || 'Invite Link',
    chartAccess: chartIds || [], // empty = all charts
    createdAt: serverTimestamp(),
    createdBy: currentUser?.email || 'unknown',
    revoked: false
  };
  await setDoc(doc(db, 'invite_tokens', id), tokenData);
  return id;
}

async function getAllInviteTokens() {
  if (userRole !== 'admin') return [];
  const snap = await getDocs(collection(db, 'invite_tokens'));
  const tokens = [];
  snap.forEach(d => tokens.push({ id: d.id, ...d.data() }));
  tokens.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return tokens;
}

async function revokeInviteToken(tokenId) {
  if (userRole !== 'admin') return;
  await setDoc(doc(db, 'invite_tokens', tokenId), { revoked: true }, { merge: true });
}

async function deleteInviteToken(tokenId) {
  if (userRole !== 'admin') return;
  await deleteDoc(doc(db, 'invite_tokens', tokenId));
}

// ── Chart Access (per-user) ───────────────────────────────
async function getUserChartAccess(email) {
  const roleDoc = await getDoc(doc(db, 'roles', email));
  if (roleDoc.exists()) {
    return roleDoc.data().chartAccess || [];
  }
  return [];
}

async function setUserChartAccess(email, chartIds) {
  if (userRole !== 'admin') return;
  await setDoc(doc(db, 'roles', email), {
    chartAccess: chartIds
  }, { merge: true });
}

// ── Public API ────────────────────────────────────────────
export {
  authReady,
  signIn,
  logOut,
  getUser,
  getRole,
  canEdit,
  isAdmin,
  subscribeToCharts,
  unsubscribeCharts,
  saveChart,
  createChart,
  deleteChart,
  seedDefaultIfEmpty,
  getAllRoles,
  setUserRole,
  removeUser,
  getUserChartAccess,
  setUserChartAccess,
  signInWithToken,
  getActiveToken,
  isTokenViewer,
  createInviteToken,
  getAllInviteTokens,
  revokeInviteToken,
  deleteInviteToken,
  onAuthUpdate
};

// Allow setting callbacks
export function setOnAuthUpdate(fn) { onAuthUpdate = fn; }
