# SPIF Tracker v2 — Production Setup Guide

## What it is
A real-time advocacy activity tracker for your CS team. CSMs log G2 reviews, case studies, and GPI activities. Points calculate automatically. A live dashboard shows the leaderboard and payout status.

---

## Architecture

```
spif-v2/
├── src/
│   ├── types/index.js        ← Schema, validation, constants
│   ├── lib/
│   │   ├── api.js            ← API layer (fetch, retry, dedup)
│   │   ├── stats.js          ← Leaderboard and breakdown calculations
│   │   └── pdf.js            ← PDF export
│   ├── hooks/
│   │   ├── useSubmissions.js ← CRUD + optimistic state
│   │   └── useToast.js       ← Notification system
│   ├── components/
│   │   ├── ui.jsx            ← Design system (Button, Badge, Card, etc.)
│   │   ├── SubmissionForm.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Leaderboard.jsx
│   │   └── SubmissionLog.jsx
│   ├── App.jsx               ← Shell + routing
│   └── main.jsx
├── AppsScript.gs             ← Google Apps Script backend
├── package.json
├── vite.config.js
└── index.html
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_APPS_SCRIPT_URL` | ✅ Yes | Google Apps Script Web App URL |

---

## STEP 1 — Google Sheet Setup (3 min)

1. Go to **sheets.google.com** → create a new sheet
2. Name it: **SPIF Tracker**
3. Rename the bottom tab to: **Submissions** (capital S, exact spelling)
4. Row 1 headers (columns A–G):
   - `Date` · `CSM Name` · `Tier` · `Activity` · `No. of Reviews` · `Notes` · `Points`

> The Apps Script will also auto-create these headers if missing.

---

## STEP 2 — Deploy Apps Script (5 min)

1. In your Google Sheet: **Extensions → Apps Script**
2. Delete all existing code
3. Copy the entire contents of `AppsScript.gs` and paste it
4. Click **Save** (💾) — name it: `SPIF Tracker Backend`
5. Click **Deploy → New deployment**
6. Click gear icon ⚙️ → select **Web app**
7. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy** → authorize when prompted
9. **Copy the Web App URL** (starts with `https://script.google.com/macros/s/...`)
10. Paste it in a safe place

**Verify it works:** Open the URL in your browser. You should see:
```json
{"ok":true,"submissions":[]}
```

---

## STEP 3 — Deploy Frontend to Vercel (5 min)

### Option A: GitHub → Vercel (recommended)

1. Push this folder to a GitHub repository
2. Go to **vercel.com** → New Project → Import from GitHub
3. Select the repository
4. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Add environment variable

1. Vercel project → **Settings → Environment Variables**
2. Add:
   - **Name:** `VITE_APPS_SCRIPT_URL`
   - **Value:** Your Web App URL from Step 2
   - **Environments:** Production, Preview, Development ✅
3. Click **Save**
4. Go to **Deployments → Redeploy**

---

## STEP 4 — Verify Everything Works

Open your Vercel URL and test:

1. **Submit** — log a test activity → check Google Sheet row was created ✅
2. **Dashboard** — verify stats update ✅
3. **Leaderboard** — verify CSM shows points ✅
4. **All Submissions** → **Edit** → change a field → Save → check Sheet row updated (not duplicated) ✅
5. **All Submissions** → **Delete** → confirm → check Sheet row removed ✅
6. **PDF Export** → download and verify all data present ✅

---

## CRUD Flow

| Operation | Frontend | Apps Script | Sheet |
|---|---|---|---|
| Create | `useSubmissions.create()` → optimistic add | `doPost()` → `appendRow()` | New row added |
| Read | `useSubmissions` polls every 30s | `doGet()` → reads all rows | Rows returned with `rowIndex` |
| Update | `useSubmissions.update()` → optimistic update | `doPut()` → `setValues()` on specific row | Exact row overwritten |
| Delete | `useSubmissions.remove()` → optimistic remove | `doDelete()` → `deleteRow()` | Row deleted (rows shift up) |

> **Important:** After any write operation, the frontend re-fetches after 1.5 seconds to get fresh `rowIndex` values. This prevents stale row references from causing incorrect updates/deletes.

---

## Activity Points Reference

| Activity | Points | Per Review? |
|---|---|---|
| G2 Review — SMB | 10 pts | ✅ × reviews |
| G2 Review — Enterprise | 20 pts | ✅ × reviews |
| Case Study | 20 pts | ❌ flat |
| GPI | 15 pts | ❌ flat |

**Thresholds:**
- 50 pts → Payout unlocked
- 200 pts → Certification bonus

---

## Data Hygiene

- All inputs validated on frontend **and** backend
- Backend rejects invalid CSM names, tiers, and activities
- Stale `rowIndex` guard: if a row appears empty on update/delete, the backend returns an error
- Frontend re-fetches after every write to refresh row indices
- Duplicate submission prevention: in-flight request dedup via `inFlight` Set
- Notes capped at 500 chars on both frontend and backend
- Points recalculated server-side from activity + reviews (not trusted from client)

---

## Troubleshooting

**"Apps Script URL not configured"**
→ Add `VITE_APPS_SCRIPT_URL` to Vercel env vars and redeploy

**Edit/delete works in UI but Sheet doesn't update**
→ Your Apps Script deployment may be outdated. Redeploy it (Deploy → Manage Deployments → delete → New Deployment)

**"Row X does not exist" error**
→ The app has stale row indices. Click ↺ Refresh to reload, then retry

**"Sheet not found" error in Apps Script**
→ Your sheet tab is not named exactly `Submissions` (capital S)

**No data shows after submit**
→ Wait 30 seconds (auto-refresh) or click ↺ Refresh manually
