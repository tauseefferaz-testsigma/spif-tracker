# 🚀 DEPLOYMENT INSTRUCTIONS

**Status:** ✅ Production Ready - Unzip and Deploy

## What's in this ZIP?

✅ Complete working React app  
✅ All UI buttons configured for Slack  
✅ Team Summary button (💬 Send to Slack)  
✅ CSM Snapshot button (📋 CSM Snapshot)  
✅ Both messages send in correct format  
✅ All features working (Dashboard, Leaderboard, PDF export)  

---

## 3 Steps to Deploy

### Step 1: Unzip Files to Your Repository
```bash
# Extract ZIP
unzip customer-advocacy-app.zip

# Copy all files to your GitHub repository folder
cp -r * /path/to/your/github/repo/
```

### Step 2: Set ONE Environment Variable in Vercel

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add this:**
- **Name:** `SLACK_WEBHOOK_URL`
- **Value:** `https://hooks.slack.com/services/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`
- **Check:** Production ✓ Preview ✓ Development ✓

**Click:** Save

### Step 3: Push to GitHub & Redeploy

```bash
git add .
git commit -m "Update to new Slack webhook"
git push origin main
```

Wait 2-3 minutes for Vercel to auto-deploy.

---

## ✅ What Will Work Immediately

### In Your App:
1. ✅ Go to Dashboard tab
2. ✅ Click **"💬 Send to Slack"** button
   - Message sends with: Team progress, Leaderboard, Pace status
3. ✅ Click **"📋 CSM Snapshot"** button
   - Message sends with: All CSMs, Reviews/References/Stories metrics
4. ✅ Both buttons show success toast: "Sent to Slack."

### In Slack:
- ✅ Team summary message appears
- ✅ CSM snapshot message appears
- ✅ Both formatted correctly with metrics
- ✅ Both auto-formatted with current week & date

### App Features:
- ✅ Form submission (Log Activity)
- ✅ Dashboard with metrics
- ✅ Leaderboard rankings
- ✅ Submission history
- ✅ PDF export

---

## That's It!

**No other setup needed.** Just:
1. Unzip
2. Add environment variable
3. Push to GitHub

Everything else is automated.

---

## If Something Doesn't Work

**Error: "SLACK_WEBHOOK_URL is not configured"**
- You didn't set the environment variable in Vercel
- Go back to Settings → Environment Variables
- Make sure ALL three boxes (Production, Preview, Development) are checked

**Button doesn't respond**
- Hard refresh browser: Ctrl+Shift+R
- Wait 2-3 minutes after pushing to GitHub
- Check Vercel deployment finished (green checkmark)

**Message doesn't appear in Slack**
- Check the webhook URL in Vercel is exactly:
  `https://hooks.slack.com/services/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`
- Verify the Slack channel still exists
- Create a new webhook if needed and update Vercel

---

## File Structure

```
customer-advocacy-app/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx        ← Slack buttons
│   │   ├── SubmissionForm.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── SubmissionLog.jsx
│   │   └── ui.jsx
│   ├── lib/
│   │   ├── slack.js             ← Message builders
│   │   ├── api.js
│   │   ├── stats.js
│   │   └── pdf.js
│   ├── hooks/
│   │   ├── useSubmissions.js
│   │   └── useToast.js
│   ├── types/
│   │   └── index.js
│   ├── App.jsx
│   └── main.jsx
├── api/
│   └── slack-snapshot.js        ← Webhook handler
├── public/
├── index.html
├── package.json
├── vite.config.js
└── DEPLOYMENT_INSTRUCTIONS.md
```

---

**Version:** 3.0  
**Date:** May 21, 2026  
**Status:** ✅ Ready to Deploy
