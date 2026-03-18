// ============================================================
//  Multi-Chart Editable Gantt — Firebase Persistent Edition
//  Real-time sync across all users
// ============================================================

import {
  authReady, signIn, logOut, getUser, getRole, canEdit, isAdmin,
  subscribeToCharts, saveChart, createChart, deleteChart,
  seedDefaultIfEmpty, getAllRoles, setUserRole, removeUser,
  setOnAuthUpdate, getUserChartAccess, setUserChartAccess
} from './db.js';

let nextId = Date.now();
const uid = () => "id-" + (nextId++);

// ── Color helpers ──────────────────────────────────────────
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function phaseCSS(p) {
  const c = p.color;
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return { bar: isDark ? hexToRgba(c,.18) : hexToRgba(c,.15), border: isDark ? hexToRgba(c,.4) : hexToRgba(c,.35), text: c, solid: c };
}

// ── Default Zego template ──────────────────────────────────
function zegoTemplate() {
  return {
    phases: [
      { id:"sales", name:"Sales", color:"#3b82f6" },
      { id:"contract", name:"Contracting", color:"#8b5cf6" },
      { id:"rm", name:"RM Implementation", color:"#10b981" },
      { id:"zego", name:"Zego Process", color:"#f59e0b" },
      { id:"milestone", name:"Milestone", color:"#ef4444" }
    ],
    tasks: [
      { id:uid(), label:"Phase 1: Sales Qualification", phase:"sales", isHeader:true },
      { id:uid(), label:"Discovery Calls", phase:"sales", type:"sales", start:1, end:10, badge:"Days 1–10",
        description:"Initial discovery calls with prospect.", details:['\"Hidden Labor\" questions','\"Risk & Friction\" questions','\"Financial Strategy\" questions'] },
      { id:uid(), label:"Notate CRM & Qualify", phase:"sales", type:"sales", start:5, end:14, badge:"Days 5–14",
        description:"Document payment needs and workflows in CRM." },
      { id:uid(), label:"Phase 2: Contracting", phase:"contract", isHeader:true },
      { id:uid(), label:"Execute DocuSign Agreement", phase:"contract", type:"contract", start:12, end:20, badge:"Days 12–20",
        description:"Send RM agreement via DocuSign with Partner Document." },
      { id:uid(), label:"Complete Partner Document", phase:"contract", type:"contract", start:14, end:22, badge:"Days 14–22",
        description:"Finalize the RM/Zego Product Pricing Agreement." },
      { id:uid(), label:"Phase 3: Implementation", phase:"rm", isHeader:true },
      { id:uid(), label:"1. RM Account Review", phase:"rm", type:"rm", start:1, end:3, badge:"Day 1",
        description:"Review account and assign to implementation lead." },
      { id:uid(), label:"2. Data Import & Lead Letter", phase:"rm", type:"rm", start:3, end:12, badge:"Varies",
        description:"Import data and send Partner Letter Template to Zego." },
      { id:uid(), label:"Zego Process", phase:"zego", isHeader:true },
      { id:uid(), label:"2.1 Zego Sales Contracting", phase:"zego", type:"zego", start:12, end:40, badge:"<29 Days",
        description:"Zego sales engage with client, collect contracts.",
        details:["W9","Principal Owners DL","Business Utility Bill","Property List & Rent Rolls","Bank Account Info","Voided Check"] },
      { id:uid(), label:"2.2 Zego KYC", phase:"zego", type:"zego", start:20, end:34, badge:"<14 Days",
        description:"KYC process on Principal Owners." },
      { id:uid(), label:"2.3 Zego Due Diligence", phase:"zego", type:"zego", start:25, end:46, badge:"<21 Days",
        description:"Business background check." },
      { id:uid(), label:"2.4 Zego Approved", phase:"zego", type:"milestone", start:46, end:46, isMilestone:true, milestoneType:"zego", badge:"Day 45–60",
        description:"Zego approval milestone." },
      { id:uid(), label:"2.5 Zego Onboarding", phase:"zego", type:"zego", start:46, end:60, badge:"<21 Days",
        description:"Configure, train, and go live.",
        details:["Configure Client Account","Schedule Config Call","Provide Training Docs","Complete RM Database Config"] },
      { id:uid(), label:"Milestones", phase:"milestone", isHeader:true },
      { id:uid(), label:"3. RM Go-Live", phase:"rm", type:"milestone", start:60, end:60, isMilestone:true, milestoneType:"rm", badge:"Day 60",
        description:"RM and Zego fully integrated and active." },
      { id:uid(), label:"4. Implementation Complete", phase:"rm", type:"milestone", start:90, end:90, isMilestone:true, milestoneType:"rm", badge:"Day 90",
        description:"Full implementation complete." }
    ]
  };
}

