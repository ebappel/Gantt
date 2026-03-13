# Gantt Chart Manager — Firebase Setup Guide

This guide walks you through setting up Firebase so your Gantt charts persist and sync across your entire team.

**Time required:** ~10 minutes  
**Cost:** Free (Firebase Spark plan covers this easily)

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** (or **"Add project"**)
3. Name it something like `gantt-charts` (any name works)
4. Disable Google Analytics (not needed) and click **Create project**
5. Wait for it to finish, then click **Continue**

## Step 2: Add a Web App

1. On the project overview page, click the **Web icon** (`</>`)
2. Give it a nickname like `gantt-web`
3. **Skip** Firebase Hosting (you're using GitHub Pages)
4. Click **Register app**
5. You'll see a config block like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "gantt-charts-xxxxx.firebaseapp.com",
  projectId: "gantt-charts-xxxxx",
  storageBucket: "gantt-charts-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. Open `firebase-config.js` in your repo and replace the placeholder values with your real config values
7. Commit and push to GitHub

## Step 3: Enable Google Authentication

1. In the Firebase Console, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, click **Google**
4. Toggle **Enable** on
5. Select your email as the **Project support email**
6. Click **Save**

### Add your GitHub Pages domain

1. Still in Authentication, go to the **Settings** tab
2. Under **Authorized domains**, click **Add domain**
3. Add your GitHub Pages domain: `YOUR-USERNAME.github.io`
4. Click **Add**

## Step 4: Create the Firestore Database

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose a location closest to your team (e.g., `us-east1`)
4. Select **Start in test mode** for now (we'll secure it next)
5. Click **Create**

## Step 5: Set Security Rules

1. In Firestore, go to the **Rules** tab
2. Replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Charts — anyone signed in can read, editors/admins can write
    match /charts/{chartId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        exists(/databases/$(database)/documents/roles/$(request.auth.token.email)) &&
        get(/databases/$(database)/documents/roles/$(request.auth.token.email)).data.role in ['admin', 'editor'];
    }

    // Roles — only admins can read/write
    match /roles/{email} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        (
          // Allow first user to create their own admin role
          !exists(/databases/$(database)/documents/roles/$(request.auth.token.email)) &&
          resource == null &&
          email == request.auth.token.email
        ) ||
        (
          exists(/databases/$(database)/documents/roles/$(request.auth.token.email)) &&
          get(/databases/$(database)/documents/roles/$(request.auth.token.email)).data.role == 'admin'
        );
    }
  }
}
```

3. Click **Publish**

## Step 6: Deploy to GitHub Pages

1. Commit and push all files to your GitHub repo
2. Make sure GitHub Pages is enabled (Settings → Pages → Source: main branch)
3. Visit your GitHub Pages URL
4. Sign in with Google — you'll automatically become the **Admin** (first user)
5. Click the **"Team"** button to add colleagues as Editors or Viewers

---

## How It Works

### Roles
- **Admin** — Full access. Can edit charts, manage phases, and add/remove team members. The first person to sign in becomes Admin.
- **Editor** — Can create, edit, drag, and delete charts and tasks. Cannot manage team roles.
- **Viewer** — Can view all charts and filter by phase, but cannot make changes.

### Real-Time Sync
- Changes save automatically to Firebase within ~600ms
- All connected users see changes in real-time via Firestore listeners
- If two people edit the same chart simultaneously, the last save wins

### Access Control
- Admins manage roles via the **"Team"** button in the auth bar
- Add team members by typing their Google email and selecting Editor or Viewer
- Team members must sign in with the Google account matching the email you added

---

## Troubleshooting

**"Sign in with Google" doesn't work:**
- Make sure you added your GitHub Pages domain to Firebase Authentication → Settings → Authorized domains

**Changes don't save:**
- Verify you're signed in and your role is Admin or Editor
- Check browser console for Firestore permission errors
- Make sure the security rules from Step 5 are published

**Page shows "Loading..." forever:**
- Check that `firebase-config.js` has your real Firebase config values (not the placeholders)
- Verify Firestore database was created (Step 4)

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Main page with auth bar, modals, Firebase SDK imports |
| `style.css` | All styles including auth/role UI |
| `app.js` | Gantt chart logic with Firebase integration |
| `db.js` | Firebase auth + Firestore database layer |
| `firebase-config.js` | Your Firebase project config (edit this) |
