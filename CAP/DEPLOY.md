# Deployment Guide

## ⚡ Fast Track (Recommended)

**Time: 5 minutes**

### Step 1: Clean Your Repo (1 min)
```bash
cd your-repo
git rm -rf src/ api/ public/
git rm package.json vite.config.js index.html
git commit -m "Clean for rebuild"
```

### Step 2: Add New Files (2 min)
```bash
# Extract ZIP
unzip customer-advocacy-app.zip -d temp/

# Copy everything
cp -r temp/* .

# Commit
git add .
git commit -m "Complete rebuild v3 - all features"
git push origin main
```

### Step 3: Wait & Verify (2 min)
- Go to Vercel → Wait for green ✓
- Hard refresh browser (Ctrl+Shift+R)
- Check: "Customer Advocacy App", "Week 1 of 6", 2 buttons ✓

---

## 📋 Detailed Deployment

### Before You Start

**Check:**
- ✓ Git installed
- ✓ Access to your GitHub repo
- ✓ Vercel connected to repo
- ✓ VITE_APPS_SCRIPT_URL set in Vercel
- ✓ SLACK_WEBHOOK_URL set in Vercel

### Step-by-Step

#### 1. Backup Current Code (Optional)
```bash
cd your-repo
git checkout -b backup-v2
git push origin backup-v2
git checkout main
```

#### 2. Extract ZIP
```bash
unzip customer-advocacy-app.zip
```

You should see:
```
customer-advocacy-app/
├── src/
├── api/
├── public/
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── DEPLOY.md
└── VERIFY.md
```

#### 3. Copy to Your Repo

**Option A: Replace Everything (Fastest)**
```bash
cd your-repo
rm -rf src/ api/ public/ package.json vite.config.js index.html
cp -r /path/to/customer-advocacy-app/* .
```

**Option B: Manual Copy**
1. Delete old `src/`, `api/`, `public/`
2. Copy new `src/`, `api/`, `public/`
3. Replace `package.json`, `vite.config.js`, `index.html`

#### 4. Verify Files Copied
```bash
# Check key files exist
ls src/types/index.js        # ✓ Should exist
ls src/components/Dashboard.jsx  # ✓ Should exist
ls api/slack-snapshot.js     # ✓ Should exist

# Verify timing
grep "2026-05-18" src/types/index.js  # ✓ Should find
grep "PROGRAM_WEEKS = 6" src/types/index.js  # ✓ Should find
```

#### 5. Commit & Push
```bash
git add .
git status  # Review what's changed
git commit -m "Rebuild: Customer Advocacy App v3 with all features"
git push origin main
```

#### 6. Monitor Vercel
1. Go to https://vercel.com/dashboard
2. Find your project
3. Click "Deployments"
4. Wait for latest deployment
5. Status should be: 🟢 Ready

**Takes:** 1-3 minutes

#### 7. Hard Refresh Browser
```bash
# Clear cache
Ctrl + Shift + Delete (Windows)
Cmd + Shift + Delete (Mac)

# Or
F12 → Right-click refresh → "Empty Cache and Hard Reload"
```

#### 8. Verify Everything Works
See `VERIFY.md` for complete checklist.

---

## 🔧 Troubleshooting

### Build Fails on Vercel

**Check:**
1. `package.json` copied correctly
2. All files in `src/` present
3. No syntax errors in files

**Fix:**
- Redeploy manually in Vercel
- Check build logs for specific error

### Old Code Still Shows

**Reason:** Browser cache

**Fix:**
1. Close all browser tabs
2. Clear browser cache completely
3. Reopen browser
4. Go to app URL
5. Should see new version

### Missing Slack Buttons

**Check:**
1. `src/components/Dashboard.jsx` has both buttons
2. `src/lib/slack.js` has both functions
3. No console errors (F12)

**Fix:**
- Verify files copied correctly from ZIP
- Redeploy
- Hard refresh

### "Week 5 of 5" Still Shows

**Check:**
1. `src/types/index.js` line 2: Should be "2026-05-18"
2. `src/types/index.js` line 3: Should be 6
3. Vercel deployed successfully

**Fix:**
- Recopy `src/types/index.js`
- Push to GitHub
- Wait for Vercel
- Hard refresh

---

## ✅ Success Checklist

After deployment, you should see:

- [ ] Vercel shows "Ready" ✅
- [ ] App loads without errors
- [ ] Title: "Customer Advocacy App"
- [ ] Week: "Week 1 of 6"
- [ ] Progress: ~17%
- [ ] Buttons: 2 Slack buttons
- [ ] No console errors

If all checked ✅ - **Deployment successful!**

---

## 🚀 Post-Deployment

### Test Features

1. **Test Slack - Team Summary**
   - Click "💬 Send to Slack"
   - Check Slack channel
   - Should see team progress message

2. **Test Slack - CSM Snapshot**
   - Click "📋 CSM Snapshot"
   - Check Slack channel
   - Should see CSM list message

3. **Test PDF Export**
   - Click "⬇ Download PDF"
   - File should be: `advocacy-report-2026-05-19.pdf`
   - Title should say: "Customer Advocacy App — Report"

### Monitor

- Check app daily
- Week should increment
- Progress bar should update

---

## 📝 Optional: Update Apps Script

If you want backend timing synced:

1. Open Google Apps Script
2. Open `AppsScript.gs` from ZIP
3. Copy contents
4. Paste in Apps Script editor
5. Save
6. Deploy new version

**Keep same Web App URL!**

---

Need help? See `VERIFY.md` for detailed troubleshooting.
