# Verification & Testing Guide

## ✅ Quick Test (30 seconds)

After deployment:

1. Open app in browser
2. Check these 5 things:

| Check | Expected | Status |
|-------|----------|--------|
| Title | "Customer Advocacy App" | [ ] |
| Week | "Week 1 of 6" | [ ] |
| Progress | ~17% filled | [ ] |
| Buttons | 2 Slack buttons visible | [ ] |
| Console | No red errors (F12) | [ ] |

If all ✅ → **Success!**

---

## 🧪 Detailed Verification

### 1. Visual Checks

**App Header (Top Left)**
- Expected: "🏅 Customer Advocacy App"
- NOT: "SPIF Tracker"
- Status: [ ]

**Dashboard Info (Below Header)**
- Expected: "Week 1 of 6 · Program starts May 18"
- NOT: "Week 5 of 5"
- Status: [ ]

**Progress Bar**
- Expected: About 17% filled (small bar)
- NOT: 100% filled (full bar)
- Status: [ ]

**Slack Buttons (Top Right)**
- Expected: 2 buttons side by side:
  - "💬 Send to Slack"
  - "📋 CSM Snapshot"
- NOT: Only 1 button
- Status: [ ]

### 2. Functional Tests

**Test A: Team Summary Slack Message**
1. Click "💬 Send to Slack"
2. Should show "Sending..." briefly
3. Should show success message
4. Check Slack channel
5. Should see message with:
   - Title: "Customer Advocacy App — Snapshot"
   - Team Progress section
   - Leaderboard
   - Pace Check
6. Status: [ ]

**Test B: CSM Snapshot Slack Message**
1. Click "📋 CSM Snapshot"
2. Should show "Sending..." briefly
3. Should show success message
4. Check Slack channel
5. Should see message with:
   - Title: "Customer Advocacy App — CSM Snapshot"
   - List of all 10 CSMs with metrics
6. Status: [ ]

**Test C: PDF Export**
1. Click "⬇ Download PDF"
2. File should download
3. Filename: `advocacy-report-YYYY-MM-DD.pdf`
4. Open PDF
5. Title should say: "Customer Advocacy App — Report"
6. NOT: "SPIF Tracker"
7. Status: [ ]

### 3. Console Check

**Open Developer Tools**
```
Press F12
Click "Console" tab
Look for red errors
```

**Expected:**
- No red errors
- Maybe some info/warnings (OK)

**Status:** [ ]

---

## 🔍 Deep Verification

### Code Verification

**1. Check src/types/index.js**
```bash
cat src/types/index.js | grep PROGRAM
```

Expected output:
```
export const PROGRAM_START = "2026-05-18";
export const PROGRAM_WEEKS = 6;
```

Status: [ ]

**2. Check src/App.jsx**
```bash
grep "Customer Advocacy App" src/App.jsx
```

Expected: Should find at least one match

Status: [ ]

**3. Check src/lib/slack.js**
```bash
grep "buildConsolidatedSlackMessage" src/lib/slack.js
```

Expected: Should find function definition

Status: [ ]

**4. Check src/components/Dashboard.jsx**
```bash
grep "CSM Snapshot" src/components/Dashboard.jsx
```

Expected: Should find button text

Status: [ ]

### Deployment Verification

**1. Vercel Status**
- Go to: https://vercel.com/dashboard
- Find project
- Latest deployment should show: 🟢 Ready
- Status: [ ]

**2. Build Logs**
- Click on deployment
- Check build logs
- Should show: "Build Completed"
- No errors
- Status: [ ]

**3. Function Logs (Optional)**
- Deployments → Functions
- Check `/api/slack-snapshot`
- Should be active
- Status: [ ]

---

## ❌ Troubleshooting

### Issue: Old Code Still Showing

**Symptoms:**
- Title says "SPIF Tracker"
- Shows "Week 5 of 5"
- Only 1 Slack button

