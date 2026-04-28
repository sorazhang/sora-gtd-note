# Tech Stack — GTD Note System

## Overview

A fully static web app with cloud sync. No server, no build step, no framework.

```
Browser
  └── Vercel (static host)
        └── index.html + app.js + styles.css
              └── Firebase
                    ├── Authentication (Google OAuth)
                    └── Firestore (cloud database)
```

---

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| Hosting | Vercel | Serves static files, auto-deploys on git push |
| Frontend | Vanilla HTML / CSS / JS | No framework, no build step |
| Local storage | Browser localStorage | Instant reads/writes, offline support |
| Auth | Firebase Authentication | Google Sign-in (OAuth 2.0) |
| Database | Firebase Firestore | Cloud sync across devices |

---

## Project Structure

```
project/
├── index.html       # App shell, all modals, Firebase SDK script tags
├── app.js           # All logic — state, rendering, Firebase sync
├── styles.css       # All styles
└── techstack.md     # This file
```

No `package.json`, no bundler, no dependencies to install.

---

## Vercel Setup

1. Push repo to GitHub
2. Import project at vercel.com → select repo
3. No build command needed — output directory is `/` (root)
4. Vercel watches a specific branch and redeploys on every push

**Cache busting** — since Vercel CDN caches aggressively, append a version
query string to JS/CSS files and increment it on each deploy:
```html
<link rel="stylesheet" href="styles.css?v=11">
<script src="app.js?v=12"></script>
```

---

## Firebase Setup

### 1. Create project
- Go to console.firebase.google.com
- Create new project (or use existing)

### 2. Enable Google Sign-in
- Authentication → Sign-in method → Google → Enable → Save

### 3. Add authorised domains
- Authentication → Settings → Authorised domains → Add domain
- Add your Vercel domain e.g. `your-app.vercel.app`
- `localhost` is already there by default (for local dev)

### 4. Create Firestore database
- Firestore Database → Create database → Production mode → choose region

### 5. Set Firestore security rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
This ensures each user can only access their own data.

### 6. Get your Firebase config
- Project Settings → Your apps → SDK setup → Config
- Copy the `firebaseConfig` object into your app

```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project",
  storageBucket:     "your-project.firebasestorage.app",
  messagingSenderId: "...",
  appId:             "..."
};
```

---

## Loading Firebase SDK

No npm install needed — load directly from Google's CDN in `index.html`
before your `app.js` script tag:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script src="app.js?v=1"></script>
```

The compat SDK exposes a global `firebase` object — no imports needed.

---

## Sync Architecture

### Data flow on edit
```
User edits data
  → localStorage updated immediately   (instant, synchronous)
  → 1.5s debounce timer starts
  → timer fires → write to Firestore   (async, background)
  → header shows ☁ Synced
```

### Data flow on login / new device
```
Firebase Auth restores session
  → pullFromCloud() fetches Firestore document
  → if cloud has data  → overwrite localStorage → re-render app
  → if no cloud data   → upload localStorage to Firestore (first sign-in)
```

### Key pattern — localStorage as cache, Firestore as source of truth
- All UI reads from localStorage → always instant, works offline
- All writes go to localStorage first, then async to Firestore
- On login, Firestore always wins (cloud is canonical)

### Debounce to avoid excessive Firestore writes
```js
let scheduleSync = () => {}; // no-op until Firebase ready

// Reassigned after Firebase.initializeApp():
scheduleSync = function () {
  if (!_fbUser || _suppressSync) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(pushToCloud, 1500);
};
```

### Suppress sync during pull (avoid write-back loop)
```js
async function pullFromCloud() {
  _suppressSync = true;
  // write Firestore data to localStorage (triggers scheduleSync)
  // but _suppressSync blocks it
  _suppressSync = false;
}
```

---

## Firestore Data Structure

Each signed-in user has one document:

```
Firestore
└── users/
      └── {google-uid}/          ← one document per user
            ├── tasks: [...]      ← array of task objects
            ├── projects: [...]   ← array of project objects
            ├── weekNotes: {...}  ← map keyed by "YYYY-Www" or "YYYY-MM-DD"
            ├── uiState: {...}    ← last active view, selected week, etc.
            └── updatedAt: ...    ← server timestamp
```

Keeping everything in one document per user is simple and fits well within
Firestore's 1MB document limit for a personal productivity app.

---

## Multi-user isolation

Because the Firestore security rule uses `{userId}` matched against
`request.auth.uid`, each Google account sees only its own data.
Anyone with a Google account can sign in and get their own private workspace.

---

## Local Development

No server needed — open `index.html` directly in a browser, or use any
static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

`localhost` is pre-authorised in Firebase so sign-in works locally too.

---

## Checklist for a new project using this stack

- [ ] Create GitHub repo
- [ ] Import to Vercel, set watched branch
- [ ] Create Firebase project
- [ ] Enable Google Sign-in in Firebase Auth
- [ ] Create Firestore database
- [ ] Set Firestore security rules
- [ ] Add Vercel domain to Firebase authorised domains
- [ ] Add Firebase config to app.js
- [ ] Add Firebase compat SDK script tags to index.html
- [ ] Implement localStorage + debounced Firestore sync pattern
- [ ] Add version query strings to CSS/JS for cache busting
