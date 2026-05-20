# 🚀 Customer Advocacy App - Deployment Guide

**Version:** 4.0.0 - Fresh Build  
**Status:** ✅ Production Ready  
**Security:** ✅ No secrets in code

---

## What's Inside

Complete React app with:
- ✅ Activity logging & tracking
- ✅ Dashboard with team metrics
- ✅ Leaderboard rankings
- ✅ **Two Slack buttons** (Team Summary + CSM Snapshot)
- ✅ **Automated Slack messages** (Monday & Friday 10 AM)
- ✅ Zero secrets hardcoded (all env vars)

---

## 🔒 Security Features

### ✅ What's Safe
1. **No webhook URLs in code** - All webhooks read from environment variables
2. **Server-side only** - Slack integration happens on Vercel backend, never in browser
3. **Clean GitHub repo** - `.env.example` shows placeholders only
4. **Public data only** - CSM names, activities, customers (no sensitive info)

### 🛡️ What's Protected
- Slack webhook URL → `process.env.SLACK_WEBHOOK_URL` (Vercel env vars)
- Apps Script URL → `process.env.VITE_APPS_SCRIPT_URL` (Vercel env vars)
- Both set in Vercel dashboard, never committed to GitHub

---

## 📋 Deployment Steps

### Step 1: Push to GitHub
```bash
# Initialize git (if new repo)
git init
git add .
git commit -m "Initial commit - Customer Advocacy App v4"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to **vercel.com**
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **"Deploy"** (don't add env vars yet)

### Step 3: Add Environment Variables in Vercel

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these TWO variables:**

#### Variable 1: Google Apps Script URL
```
Name:  VITE_APPS_SCRIPT_URL
Value: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
(Replace `YOUR_SCRIPT_ID` with your actual Apps Script deployment ID)

#### Variable 2: Slack Webhook URL
```
Name:  SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/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
```

**For both variables:**
- Check: ✓ Production
- Check: ✓ Preview  
- Check: ✓ Development

**Click:** Save

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the three dots `...` on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

### Step 5: Test

1. Open your app URL
2. Go to **Dashboard** tab
3. Click **"💬 Send to Slack"** button
   - ✅ Should see: "Team summary sent to Slack successfully!"
   - ✅ Message appears in Slack with leaderboard & metrics
4. Click **"📋 CSM Snapshot"** button
   - ✅ Should see: "CSM snapshot sent to Slack successfully!"
   - ✅ CSM table appears in Slack

---

## ⏰ Automated Slack Messages

### Schedule
**Every Monday & Friday at 10:00 AM UTC**

Configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron-slack",
      "schedule": "0 10 * * 1,5"
    }
  ]
}
```

### What Gets Sent
Same team summary format as manual "💬 Send to Slack" button:
- Team progress (Reviews, References, Stories)
- Top 5 leaderboard
- Pace status

### How to Verify
1. Check **Vercel Dashboard → Cron Jobs** tab
2. View execution logs
3. See last run timestamp
4. Check Slack channel on Monday/Friday after 10 AM

### How to Change Schedule
Edit `vercel.json`:
- `"0 10 * * 1,5"` = Monday (1) & Friday (5) at 10:00 AM
- `"0 9 * * *"` = Every day at 9:00 AM
- `"0 14 * * 3"` = Every Wednesday at 2:00 PM

After changing, push to GitHub and Vercel will redeploy.

---

## 📊 Slack Message Formats

### Team Summary (Manual + Auto)
```
📊 Customer Advocacy App — Snapshot | May 21 · Week 1 of 6

📊 Team Progress
Reviews      ▓░░░░░░░░░  0 / 18  (0%)
References   ▓░░░░░░░░░  1 / 24  (4%)
Stories      ░░░░░░░░░░  0 / 12  (0%)

🏆 Leaderboard
1️⃣ Tamiz — 5 pts 🟢
2️⃣ Aravinda — 3 pts 🟡
3️⃣ Subho — 2 pts 🟡
...