// ── AmRent template ────────────────────────────────────────
function amrentTemplate() {
  return {
    phases: [
      { id:"lead", name:"Lead & Qualification", color:"#3b82f6" },
      { id:"contract", name:"Contracting", color:"#8b5cf6" },
      { id:"credential", name:"Credentialing", color:"#f59e0b" },
      { id:"setup", name:"Setup & Activation", color:"#10b981" },
      { id:"milestone", name:"Milestone", color:"#ef4444" }
    ],
    tasks: [
      // ── Phase 1: Lead & Qualification ──
      { id:uid(), label:"Lead & Qualification", phase:"lead", isHeader:true },
      { id:uid(), label:"1. Lead Received & Outreach", phase:"lead", type:"lead", start:1, end:2, badge:"Days 1–2",
        description:"Lead arrives via email/call. Sales reviews source and determines access path.",
        details:["Inside Sales: < 500 units","Outside Sales: 501+ units","Email sent to confirm availability for intro call","Rent Manager rep copied if lead from RM","Follow-up calls begin if no response in 3–5 days"] },
      { id:uid(), label:"2. Intro Call & Qualification", phase:"lead", type:"lead", start:2, end:4, badge:"Days 2–4",
        description:"Intro call/meeting to understand portfolio size, locations, and screening needs.",
        details:["Outside Sales may provide demo","Confirm appropriate product path based on laws/regulations","Lead details recorded in Salesforce"] },
      { id:uid(), label:"3. Proposal/Quote Sent", phase:"lead", type:"lead", start:4, end:5, badge:"Days 4–5",
        description:"Proposal or quote is sent based on qualification." },
      { id:uid(), label:"4. Opportunity Created", phase:"lead", type:"lead", start:5, end:7, badge:"Days 5–7",
        description:"Lead becomes a formal Opportunity once productive conversation occurs.",
        details:["Notes, activities, and RM documents tracked","Follow-up calls/emails as needed"] },

      // ── Phase 2: Contracting ──
      { id:uid(), label:"Contracting", phase:"contract", isHeader:true },
      { id:uid(), label:"5. Contract Packet Sent (DocuSign)", phase:"contract", type:"contract", start:7, end:9, badge:"Days 7–9",
        description:"Customer receives full contract packet via DocuSign.",
        details:["New Customer Checklist","Application for Services","Master Agreement","ACH Form","Principal ID & required forms"] },
      { id:uid(), label:"6. Customer Signs & Returns Docs", phase:"contract", type:"contract", start:9, end:16, badge:"Days 9–16",
        description:"All documents must be completed and signed by owner/principal.",
        details:["Supporting documents provided","Can take days to weeks depending on availability","Outside Sales schedules resident selection criteria review"] },

      // ── Phase 3: Credentialing ──
      { id:uid(), label:"Credentialing", phase:"credential", isHeader:true },
      { id:uid(), label:"7. Credentialing Review", phase:"credential", type:"credential", start:16, end:23, badge:"Days 16–23",
        description:"AmRent Credentialing reviews completed contract packet.",
        details:["Review for Red Flags","May request additional documentation or corrections","Schedule office inspection","Communicate required steps to Sales"] },
      { id:uid(), label:"8. Red Flags Resolution", phase:"credential", type:"credential", start:20, end:27, badge:"Days 20–27",
        description:"If issues identified, customer receives Red Flags List.",
        details:["Sales tracks progress until resolved","Minor items: same day","Complex cases: 1–2+ weeks"] },
      { id:uid(), label:"9. Credentialing Approved", phase:"credential", type:"milestone", start:27, end:27, isMilestone:true, milestoneType:"credential", badge:"Day 27",
        description:"Credentialing clears the customer. Account sent to Setups team." },

      // ── Phase 4: Setup & Activation ──
      { id:uid(), label:"Setup & Activation", phase:"setup", isHeader:true },
      { id:uid(), label:"10. Account Setup & Integration", phase:"setup", type:"setup", start:27, end:34, badge:"Days 27–34",
        description:"Setup team activates the account. For RM customers: integration access established.",
        details:["Customer receives 'Setup Submitted' email","RM integration configured","Inside Sales: confirmation & onboarding info sent","Outside Sales: meeting scheduled for RM settings"] },
      { id:uid(), label:"11. Training & Handoff", phase:"setup", type:"setup", start:32, end:38, badge:"Days 32–38",
        description:"Training meeting with all users who will access screenings.",
        details:["Training materials & resources distributed","Inside Sales → Account Management (immediate)","Outside Sales → Client Relationship Manager (30 days)"] },

      // ── Milestones ──
      { id:uid(), label:"Milestones", phase:"milestone", isHeader:true },
      { id:uid(), label:"Customer Go-Live", phase:"setup", type:"milestone", start:35, end:35, isMilestone:true, milestoneType:"setup", badge:"Day 35",
        description:"AmRent account fully activated, integrated, and customer is live." },
      { id:uid(), label:"Account Transition Complete", phase:"setup", type:"milestone", start:42, end:42, isMilestone:true, milestoneType:"setup", badge:"Day 42",
        description:"Ownership transitioned from Sales to Account Management / CRM." }
    ]
  };
}

// ── AvidXchange template ─────────────────────────────────
function avidxchangeTemplate() {
  return {
    phases: [
      { id:"leadsub", name:"Lead Submission & Qualification", color:"#3b82f6" },
      { id:"demo", name:"Sales Demo & Routing", color:"#6366f1" },
      { id:"compliance", name:"Compliance & Order Form", color:"#8b5cf6" },
      { id:"readiness", name:"Customer Readiness & Kickoff", color:"#f59e0b" },
      { id:"implprep", name:"Implementation Prep", color:"#f97316" },
      { id:"impl", name:"Implementation", color:"#10b981" },
      { id:"milestone", name:"Milestone", color:"#ef4444" }
    ],
    tasks: [
      // ── Phase 1: Lead Submission & Qualification ──
      { id:uid(), label:"Lead Submission & Qualification", phase:"leadsub", isHeader:true },
      { id:uid(), label:"1. RM Sends Lead to SDR", phase:"leadsub", type:"leadsub", start:1, end:2, badge:"Days 1–2",
        description:"Rent Manager team sends qualified leads to the AvidXchange SDR team.",
        details:["SDR contacts lead to qualify opportunity","Qualification questions cover accounting system, invoice volume, payment methods","Pain points in current AP process identified"] },
      { id:uid(), label:"2. SDR Qualifies & Schedules Demo", phase:"leadsub", type:"leadsub", start:2, end:3, badge:"Days 2–3",
        description:"SDR qualifies the opportunity and schedules a meeting with AvidXchange sales.",
        details:["Availability gathered for 20–30 minute Teams meeting","Monthly invoice & payment volumes confirmed","International payment needs assessed"] },

      // ── Phase 2: Sales Demo & Opportunity Routing ──
      { id:uid(), label:"Sales Demo & Routing", phase:"demo", isHeader:true },
      { id:uid(), label:"3. Sales Demo", phase:"demo", type:"demo", start:3, end:5, badge:"Days 3–5",
        description:"25–30 minute demo covering AvidXchange AP Automation and AvidPay platform.",
        details:["0–500 payments/month → Kendyl","500+ payments/month → Craig","Covers AP Automation & AvidPay Network"] },

      // ── Phase 3: Compliance & Order Form ──
      { id:uid(), label:"Compliance & Order Form", phase:"compliance", isHeader:true },
      { id:uid(), label:"4. Compliance Docs Sent", phase:"compliance", type:"compliance", start:5, end:6, badge:"Day 5–6",
        description:"Compliance documents sent to customer. AvidXchange gathers total expected monthly transactions." },
      { id:uid(), label:"5. Customer Returns Compliance Forms", phase:"compliance", type:"compliance", start:6, end:12, badge:"Days 6–12",
        description:"Customers typically return compliance forms within 2–7 days.",
        details:["All required compliance documents completed","Timeline depends on customer responsiveness"] },
      { id:uid(), label:"6. KYC Review & Order Form", phase:"compliance", type:"compliance", start:12, end:13, badge:"Days 12–13",
        description:"KYC (Know Your Customer) review finalized. Order Form issued within 24 hours." },

      // ── Phase 4: Customer Readiness & Implementation Kickoff ──
      { id:uid(), label:"Customer Readiness & Kickoff", phase:"readiness", isHeader:true },
      { id:uid(), label:"7. Customer Readiness Outreach", phase:"readiness", type:"readiness", start:13, end:15, badge:"Days 13–15",
        description:"Customer Readiness Team reaches out within 2 business days.",
        details:["Initial onboarding information collected"] },
      { id:uid(), label:"8. Project Team Assigned", phase:"readiness", type:"readiness", start:15, end:17, badge:"Days 15–17",
        description:"Implementation project team assigned within 2 business days." },
      { id:uid(), label:"9. Onboarding / Welcome Call", phase:"readiness", type:"readiness", start:17, end:19, badge:"Days 17–19",
        description:"Project team schedules the onboarding / welcome call within 2 business days." },

      // ── Phase 5: Implementation Preparation ──
      { id:uid(), label:"Implementation Prep", phase:"implprep", isHeader:true },
      { id:uid(), label:"10. Data & System Preparation", phase:"implprep", type:"implprep", start:19, end:24, badge:"Days 19–24",
        description:"Customer prepares required data and systems for implementation.",
        details:["Vendor list with complete address info, no duplicates","Chart of Accounts updated and finalized","Active bank accounts available in accounting system","Customer actively processing transactions for correct data import"] },

      // ── Phase 6: Implementation Process ──
      { id:uid(), label:"Implementation", phase:"impl", isHeader:true },
      { id:uid(), label:"11. Implementation & Weekly Calls", phase:"impl", type:"impl", start:24, end:42, badge:"Days 24–42",
        description:"Target Go-Live date agreed upon. Weekly project calls to review progress.",
        details:["~2 hours/week customer commitment","Deliverables: vendor lists, chart of accounts, payment history, bank account lists","Weekly project calls held to review progress & next steps","Project updates and communication occur weekly"] },

      // ── Milestones ──
      { id:uid(), label:"Milestones", phase:"milestone", isHeader:true },
      { id:uid(), label:"System Go-Live", phase:"impl", type:"milestone", start:42, end:42, isMilestone:true, milestoneType:"impl", badge:"Day 42",
        description:"AvidXchange system configured and active. Invoices processing, payments sent through AvidPay Network.",
        details:["Invoices processed & approved through AvidXchange","Payments sent through AvidPay Network","End users trained and proficient"] },
      { id:uid(), label:"End User Training Complete", phase:"impl", type:"milestone", start:45, end:45, isMilestone:true, milestoneType:"impl", badge:"Day 45",
        description:"All end users trained and proficient using the AvidXchange system." }
    ]
  };
}