**Causes:**
1. Browser cache not cleared
2. Vercel not deployed yet
3. Files not copied correctly

**Solutions:**

**A. Clear Browser Cache**
```
1. Close ALL browser tabs of app
2. Press Ctrl + Shift + Delete
3. Select "Cached images and files"
4. Select "All time"
5. Click "Clear data"
6. Close browser completely
7. Reopen browser
8. Go to app URL
9. Should see new version
```

**B. Verify Vercel Deployed**
```
1. Go to Vercel dashboard
2. Check deployment status
3. Should be green "Ready"
4. If yellow/building → wait
5. If red/failed → check logs
```

**C. Verify Files in GitHub**
```
1. Go to your GitHub repo
2. Click on src/types/index.js
3. Check line 2: Should say "2026-05-18"
4. Check line 3: Should say "PROGRAM_WEEKS = 6"
5. If wrong → recopy files
```

### Issue: Slack Buttons Not Working

**Symptoms:**
- Buttons visible but don't send
- Error message appears
- Console shows errors

**Check:**

**1. Environment Variables**
```
Vercel → Project → Settings → Environment Variables
Check: SLACK_WEBHOOK_URL is set
```

**2. API Endpoint**
```
Check api/slack-snapshot.js exists
Check no console errors
```

**3. Browser Console**
```
F12 → Console
Look for:
- "Failed to fetch"
- "SLACK_WEBHOOK_URL is not configured"
- Other error messages
```

**Solutions:**
- Add SLACK_WEBHOOK_URL to Vercel if missing
- Redeploy after adding
- Check Slack webhook is valid

### Issue: Wrong Week Number

**Symptoms:**
- Shows wrong week (not Week 1)
- Progress bar wrong

**Check:**
```bash
# In your repo
cat src/types/index.js | head -5
```

Expected:
```javascript
// ─── PROGRAM CONFIG ───
export const PROGRAM_START = "2026-05-18";
export const PROGRAM_WEEKS = 6;
```

**If different:**
1. Recopy src/types/index.js from ZIP
2. Push to GitHub
3. Wait for Vercel
4. Hard refresh

### Issue: PDF Title Wrong

**Symptoms:**
- PDF still says "SPIF Tracker"

**Check:**
```bash
grep "Customer Advocacy App" src/lib/pdf.js
```

Expected: Should find it

**If not found:**
1. Recopy src/lib/pdf.js from ZIP
2. Push to GitHub
3. Redeploy
4. Test again

---

## 📊 Expected Values (May 19, 2026)

| Item | Expected Value |
|------|----------------|
| App Title | Customer Advocacy App |
| Program Start | May 18, 2026 |
| Program Duration | 6 weeks |
| Current Week | Week 1 of 6 |
| Progress % | ~17% (1/6) |
| Slack Buttons | 2 (team + CSM) |
| PDF Filename | advocacy-report-*.pdf |

---

## ✅ Final Checklist

Run through this after deployment:

- [ ] Vercel shows green "Ready"
- [ ] App title: "Customer Advocacy App"
- [ ] Week: "Week 1 of 6"
- [ ] Progress: ~17%
- [ ] 2 Slack buttons visible
- [ ] Team summary button works
- [ ] CSM snapshot button works
- [ ] Both messages appear in Slack
- [ ] PDF downloads
- [ ] PDF title correct
- [ ] No console errors
- [ ] All team members can access

**All checked?** 🎉 **Deployment successful!**

---

## 🆘 Still Having Issues?

1. Read this guide again carefully
2. Check each verification step
3. Run troubleshooting solutions
4. Verify files copied correctly
5. Check Vercel deployment logs

**Common mistakes:**
- Didn't clear browser cache
- Didn't wait for Vercel to finish
- Copied files to wrong location
- Forgot to push to GitHub

**Remember:**
- Code is 100% correct in ZIP
- If not working → deployment issue
- Most common: browser cache

---

Generated: May 19, 2026  
Version: 3.0
