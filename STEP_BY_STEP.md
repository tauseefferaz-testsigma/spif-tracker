# Step-by-Step Deployment Guide

## WHAT CHANGED - 3 Features

### 1️⃣ BRANDING CHANGE
**What:** App name changed everywhere
- Old: "SPIF Tracker"
- New: "Customer Advocacy App"

**Files affected:**
- App header title
- Slack messages
- PDF export title/filename

**Example:**
```
BEFORE: "📊 SPIF Tracker — Snapshot"
AFTER:  "📊 Customer Advocacy App — Snapshot"
```

---

### 2️⃣ PROGRAM TIMING CHANGE
**What:** Program dates and duration updated
- Old: May 1, 2026 for 5 weeks
- New: May 18, 2026 for 6 weeks

**What this means:**
- On May 19: Week 1 of 6 (was Week 5 of 5)
- Progress bar shows ~17% (was 100%)
- All pace calculations reset

**Files affected:**
- Program config (start date, week count)
- Week display on dashboard
- All pace status calculations

**Example:**
```
BEFORE: Week 5 of 5, Program starts May 1
AFTER:  Week 1 of 6, Program starts May 18
```

---

### 3️⃣ NEW SLACK FEATURE - CSM SNAPSHOT
**What:** New button to send consolidated CSM list to Slack

**Before:**
- 1 Slack button: "Send to Slack" (team summary only)

**After:**
- 2 Slack buttons:
  - "💬 Send to Slack" (team summary - same as before)
  - "📋 CSM Snapshot" (NEW - shows all CSMs in one message)

**Example Message (CSM Snapshot):**
```
📊 Customer Advocacy App — CSM Snapshot | May 19 · Week 1 of 6

Subhopriyo Sen              Reviews: 5 / 5  |  References: 0 / 1  |  Stories: 0 / 1
sakshi.bagri                Reviews: 4 / 5  |  References: 0 / 1  |  Stories: 0 / 1
Aravinda G                  Reviews: 3 / 7  |  References: 0 / 2  |  Stories: 0 / 2
...
```

**Files affected:**
- Slack message builders
- Dashboard UI (buttons)
- Slack send handler

---

## YOUR 3-STEP DEPLOYMENT

### STEP 1: COPY FILES TO YOUR REPO ⏱️ 5 minutes

Extract the ZIP file. You'll see these files:

```
README.md
UPDATED_src_types_index.js
UPDATED_src_App.jsx
UPDATED_src_lib_slack.js
UPDATED_src_lib_pdf.js
UPDATED_src_components_Dashboard.jsx
UPDATED_AppsScript.gs
api_slack-snapshot.js
```

**Copy to your repository like this:**

```
YOUR-REPO/
├── src/
│   ├── types/
│   │   └── index.js ← Copy UPDATED_src_types_index.js here
│   ├── App.jsx ← Copy UPDATED_src_App.jsx here
│   ├── lib/
│   │   ├── slack.js ← Copy UPDATED_src_lib_slack.js here
│   │   └── pdf.js ← Copy UPDATED_src_lib_pdf.js here
│   └── components/
│       └── Dashboard.jsx ← Copy UPDATED_src_components_Dashboard.jsx here
├── api/
│   └── slack-snapshot.js ← Copy api_slack-snapshot.js here
└── AppsScript.gs ← Copy UPDATED_AppsScript.gs here (OPTIONAL)
```

**How to copy:**
1. Open each UPDATED_*.* file from ZIP
2. Copy entire contents
3. Open corresponding file in your repo
4. Paste and save

**Example:**
- Open: `UPDATED_src_App.jsx`
- Copy all contents
- Go to: `your-repo/src/App.jsx`
- Paste contents
- Save

---

### STEP 2: GIT PUSH ⏱️ 2 minutes

After copying all 6 files:

```bash
# Go to your repository
cd your-repo

# Add all changes
git add .

# Commit with message
git commit -m "feat: rename to Customer Advocacy App, update timing, add CSM snapshot"

# Push to GitHub
git push origin main
```