function blankTemplate() { return { phases:[], tasks:[] }; }

// ── State ──────────────────────────────────────────────────
let charts = [];
let activeChartId = null;
let currentFilter = "all";
let saveDebounce = null;

function C() { return charts.find(c => c.id === activeChartId) || charts[0]; }

// ── Debounced Save ─────────────────────────────────────────
function scheduleSave() {
  if (!canEdit()) return;
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(() => {
    const c = C();
    if (c) saveChart(c);
  }, 600);
}

// ── Auth UI ────────────────────────────────────────────────
function renderAuthBar() {
  const user = getUser();
  const role = getRole();
  const statusEl = document.getElementById("authStatus");
  const actionsEl = document.getElementById("authActions");

  if (!user) {
    statusEl.innerHTML = `<span class="auth-hint">Sign in to edit and save changes</span>`;
    actionsEl.innerHTML = `<button class="btn btn-sm btn-primary" id="signInBtn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      Sign in with Google</button>`;
    document.getElementById("signInBtn").addEventListener("click", async () => {
      const btn = document.getElementById("signInBtn");
      btn.disabled = true; btn.textContent = "Signing in...";
      try {
        await signIn();
      } catch(e) {
        console.error("Sign-in error:", e);
        // Show helpful message for auth domain issues
        if (e.code === 'auth/unauthorized-domain') {
          alert("This domain is not authorized for sign-in. Go to Firebase Console → Authentication → Settings → Authorized domains and add: " + window.location.hostname);
        }
      } finally {
        if (document.getElementById("signInBtn")) {
          btn.disabled = false;
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign in with Google';
        }
      }
    });
  } else {
    const roleBadge = role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Viewer';
    const roleClass = role === 'admin' ? 'role-admin' : role === 'editor' ? 'role-editor' : 'role-viewer';
    statusEl.innerHTML = `
      <img class="auth-avatar" src="${user.photoURL || ''}" alt="" referrerpolicy="no-referrer">
      <span class="auth-name">${user.displayName || user.email}</span>
      <span class="role-badge ${roleClass}">${roleBadge}</span>`;
    let btns = '';
    if (isAdmin()) {
      btns += `<button class="btn btn-sm btn-outline" id="manageRolesBtn" title="Manage team access">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Team</button>`;
    }
    btns += `<button class="btn btn-sm btn-secondary" id="signOutBtn">Sign Out</button>`;
    actionsEl.innerHTML = btns;
    document.getElementById("signOutBtn").addEventListener("click", async () => {
      try { await logOut(); } catch(e) { console.error(e); }
    });
    if (isAdmin()) {
      document.getElementById("manageRolesBtn").addEventListener("click", openRolesModal);
    }
  }

  // Show/hide edit controls based on role
  updateEditVisibility();
}

function updateEditVisibility() {
  const editable = canEdit();
  document.getElementById("newChartBtn").style.display = editable ? "" : "none";
  document.getElementById("editTitleBtn").style.display = editable ? "" : "none";
  document.getElementById("addTaskBtn").style.display = editable ? "" : "none";
  document.getElementById("managePhasesBtn").style.display = editable ? "" : "none";
  document.getElementById("chartActionsContainer").style.display = editable ? "" : "none";
  document.getElementById("deleteChartBtn").style.display = isAdmin() ? "" : "none";
  // Hide edit pencils on rows
  document.querySelectorAll(".row-edit-btn").forEach(b => b.style.display = editable ? "" : "none");
}

// ── Render Orchestrator ────────────────────────────────────
function renderAll() {
  if (!C()) return;
  renderChartTabs();
  renderHeader();
  renderLegend();
  renderFilters();
  renderPills();
  renderGantt();
}

// ── Chart Tabs ─────────────────────────────────────────────
function renderChartTabs() {
  const container = document.getElementById("chartTabs");
  container.innerHTML = "";
  charts.forEach(c => {
    const tab = document.createElement("button");
    tab.className = "chart-tab" + (c.id === activeChartId ? " active" : "");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = c.name;
    tab.appendChild(nameSpan);
    tab.addEventListener("click", () => {
      activeChartId = c.id;
      currentFilter = "all";
      renderAll();
    });
    container.appendChild(tab);
  });
}

// ── Header ─────────────────────────────────────────────────
function renderHeader() {
  const c = C();
  document.getElementById("chartTitle").textContent = c.name;
  document.getElementById("chartSubtitle").textContent = c.subtitle || "";
}

