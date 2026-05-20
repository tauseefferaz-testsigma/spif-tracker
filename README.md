# Customer Advocacy App - Complete Rebuild

**Version:** 3.0  
**Build Date:** May 19, 2026  
**Status:** ✅ Production Ready

## ✨ What's Included

Complete working React app with all 3 features:

1. ✅ **Branding:** "Customer Advocacy App" (not "SPIF Tracker")
2. ✅ **Timing:** May 18, 2026 for 6 weeks (shows "Week 1 of 6")
3. ✅ **CSM Snapshot:** Two Slack buttons (team summary + CSM list)

---

## 📦 Package Contents

- `src/` - Complete React source code (8 files)
- `api/` - Vercel serverless function (1 file)
- `public/` - Static assets
- `package.json` - Dependencies
- `vite.config.js` - Build configuration
- `index.html` - Entry point
- `AppsScript.gs` - Google Apps Script backend (optional)
- `DEPLOY.md` - Deployment instructions
- `VERIFY.md` - Testing checklist

**Total:** 16+ files ready to deploy

---

## 🚀 Quick Deploy (3 Steps)

### Step 1: Replace Your Repo
```bash
# Delete old files
rm -rf src/ api/ public/ *.json *.js *.html

# Extract this ZIP
unzip customer-advocacy-app.zip

# Copy all files
cp -r * /path/to/your/repo/
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Complete app rebuild - all features working"
git push origin main
```

### Step 3: Verify
- Wait 2-3 minutes for Vercel
- Hard refresh browser (Ctrl+Shift+R)
- See all features working!

---

## ✅ What You'll See

After deployment:

- **App Header:** "🏅 Customer Advocacy App"
- **Dashboard:** "Week 1 of 6 · Program starts May 18"
- **Progress Bar:** ~17% filled
- **Slack Buttons:** TWO buttons visible:
  - "💬 Send to Slack" (team summary)
  - "📋 CSM Snapshot" (CSM list)
- **Console:** No errors

---

## 📋 Features Breakdown

### Feature 1: Branding
- App title changed everywhere
- Slack messages show "Customer Advocacy App"
- PDF exports show "Customer Advocacy App — Report"
- Filename: `advocacy-report-*.pdf`

### Feature 2: Program Timing
- Start: May 18, 2026 (was May 1)
- Duration: 6 weeks (was 5)
- Week calculation: On May 19 = Week 1 of 6
- Progress: ~17% (was 100%)

### Feature 3: CSM Snapshot
- New Slack message format
- Shows all 10 CSMs with metrics
- Second button: "📋 CSM Snapshot"
- Both buttons work independently

---

## 🔧 Technical Details

### Stack
- React 18.2
- Vite 5.0 (build tool)
- jsPDF (PDF generation)
- Vercel (hosting)
- Google Sheets (database)

### Key Files
- `src/types/index.js` - Config (PROGRAM_START, PROGRAM_WEEKS)
- `src/App.jsx` - Main app (title)
- `src/lib/slack.js` - Two message builders
- `src/lib/pdf.js` - PDF export
- `src/components/Dashboard.jsx` - Two buttons
- `api/slack-snapshot.js` - Slack webhook

---

## 📝 Environment Variables

**Required in Vercel:**
- `VITE_APPS_SCRIPT_URL` - Your Apps Script Web App URL
- `SLACK_WEBHOOK_URL` - Slack incoming webhook

**Set in:** Vercel Dashboard → Project → Settings → Environment Variables

---

## 🧪 Testing

See `VERIFY.md` for complete testing checklist.

Quick test:
1. App loads without errors ✓
2. Shows "Customer Advocacy App" ✓
3. Shows "Week 1 of 6" ✓
4. Two Slack buttons visible ✓
5. Both buttons work ✓

---

## 📚 Documentation

- `README.md` - This file (overview)
- `DEPLOY.md` - Step-by-step deployment
- `VERIFY.md` - Testing & troubleshooting

---

## 🆘 Support

If something doesn't work:

1. Check `VERIFY.md` for troubleshooting
2. Verify all files copied correctly
3. Check Vercel deployment status
4. Hard refresh browser
5. Check browser console for errors

---

## 📌 Key Changes from v2

- ✅ Renamed app throughout
- ✅ Updated program timing (May 18, 6 weeks)
- ✅ Added CSM Snapshot button
- ✅ Added `buildConsolidatedSlackMessage()` function
- ✅ Updated all Slack message headers
- ✅ Updated PDF title and filename

---

## ✨ Credits

Built: May 19, 2026  
Version: 3.0  
Status: Production Ready

**Ready to deploy!** 🚀