**That's it!** Vercel will automatically deploy.

---

### STEP 3: VERIFY DEPLOYMENT ⏱️ 5 minutes

Wait 2-3 minutes for Vercel to deploy, then:

1. **Open your app**
   - Check app title: Should say "Customer Advocacy App"
   - ✅ If yes, branding worked

2. **Check Dashboard**
   - Should show "Week 1 of 6" 
   - Progress bar should be ~17% filled
   - ✅ If yes, timing worked

3. **Check Slack Buttons**
   - Should see 2 buttons:
     - "💬 Send to Slack"
     - "📋 CSM Snapshot"
   - ✅ If yes, new feature ready

4. **Test Slack**
   - Click "Send to Slack" → team message sent
   - Click "CSM Snapshot" → CSM list sent
   - Check your Slack channel for both messages
   - ✅ If messages appear, Slack working

5. **Check Browser Console**
   - Press F12 → Console tab
   - Should be NO RED ERRORS
   - ✅ If clean, deployment successful

---

## OPTIONAL: UPDATE APPS SCRIPT ⏱️ 2 minutes

If you want to update the backend (recommended for consistency):

1. Open Google Apps Script editor
2. Open: `UPDATED_AppsScript.gs` from ZIP
3. Copy entire contents
4. Go to your Apps Script
5. Select ALL code (Ctrl+A)
6. Delete it
7. Paste new code
8. Save (Ctrl+S)
9. Deploy → New deployment → Web App
10. **Keep same URL** (don't change it)

---

## FILES CHANGED - DETAILED

### 6 Required Files:

| File | What Changed | Why |
|------|-------------|-----|
| `src/types/index.js` | PROGRAM_START, PROGRAM_WEEKS | New timing: May 18, 6 weeks |
| `src/App.jsx` | App title text | Branding: Customer Advocacy App |
| `src/lib/slack.js` | New CSM message builder + routing | New feature: CSM snapshot + updated branding |
| `src/lib/pdf.js` | PDF title, filename | Branding: Customer Advocacy App |
| `src/components/Dashboard.jsx` | Added 2nd button, updated handler | New UI: Two Slack buttons |
| `api/slack-snapshot.js` | NO CHANGES (copy as-is) | Slack flow unchanged |

### 1 Optional File:

| File | What Changed | Why |
|------|-------------|-----|
| `AppsScript.gs` | PROGRAM_START, PROGRAM_WEEKS, header | Backend timing + branding sync |

---

## WHAT YOU DON'T NEED TO CHANGE

✅ Google Sheets schema (no changes)
✅ Slack webhook URL (no changes)
✅ Environment variables (no new ones)
✅ Dependencies/packages (no new ones)
✅ Data structure (no changes)

---

## ROLLBACK (If Something Goes Wrong)

If there's an issue after deployment:

```bash
# Go back to previous version
git revert HEAD

# Push
git push origin main
```

Takes 2 minutes. Vercel auto-redeploys old version.

---

## QUICK SUMMARY

| Step | Action | Time |
|------|--------|------|
| 1 | Extract ZIP | 1 min |
| 2 | Copy 6 files to repo | 3 min |
| 3 | Git push | 1 min |
| 4 | Wait for deploy | 2 min |
| 5 | Verify | 5 min |
| 6 | Optional: Update Apps Script | 2 min |
| **TOTAL** | **Full Deployment** | **~14 minutes** |

---

## TESTING CHECKLIST

After deployment, verify:

```
[ ] App title shows "Customer Advocacy App"
[ ] Dashboard shows "Week 1 of 6"
[ ] Progress bar shows ~17%
[ ] Two Slack buttons visible
[ ] "Send to Slack" button works
[ ] "CSM Snapshot" button works
[ ] Messages appear in Slack
[ ] No console errors (F12)
[ ] PDF exports with correct title
```

---

## THAT'S IT!

3 simple steps:
1. Copy 6 files
2. Git push
3. Verify

Done! 🎉