// ── Legend ──────────────────────────────────────────────────
function renderLegend() {
  const container = document.getElementById("legendContainer");
  container.innerHTML = "";
  C().phases.forEach(p => {
    const item = document.createElement("span");
    item.className = "legend-item";
    item.innerHTML = `<span class="dot" style="background:${p.color}"></span>${p.name}`;
    container.appendChild(item);
  });
}

// ── Filters ────────────────────────────────────────────────
function renderFilters() {
  const container = document.getElementById("phaseFilters");
  container.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn" + (currentFilter === "all" ? " active" : "");
  allBtn.textContent = "All";
  allBtn.addEventListener("click", () => { currentFilter = "all"; renderFilters(); renderGantt(); });
  container.appendChild(allBtn);
  C().phases.forEach(p => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (currentFilter === p.id ? " active" : "");
    btn.textContent = p.name;
    btn.addEventListener("click", () => { currentFilter = p.id; renderFilters(); renderGantt(); });
    container.appendChild(btn);
  });
}

// ── Pills ──────────────────────────────────────────────────
function renderPills() {
  const c = C();
  document.getElementById("summaryPills").innerHTML =
    `<span class="pill">Total: ${c.totalDays} days</span>`;
}

// ── Gantt ──────────────────────────────────────────────────
function getDayWidth() { return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gantt-day-w')) || 12; }

function getPhase(phaseId) { return C().phases.find(p => p.id === phaseId); }
function getPhaseColor(task) {
  const pid = task.type === "milestone" ? (task.milestoneType || task.phase) : task.phase;
  const p = getPhase(pid);
  return p ? p.color : "#6b7280";
}

function renderGantt() {
  const c = C();
  const container = document.getElementById("ganttChart");
  const dayW = getDayWidth();
  const totalDays = c.totalDays || 92;
  container.innerHTML = "";

  // Header
  const header = document.createElement("div"); header.className = "gantt-header";
  const hl = document.createElement("div"); hl.className = "gantt-header-label"; hl.textContent = "Task"; header.appendChild(hl);
  const ht = document.createElement("div"); ht.className = "gantt-header-timeline";
  const wc = document.createElement("div"); wc.className = "gantt-week-header"; wc.style.display = "flex"; wc.style.flexDirection = "column";
  const wr = document.createElement("div"); wr.style.display = "flex";
  const dr = document.createElement("div"); dr.className = "gantt-day-labels";
  for (let d = 1; d <= totalDays; d++) {
    if ((d-1) % 7 === 0) { const w = document.createElement("div"); w.className = "gantt-week-label"; w.style.width = (Math.min(7, totalDays - d + 1) * dayW) + "px"; w.textContent = "W" + Math.ceil(d/7); wr.appendChild(w); }
    const dl = document.createElement("div"); dl.className = "gantt-day-label" + ((d-1)%7===0 ? " week-start" : ""); dl.style.width = dayW + "px"; if (d % 5 === 0) dl.textContent = d; dr.appendChild(dl);
  }
  wc.appendChild(wr); wc.appendChild(dr); ht.appendChild(wc); header.appendChild(ht); container.appendChild(header);

  // Body
  const body = document.createElement("div"); body.className = "gantt-body";
  const filtered = c.tasks.filter(t => currentFilter === "all" || t.phase === currentFilter || (t.type === "milestone" && currentFilter === "milestone"));

  filtered.forEach((task, i) => {
    const row = document.createElement("div");
    row.className = "gantt-row" + (task.isHeader ? " phase-header" : "");
    row.style.animationDelay = (i * 15) + "ms";

    const labelCell = document.createElement("div"); labelCell.className = "gantt-row-label";
    if (!task.isHeader) {
      const dot = document.createElement("span"); dot.className = "dot"; dot.style.background = getPhaseColor(task); labelCell.appendChild(dot);
    }
    const lt = document.createElement("span"); lt.className = "label-text"; lt.textContent = task.label; lt.title = task.label; labelCell.appendChild(lt);
    if (task.badge && !task.isHeader) {
      const badge = document.createElement("span"); badge.className = "label-badge";
      const col = getPhaseColor(task);
      badge.style.background = hexToRgba(col, 0.12); badge.style.color = col; badge.textContent = task.badge; labelCell.appendChild(badge);
    }
    if (!task.isHeader && canEdit()) {
      const eb = document.createElement("button"); eb.className = "row-edit-btn"; eb.title = "Edit";
      eb.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      eb.addEventListener("click", (e) => { e.stopPropagation(); openTaskModal(task.id); }); labelCell.appendChild(eb);
    }
    row.appendChild(labelCell);

    const tc = document.createElement("div"); tc.className = "gantt-row-timeline";
    for (let d = 1; d <= totalDays; d++) { if ((d-1)%7===0) { const gl = document.createElement("div"); gl.className = "gantt-gridline week-line"; gl.style.left = ((d-1)*dayW)+"px"; tc.appendChild(gl); } }

    if (!task.isHeader && task.start != null) {
      if (task.isMilestone) {
        const dm = document.createElement("div"); dm.className = "gantt-milestone"; dm.style.background = getPhaseColor(task);
        dm.style.left = ((task.start-1)*dayW + dayW/2)+"px"; dm.dataset.taskId = task.id;
        dm.addEventListener("click", () => showDetails(task));
        if (canEdit()) {
          dm.addEventListener("dblclick", (e) => { e.stopPropagation(); openTaskModal(task.id); });
          makeMilestoneDraggable(dm, task, totalDays);
        }
        tc.appendChild(dm);
      } else {
        const bar = document.createElement("div"); bar.className = "gantt-bar";
        const col = getPhaseColor(task);
        bar.style.background = hexToRgba(col, 0.15); bar.style.border = "1.5px solid " + hexToRgba(col, 0.35); bar.style.color = col;
        bar.style.left = ((task.start-1)*dayW)+"px"; bar.style.width = ((task.end - task.start + 1)*dayW)+"px";
        bar.style.animationDelay = (i*25+60)+"ms"; bar.dataset.taskId = task.id;

        if (canEdit()) {
          const hL = document.createElement("div"); hL.className = "bar-handle bar-handle-left";
          const hR = document.createElement("div"); hR.className = "bar-handle bar-handle-right";
          bar.appendChild(hL); bar.appendChild(hR);
          makeBarDraggable(bar, task, totalDays);
          makeBarResizable(hL, task, "left", totalDays); makeBarResizable(hR, task, "right", totalDays);
        }

        bar.addEventListener("click", (e) => { if (!e.target.classList.contains("bar-handle")) { selectTask(task.id); showDetails(task); } });
        if (canEdit()) {
          bar.addEventListener("dblclick", (e) => { e.stopPropagation(); openTaskModal(task.id); });
        }
        tc.appendChild(bar);
      }
    }
    row.appendChild(tc); body.appendChild(row);
  });
  container.appendChild(body);
}

// ── Selection & Details ────────────────────────────────────
function selectTask(id) {
  document.querySelectorAll(".gantt-bar.selected").forEach(b => b.classList.remove("selected"));
  const bar = document.querySelector(`.gantt-bar[data-task-id="${id}"]`);
  if (bar) bar.classList.add("selected");
}

function showDetails(task) {
  const panel = document.getElementById("detailsContent");
  const col = getPhaseColor(task);
  const p = getPhase(task.phase);
  let html = `<div class="details-title"><span class="dot" style="width:12px;height:12px;background:${col}"></span>${task.label}</div><div class="details-meta">`;
  if (task.start != null && task.end != null && task.start !== task.end) html += `<div class="details-meta-item"><strong>Duration:</strong> Day ${task.start} → ${task.end} (${task.end-task.start+1} days)</div>`;
  else if (task.start != null) html += `<div class="details-meta-item"><strong>Target:</strong> Day ${task.start}</div>`;
  if (p) html += `<div class="details-meta-item"><strong>Phase:</strong> ${p.name}</div>`;
  html += `</div><div class="details-description">${task.description||''}`;
  if (task.details?.length) html += `<ul>${task.details.map(d=>`<li>${d}</li>`).join("")}</ul>`;
  html += `</div>`;
  panel.innerHTML = html;
}

// ── Drag / Resize ─────────────────────────────────────────
function makeBarDraggable(bar, task, totalDays) {
  let sx, os, oe, drag=false;
  const dw = () => getDayWidth();
  function down(e) { if(e.target.classList.contains("bar-handle"))return; e.preventDefault(); drag=true; sx=e.clientX||(e.touches&&e.touches[0].clientX); os=task.start; oe=task.end; bar.classList.add("dragging"); document.addEventListener("mousemove",move); document.addEventListener("mouseup",up); document.addEventListener("touchmove",move,{passive:false}); document.addEventListener("touchend",up); }
  function move(e) { if(!drag)return; e.preventDefault(); const cx=e.clientX||(e.touches&&e.touches[0].clientX); const dd=Math.round((cx-sx)/dw()); const dur=oe-os; let ns=os+dd,ne=ns+dur; if(ns<1){ns=1;ne=1+dur;} if(ne>totalDays){ne=totalDays;ns=totalDays-dur;} task.start=ns;task.end=ne; bar.style.left=((ns-1)*dw())+"px"; showDragTooltip(e,`Day ${ns} → ${ne}`); }
  function up() { drag=false; bar.classList.remove("dragging"); task.badge=genBadge(task.start,task.end); removeDragTooltip(); renderGantt(); showDetails(task); scheduleSave(); document.removeEventListener("mousemove",move); document.removeEventListener("mouseup",up); document.removeEventListener("touchmove",move); document.removeEventListener("touchend",up); }
  bar.addEventListener("mousedown",down); bar.addEventListener("touchstart",down,{passive:false});
}
function makeBarResizable(handle, task, side, totalDays) {
  let sx,os,oe,drag=false;
  const dw=()=>getDayWidth();
  function down(e){e.preventDefault();e.stopPropagation();drag=true;sx=e.clientX||(e.touches&&e.touches[0].clientX);os=task.start;oe=task.end;document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);document.addEventListener("touchmove",move,{passive:false});document.addEventListener("touchend",up);}
  function move(e){if(!drag)return;e.preventDefault();const cx=e.clientX||(e.touches&&e.touches[0].clientX);const dd=Math.round((cx-sx)/dw());if(side==="left")task.start=Math.max(1,Math.min(os+dd,task.end-1));else task.end=Math.min(totalDays,Math.max(oe+dd,task.start+1));const b=handle.parentElement;b.style.left=((task.start-1)*dw())+"px";b.style.width=((task.end-task.start+1)*dw())+"px";showDragTooltip(e,`Day ${task.start} → ${task.end} (${task.end-task.start+1}d)`);}
  function up(){drag=false;task.badge=genBadge(task.start,task.end);removeDragTooltip();renderGantt();showDetails(task);scheduleSave();document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);document.removeEventListener("touchmove",move);document.removeEventListener("touchend",up);}
  handle.addEventListener("mousedown",down);handle.addEventListener("touchstart",down,{passive:false});
}
function makeMilestoneDraggable(el, task, totalDays) {
  let sx,os,drag=false;const dw=()=>getDayWidth();
  function down(e){e.preventDefault();drag=true;sx=e.clientX||(e.touches&&e.touches[0].clientX);os=task.start;document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);}
  function move(e){if(!drag)return;const dd=Math.round((e.clientX-sx)/dw());let nd=Math.max(1,Math.min(totalDays,os+dd));task.start=nd;task.end=nd;el.style.left=((nd-1)*dw()+dw()/2)+"px";showDragTooltip(e,`Day ${nd}`);}
  function up(){drag=false;task.badge="Day "+task.start;removeDragTooltip();renderGantt();showDetails(task);scheduleSave();document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);}
  el.addEventListener("mousedown",down);
}
function showDragTooltip(e,text){let t=document.querySelector(".drag-tooltip");if(!t){t=document.createElement("div");t.className="drag-tooltip";document.body.appendChild(t);}t.textContent=text;const cx=e.clientX||(e.touches&&e.touches[0].clientX)||0;const cy=e.clientY||(e.touches&&e.touches[0].clientY)||0;t.style.left=(cx+14)+"px";t.style.top=(cy-28)+"px";}
function removeDragTooltip(){const t=document.querySelector(".drag-tooltip");if(t)t.remove();}
function genBadge(s,e){return s===e?"Day "+s:"Days "+s+"–"+e;}

