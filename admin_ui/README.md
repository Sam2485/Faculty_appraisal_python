# Admin UI — Teammate Onboarding

**Your working folder is `admin_ui/`. Do not touch anything outside it.**

---

## Getting started

```bash
cd admin_ui
npm install
npm run dev
```

Open `http://localhost:5174/panel/` in your browser.

The FastAPI backend must also be running at the same time:
```bash
# In the project root (separate terminal)
uvicorn main:app --reload --port 8000
```
API calls from your React app automatically go to the backend via the dev proxy — no extra setup needed.

---

## Two things you must not change

| File | What it does | Why it matters |
|---|---|---|
| `vite.config.js` | Sets `base: '/panel/'` and proxies `/api` to the backend | Changing this breaks both local dev and production |
| `src/main.jsx` | Sets `basename="/panel"` on the router | Changing this breaks all navigation in production |

Everything else inside `admin_ui/` is yours to work on freely.

---

## Making API calls

A pre-built API client is already set up at `src/api/client.js`.
Import and use it — don't write raw `fetch('/api/v1/...')` calls scattered across components.
If you need a new endpoint, add a method to `client.js`.

```js
import { api } from '../api/client'

// Auth
await api.login(email, password)
api.logout()
api.getProfile()                        // returns the stored admin profile

// Faculty / users
await api.users.list({ school: 'SoCSEA', role: 'faculty' })
await api.users.create({ email, password, full_name, appraisal_role })
await api.users.update(email, { full_name, appraisal_role })
await api.users.remove(email)

// Submission stats
await api.stats.get('2025-26')

// Feedback & support
await api.feedback.list({ category: 'bug' })
await api.feedback.get(id)

// Settings
await api.config.get()
await api.config.update({ APP_URL: '...' })
```

Error responses from the backend always have a `user_message` field — that's the string to show in the UI.

---

## Adding pages

1. Create your component in `src/pages/YourPage.jsx`
2. Import it in `src/App.jsx` and add a `<Route>` for it
3. Add a link in your sidebar/nav component

The existing `src/App.jsx` and `src/layouts/AdminLayout.jsx` are placeholder scaffolds — replace them with your own design.

---

## Pages to build

Based on the feature plan:

```
Dashboard
Faculty Management
 ├── Faculty List
 ├── Add Faculty
 ├── Update Faculty
 └── Remove Access
Appraisal Management
 ├── Enable/Disable Appraisal
 ├── Submission Window
 └── Current Cycle
Submission Tracking
 ├── Submitted Faculty
 ├── Pending Faculty
 ├── School-wise Stats
 └── Department Stats
Credential Management
 ├── Generate Credentials
 ├── Signup Requests
 ├── Reset Passwords
 └── Resend Credentials
Analytics & Reports
 ├── Timeline Graphs
 ├── Reports
 └── Export Data
Feedback & Support
 ├── Queries
 ├── Bug Reports
 └── Feature Requests
Announcements
 └── Important Notes
Settings
 ├── Roles & Permissions
 ├── Security
 └── Session Settings
```

---

## You do not need to worry about

- **CORS** — the app is served from the same domain as the backend in production, no CORS configuration needed
- **Auth headers** — `api/client.js` attaches the JWT token to every request automatically; it also redirects to `/panel/login` if the session expires
- **Building or deploying** — Docker and the CI/CD pipeline handle the production build; just commit your code to the repo
- **Backend URL** — in dev the Vite proxy handles it; in production it's the same origin