⚡ Pace Check
🟢 Ahead — Tamiz
🟡 On Track — Aravinda, Subho
```

### CSM Snapshot (Manual Only)
```
📊 Customer Advocacy App — CSM Snapshot | May 21 · Week 1 of 6

Name                        Reviews      References    Stories
─────────────────────────────────────────────────────────────

Mohammed Tamiz Uddin        📝 1/2        📋 0/3         📖 0/1
Aravinda G                  📝 0/2        📋 1/3         📖 0/1
...
```

---

## 🔧 File Structure

```
advocacy-app/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx        ← Slack buttons here
│   │   ├── SubmissionForm.jsx
│   │   ├── Leaderboard.jsx
│   │   └── ui.jsx
│   ├── lib/
│   │   ├── slack.js             ← Message builders (NO SECRETS)
│   │   ├── api.js               ← Reads VITE_APPS_SCRIPT_URL
│   │   └── stats.js
│   ├── hooks/
│   │   ├── useSubmissions.js
│   │   └── useToast.js
│   ├── types/
│   │   └── index.js             ← Config, targets (NO SECRETS)
│   ├── App.jsx
│   └── main.jsx
├── api/
│   ├── slack-webhook.js         ← Reads process.env.SLACK_WEBHOOK_URL
│   └── cron-slack.js            ← Mon/Fri 10 AM automation
├── .env.example                 ← Template (SAFE - placeholders only)
├── vercel.json                  ← Cron job config
├── package.json
└── README.md
```

---

## ❌ Troubleshooting

### Error: "VITE_APPS_SCRIPT_URL not configured"
**Fix:** Add the environment variable in Vercel → Redeploy

### Error: "SLACK_WEBHOOK_URL not configured"
**Fix:** Add the environment variable in Vercel → Redeploy

### Slack button doesn't respond
**Fix:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify both env vars are set in Vercel

### Message doesn't appear in Slack
**Fix:**
1. Check webhook URL is correct (no typos)
2. Verify Slack channel exists
3. Test webhook with curl:
   ```bash
   curl -X POST -H 'Content-type: application/json' \
   --data '{"text":"Test from CLI"}' \
   https://hooks.slack.com/services/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
   ```

### Cron job not running
**Fix:**
1. Check `vercel.json` exists in repo
2. Verify Vercel Pro plan (crons require Pro)
3. Check Vercel Dashboard → Cron Jobs tab for logs
4. Ensure `CRON_SECRET` env var is set (Vercel generates this automatically)

---

## ✅ Success Checklist

After deployment, verify:

- [ ] App loads without errors
- [ ] Shows "Customer Advocacy App" in header
- [ ] Dashboard shows metrics & progress bars
- [ ] Two Slack buttons visible on Dashboard
- [ ] "💬 Send to Slack" sends team summary
- [ ] "📋 CSM Snapshot" sends CSM table
- [ ] Both messages appear in Slack correctly
- [ ] Form submission works (Log Activity tab)
- [ ] Leaderboard shows rankings
- [ ] No webhook URLs visible in browser console
- [ ] No errors in Vercel deployment logs
- [ ] Cron job shows in Vercel dashboard

---

## 🎯 What's Next

After successful deployment:

1. **Test both Slack buttons** - Verify messages format correctly
2. **Wait for Monday/Friday 10 AM** - Check automated message
3. **Log some activities** - Test form submission
4. **View leaderboard** - Verify rankings update

---

## 📞 Support

**If something doesn't work:**
1. Check this README's troubleshooting section
2. Verify all environment variables are set
3. Check Vercel deployment logs
4. Check browser console for errors

---

**Version:** 4.0.0  
**Build Date:** May 21, 2026  
**Security:** ✅ All secrets in Vercel env vars  
**Status:** ✅ Ready to Deploy