// ── Task Modal ─────────────────────────────────────────────
let editingTaskId = null, isNewTask = false;
const taskOverlay = document.getElementById("taskModalOverlay");
const taskForm = document.getElementById("taskForm");

function populatePhaseSelects() {
  const c = C();
  ["editPhase","editType"].forEach(sid => {
    const sel = document.getElementById(sid);
    sel.innerHTML = "";
    c.phases.forEach(p => {
      const o = document.createElement("option"); o.value = p.id; o.textContent = p.name + (sid==="editType"?" Bar":""); sel.appendChild(o);
    });
    if (sid === "editType") {
      const mo = document.createElement("option"); mo.value = "milestone"; mo.textContent = "Milestone Diamond"; sel.appendChild(mo);
    }
  });
}

function openTaskModal(taskId) {
  if (!canEdit()) return;
  const c = C(); const task = c.tasks.find(t=>t.id===taskId); if(!task) return;
  editingTaskId = taskId; isNewTask = false;
  populatePhaseSelects();
  document.getElementById("taskModalTitle").textContent = "Edit Task";
  document.getElementById("editLabel").value = task.label;
  document.getElementById("editPhase").value = task.phase;
  document.getElementById("editType").value = task.type || task.phase;
  document.getElementById("editStart").value = task.start || 1;
  document.getElementById("editEnd").value = task.end || 1;
  document.getElementById("editBadge").value = task.badge || "";
  document.getElementById("editDesc").value = task.description || "";
  document.getElementById("editDetails").value = (task.details||[]).join("\n");
  document.getElementById("deleteTaskBtn").style.display = "";
  taskOverlay.classList.add("open");
  document.getElementById("editLabel").focus();
}

function openNewTaskModal() {
  if (!canEdit()) return;
  isNewTask = true; editingTaskId = null;
  populatePhaseSelects();
  document.getElementById("taskModalTitle").textContent = "Add New Task";
  document.getElementById("editLabel").value = "";
  document.getElementById("editPhase").value = C().phases[0]?.id || "";
  document.getElementById("editType").value = C().phases[0]?.id || "";
  document.getElementById("editStart").value = 1;
  document.getElementById("editEnd").value = 10;
  document.getElementById("editBadge").value = "";
  document.getElementById("editDesc").value = "";
  document.getElementById("editDetails").value = "";
  document.getElementById("deleteTaskBtn").style.display = "none";
  taskOverlay.classList.add("open");
  document.getElementById("editLabel").focus();
}

function closeTaskModal() { taskOverlay.classList.remove("open"); }

taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const c = C();
  const label = document.getElementById("editLabel").value.trim();
  const phase = document.getElementById("editPhase").value;
  const type = document.getElementById("editType").value;
  const start = parseInt(document.getElementById("editStart").value) || 1;
  const end = parseInt(document.getElementById("editEnd").value) || start;
  const badge = document.getElementById("editBadge").value.trim() || genBadge(start, type==="milestone"?start:Math.max(start,end));
  const desc = document.getElementById("editDesc").value.trim();
  const detailsRaw = document.getElementById("editDetails").value.trim();
  const details = detailsRaw ? detailsRaw.split("\n").filter(l=>l.trim()) : [];
  const isMilestone = type === "milestone";
  const finalEnd = isMilestone ? start : Math.max(start, end);

  if (isNewTask) {
    let idx = c.tasks.length;
    for (let i = c.tasks.length-1; i >= 0; i--) { if(c.tasks[i].phase===phase && !c.tasks[i].isHeader){idx=i+1;break;} }
    if (idx===c.tasks.length) { for(let i=0;i<c.tasks.length;i++){if(c.tasks[i].phase===phase&&c.tasks[i].isHeader){idx=i+1;break;}} }
    c.tasks.splice(idx, 0, { id:uid(), label, phase, type, start, end:finalEnd, badge, description:desc, details, isMilestone, milestoneType:isMilestone?phase:undefined });
  } else {
    const task = c.tasks.find(t=>t.id===editingTaskId); if(!task)return;
    Object.assign(task, { label, phase, type, start, end:finalEnd, badge, description:desc, details, isMilestone, milestoneType:isMilestone?phase:undefined });
  }
  closeTaskModal(); renderAll(); scheduleSave();
});

document.getElementById("deleteTaskBtn").addEventListener("click", async () => {
  if(!editingTaskId) return;
  const c = C(); c.tasks = c.tasks.filter(t=>t.id!==editingTaskId);
  closeTaskModal(); document.getElementById("detailsContent").innerHTML='<p class="details-hint">Task deleted.</p>'; renderAll(); scheduleSave();
});

document.getElementById("taskModalClose").addEventListener("click", closeTaskModal);
document.getElementById("taskCancelBtn").addEventListener("click", closeTaskModal);
taskOverlay.addEventListener("click", (e) => { if(e.target===taskOverlay) closeTaskModal(); });

document.getElementById("addTaskBtn").addEventListener("click", openNewTaskModal);

// ── Phase Manager Modal ────────────────────────────────────
const phaseOverlay = document.getElementById("phaseModalOverlay");

function openPhaseManager() {
  if (!canEdit()) return;
  renderPhaseList(); phaseOverlay.classList.add("open");
}
function closePhaseManager() { phaseOverlay.classList.remove("open"); renderAll(); scheduleSave(); }

function renderPhaseList() {
  const c = C(); const body = document.getElementById("phaseManagerBody"); body.innerHTML = "";
  c.phases.forEach((p, idx) => {
    const row = document.createElement("div"); row.className = "phase-row";

    // Reorder arrows
    const arrows = document.createElement("div"); arrows.className = "phase-arrows";
    const upBtn = document.createElement("button"); upBtn.className = "phase-arrow-btn"; upBtn.title = "Move up";
    upBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>';
    upBtn.disabled = idx === 0;
    upBtn.addEventListener("click", () => { swapPhases(c, idx, idx - 1); renderPhaseList(); });
    const downBtn = document.createElement("button"); downBtn.className = "phase-arrow-btn"; downBtn.title = "Move down";
    downBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
    downBtn.disabled = idx === c.phases.length - 1;
    downBtn.addEventListener("click", () => { swapPhases(c, idx, idx + 1); renderPhaseList(); });
    arrows.appendChild(upBtn); arrows.appendChild(downBtn);
    row.appendChild(arrows);

    const swatch = document.createElement("div"); swatch.className = "phase-swatch"; swatch.style.background = p.color;
    const colorInput = document.createElement("input"); colorInput.type = "color"; colorInput.value = p.color;
    colorInput.addEventListener("input", (e) => { p.color = e.target.value; swatch.style.background = p.color; });
    swatch.addEventListener("click", () => colorInput.click());
    row.appendChild(swatch); row.appendChild(colorInput);
    const nameEl = document.createElement("input"); nameEl.className = "phase-name phase-input"; nameEl.value = p.name;
    nameEl.style.border = "none"; nameEl.style.background = "transparent"; nameEl.style.padding = "0";
    nameEl.addEventListener("change", () => { p.name = nameEl.value.trim() || p.name; });
    row.appendChild(nameEl);
    const count = document.createElement("span"); count.className = "phase-count";
    const taskCount = c.tasks.filter(t=>t.phase===p.id && !t.isHeader).length;
    count.textContent = taskCount + " task" + (taskCount!==1?"s":"");
    row.appendChild(count);
    const del = document.createElement("button"); del.className = "phase-del"; del.title = "Remove phase";
    del.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    del.addEventListener("click", () => {
      if (taskCount > 0 && !confirm(`Phase "${p.name}" has ${taskCount} tasks. Delete phase and all its tasks?`)) return;
      c.tasks = c.tasks.filter(t => t.phase !== p.id);
      c.phases = c.phases.filter(ph => ph.id !== p.id);
      renderPhaseList();
    });
    row.appendChild(del);
    body.appendChild(row);
  });
}

function swapPhases(chart, fromIdx, toIdx) {
  const phases = chart.phases;
  [phases[fromIdx], phases[toIdx]] = [phases[toIdx], phases[fromIdx]];
  // Also reorder tasks: group tasks by phase in the new phase order
  const tasksByPhase = new Map();
  phases.forEach(p => tasksByPhase.set(p.id, []));
  // Catch tasks whose phase isn't in the list (shouldn't happen but safe)
  const orphans = [];
  chart.tasks.forEach(t => {
    if (tasksByPhase.has(t.phase)) tasksByPhase.get(t.phase).push(t);
    else orphans.push(t);
  });
  chart.tasks = [];
  phases.forEach(p => { chart.tasks.push(...tasksByPhase.get(p.id)); });
  chart.tasks.push(...orphans);
}

document.getElementById("addPhaseBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("newPhaseName");
  const colorInput = document.getElementById("newPhaseColor");
  const name = nameInput.value.trim(); if(!name) return;
  const c = C();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+$/,"") + "-" + uid();
  c.phases.push({ id, name, color:colorInput.value });
  c.tasks.push({ id:uid(), label:name, phase:id, isHeader:true });
  nameInput.value = "";
  renderPhaseList();
});

document.getElementById("managePhasesBtn").addEventListener("click", openPhaseManager);
document.getElementById("phaseModalClose").addEventListener("click", closePhaseManager);
document.getElementById("phaseModalDone").addEventListener("click", closePhaseManager);
phaseOverlay.addEventListener("click", (e) => { if(e.target===phaseOverlay) closePhaseManager(); });

// ── Chart Modal (New / Duplicate) ──────────────────────────
const chartOverlay = document.getElementById("chartModalOverlay");
const chartForm = document.getElementById("chartForm");
let duplicatingFrom = null;

document.getElementById("newChartBtn").addEventListener("click", () => {
  if (!canEdit()) return;
  duplicatingFrom = null;
  document.getElementById("chartModalTitle").textContent = "New Chart";
  document.getElementById("chartNameInput").value = "";
  document.getElementById("chartSubInput").value = "";
  document.getElementById("chartDaysInput").value = 90;
  document.getElementById("chartTemplateSelect").value = "blank";
  document.getElementById("chartTemplateSelect").parentElement.style.display = "";
  chartOverlay.classList.add("open");
  document.getElementById("chartNameInput").focus();
});

document.getElementById("duplicateChartBtn").addEventListener("click", () => {
  if (!canEdit()) return;
  const c = C();
  duplicatingFrom = c.id;
  document.getElementById("chartModalTitle").textContent = "Duplicate Chart";
  document.getElementById("chartNameInput").value = c.name + " (Copy)";
  document.getElementById("chartSubInput").value = c.subtitle || "";
  document.getElementById("chartDaysInput").value = c.totalDays;
  document.getElementById("chartTemplateSelect").parentElement.style.display = "none";
  chartOverlay.classList.add("open");
  document.getElementById("chartNameInput").focus();
});

function closeChartModal() { chartOverlay.classList.remove("open"); duplicatingFrom = null; }

chartForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("chartNameInput").value.trim(); if(!name) return;
  const sub = document.getElementById("chartSubInput").value.trim();
  const days = parseInt(document.getElementById("chartDaysInput").value) || 90;
  const newId = "chart-" + uid();

  let newChart;
  if (duplicatingFrom) {
    const src = charts.find(c=>c.id===duplicatingFrom);
    newChart = JSON.parse(JSON.stringify(src));
    newChart.id = newId; newChart.name = name; newChart.subtitle = sub; newChart.totalDays = days;
    newChart.tasks.forEach(t => { t.id = uid(); });
  } else {
    const tmpl = document.getElementById("chartTemplateSelect").value;
    const data = tmpl === "zego" ? zegoTemplate() : tmpl === "amrent" ? amrentTemplate() : tmpl === "avidxchange" ? avidxchangeTemplate() : blankTemplate();
    newChart = { id:newId, name, subtitle:sub, totalDays:days+2, ...data };
  }

  await createChart(newChart);
  activeChartId = newId; currentFilter = "all";
  closeChartModal();
});

document.getElementById("chartModalClose").addEventListener("click", closeChartModal);
document.getElementById("chartCancelBtn").addEventListener("click", closeChartModal);
chartOverlay.addEventListener("click", (e) => { if(e.target===chartOverlay) closeChartModal(); });

// Delete chart button
document.getElementById("deleteChartBtn").addEventListener("click", async () => {
  if (!canEdit()) return;
  if (charts.length <= 1) { alert("Cannot delete the only chart."); return; }
  if (!confirm("Delete chart \"" + C().name + "\"?")) return;
  await deleteChart(activeChartId);
});

// ── Edit Title Inline ──────────────────────────────────────
document.getElementById("editTitleBtn").addEventListener("click", () => {
  if (!canEdit()) return;
  const el = document.getElementById("chartTitle");
  el.contentEditable = "true"; el.focus();
  const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
});
document.getElementById("chartTitle").addEventListener("blur", () => {
  const el = document.getElementById("chartTitle"); el.contentEditable = "false";
  const c = C(); c.name = el.textContent.trim() || c.name; renderChartTabs(); scheduleSave();
});
document.getElementById("chartTitle").addEventListener("keydown", (e) => { if(e.key==="Enter"){e.preventDefault(); document.getElementById("chartTitle").blur();} });

// ── Roles Manager Modal (Admin) ────────────────────────────
const rolesOverlay = document.getElementById("rolesModalOverlay");

async function openRolesModal() {
  if (!isAdmin()) return;
  await renderRolesList();
  rolesOverlay.classList.add("open");
}

function closeRolesModal() { rolesOverlay.classList.remove("open"); }

async function renderRolesList() {
  const roles = await getAllRoles();
  const body = document.getElementById("rolesBody");
  body.innerHTML = "";
  body.style.padding = "var(--space-2) var(--space-5)";
  body.style.display = "flex";
  body.style.flexDirection = "column";
  body.style.gap = "var(--space-2)";

  if (roles.length === 0) {
    body.innerHTML = '<p style="color:var(--color-text-faint); font-size:var(--text-sm); text-align:center; padding:var(--space-4)">No team members yet. Add someone below.</p>';
    return;
  }

  roles.forEach(r => {
    const wrapper = document.createElement("div"); wrapper.className = "role-entry";
    const row = document.createElement("div");
    row.className = "phase-row";
    // Avatar placeholder
    const avatar = document.createElement("div");
    avatar.style.cssText = "width:28px;height:28px;border-radius:50%;background:var(--color-accent-bg);color:var(--color-accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0";
    avatar.textContent = (r.email || "?")[0].toUpperCase();
    row.appendChild(avatar);
    // Email
    const emailEl = document.createElement("span");
    emailEl.style.cssText = "flex:1;font-size:var(--text-sm);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    emailEl.textContent = r.email;
    emailEl.title = r.email;
    row.appendChild(emailEl);
    // Role selector
    const roleSel = document.createElement("select");
    roleSel.className = "phase-input";
    roleSel.style.cssText = "flex:0 0 auto;width:100px;font-size:var(--text-xs);padding:4px 8px";
    ["admin","editor","viewer"].forEach(v => {
      const opt = document.createElement("option");
      opt.value = v; opt.textContent = v.charAt(0).toUpperCase() + v.slice(1);
      if (v === r.role) opt.selected = true;
      roleSel.appendChild(opt);
    });
    const isSelf = r.email === getUser()?.email;
    if (isSelf) roleSel.disabled = true;
    roleSel.addEventListener("change", async () => {
      await setUserRole(r.email, roleSel.value);
    });
    row.appendChild(roleSel);
    // Remove button
    if (!isSelf) {
      const del = document.createElement("button"); del.className = "phase-del"; del.title = "Remove";
      del.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      del.addEventListener("click", async () => {
        if (!confirm(`Remove ${r.email} from the team?`)) return;
        await removeUser(r.email);
        await renderRolesList();
      });
      row.appendChild(del);
    }
    wrapper.appendChild(row);

    // Chart access row (not shown for admins — they see everything)
    if (r.role !== 'admin') {
      const accessRow = document.createElement("div"); accessRow.className = "chart-access-row";
      const accessLabel = document.createElement("span"); accessLabel.className = "chart-access-label";
      accessLabel.textContent = "Charts:";
      accessRow.appendChild(accessLabel);

      const currentAccess = r.chartAccess || []; // empty = all charts
      const allChartsOpt = document.createElement("label"); allChartsOpt.className = "chart-access-chip";
      const allCb = document.createElement("input"); allCb.type = "checkbox";
      allCb.checked = currentAccess.length === 0;
      allCb.addEventListener("change", async () => {
        if (allCb.checked) {
          await setUserChartAccess(r.email, []);
          // Uncheck individual boxes
          accessRow.querySelectorAll('.chart-access-chip input[data-chart-id]').forEach(cb => cb.checked = false);
        }
      });
      const allSpan = document.createElement("span"); allSpan.textContent = "All";
      allChartsOpt.appendChild(allCb); allChartsOpt.appendChild(allSpan);
      accessRow.appendChild(allChartsOpt);

      charts.forEach(ch => {
        const chip = document.createElement("label"); chip.className = "chart-access-chip";
        const cb = document.createElement("input"); cb.type = "checkbox"; cb.dataset.chartId = ch.id;
        cb.checked = currentAccess.includes(ch.id);
        cb.addEventListener("change", async () => {
          // Gather selected chart IDs
          const selected = [];
          accessRow.querySelectorAll('input[data-chart-id]:checked').forEach(el => selected.push(el.dataset.chartId));
          // If none selected or all selected, treat as "all"
          if (selected.length === 0 || selected.length === charts.length) {
            await setUserChartAccess(r.email, []);
            allCb.checked = true;
          } else {
            await setUserChartAccess(r.email, selected);
            allCb.checked = false;
          }
        });
        const sp = document.createElement("span"); sp.textContent = ch.name;
        chip.appendChild(cb); chip.appendChild(sp);
        accessRow.appendChild(chip);
      });
      wrapper.appendChild(accessRow);
    }

    body.appendChild(wrapper);
  });
}

document.getElementById("addUserBtn").addEventListener("click", async () => {
  const emailInput = document.getElementById("newUserEmail");
  const roleSelect = document.getElementById("newUserRole");
  const email = emailInput.value.trim().toLowerCase();
  if (!email || !email.includes("@")) return;
  await setUserRole(email, roleSelect.value);
  emailInput.value = "";
  await renderRolesList();
});

document.getElementById("rolesModalClose").addEventListener("click", closeRolesModal);
document.getElementById("rolesModalDone").addEventListener("click", closeRolesModal);
rolesOverlay.addEventListener("click", (e) => { if(e.target===rolesOverlay) closeRolesModal(); });

// ── Escape key ─────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeTaskModal(); closePhaseManager(); closeChartModal(); closeRolesModal(); }
});

// ── Theme Toggle ───────────────────────────────────────────
(function(){const t=document.querySelector("[data-theme-toggle]"),r=document.documentElement;let d=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";r.setAttribute("data-theme",d);upd();t&&t.addEventListener("click",()=>{d=d==="dark"?"light":"dark";r.setAttribute("data-theme",d);upd();if(C())renderGantt();});function upd(){if(!t)return;t.innerHTML=d==="dark"?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';}})();

// ── Init ───────────────────────────────────────────────────
setOnAuthUpdate(async (user, role) => {
  renderAuthBar();
  // Re-render to show/hide edit controls
  if (charts.length > 0) renderAll();
  // If user just signed in and DB is empty, seed default data
  if (user && charts.length === 0) {
    await seedDefaultIfEmpty(zegoTemplate, uid);
  }
});

// Wait for auth, then seed data + subscribe
authReady.then(async () => {
  renderAuthBar();
  // Only seed if signed in (needs write permission)
  if (getUser()) {
    await seedDefaultIfEmpty(zegoTemplate, uid);
  }
  subscribeToCharts(async (updatedCharts) => {
    // Filter charts by user access (admins see all)
    if (getUser() && !isAdmin()) {
      const access = await getUserChartAccess(getUser().email);
      if (access && access.length > 0) {
        charts = updatedCharts.filter(c => access.includes(c.id));
      } else {
        charts = updatedCharts; // empty = all charts
      }
    } else {
      charts = updatedCharts;
    }
    if (!activeChartId || !charts.find(c => c.id === activeChartId)) {
      activeChartId = charts[0]?.id || null;
      currentFilter = "all";
    }
    renderAll();
    // If user just signed in and DB is still empty, seed now
    if (getUser() && updatedCharts.length === 0) {
      seedDefaultIfEmpty(zegoTemplate, uid);
    }
  });
});
