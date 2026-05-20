# 🚀 DEPLOYMENT STEPS - COMPLETE APP

This is a ready-to-deploy app. Just follow these steps!

---

## STEP 1: Add Your Slack Credentials (5 minutes)

### Get Slack Credentials
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Customer Advocacy"
4. Select your workspace

### Add OAuth Scopes
1. Go to "OAuth & Permissions"
2. Under "Scopes" → "Bot Token Scopes" add:
   - files:write
   - chat:write
   - channels:read
3. Click "Install to Workspace"
4. Copy "Bot User OAuth Token" (starts with xoxb-)

### Create Webhook
1. Go to "Incoming Webhooks"
2. Click "Add New Webhook to Workspace"
3. Select #advocacy-updates (or your channel)
4. Copy the Webhook URL

### Update .env.local
1. Open `.env.local` in the project
2. Replace:
   - SLACK_WEBHOOK_URL with your webhook URL
   - SLACK_BOT_TOKEN with your bot token
   - SLACK_CHANNEL with your channel (#advocacy-updates)

---

## STEP 2: Create GitHub Repository (5 minutes)

1. Go to github.com
2. Click "New repository"
3. Name: `customer-advocacy-app`
4. Choose "Private" or "Public"
5. Click "Create repository"
6. Copy the GitHub URL

---

## STEP 3: Upload to GitHub (5 minutes)

1. Open Terminal in your project folder
2. Run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit: Customer Advocacy App"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/customer-advocacy-app.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username!

---

## STEP 4: Connect to Vercel (5 minutes)

1. Go to vercel.com
2. Sign in (or sign up for free)
3. Click "New Project"
4. Click "Import Git Repository"
5. Select your `customer-advocacy-app` repository
6. Click "Import"

---

## STEP 5: Add Environment Variables to Vercel (5 minutes)

1. In Vercel, go to "Settings" → "Environment Variables"
2. Add three variables:

```
SLACK_WEBHOOK_URL = (your webhook URL)
SLACK_BOT_TOKEN = (your bot token)
SLACK_CHANNEL = #advocacy-updates
```

3. Click "Save"

---

## STEP 6: Deploy (2 minutes)

1. Click "Deploy"
2. Wait for green checkmark
3. Click "Visit" to see your live app

---

## ✅ YOU'RE DONE!

Your app is now live at: https://customer-advocacy-app.vercel.app (or your custom domain)

### What to do next:
- Click the buttons to test
- Share with your team
- Add submissions (once submission form is added)
- Monitor Slack for messages/images

---

## 🧪 TEST THE APP

### Test Text Send:
1. Click `💬 Send to Slack | Team Progress`
2. Check your Slack channel - message appears ✅

### Test Image Send:
1. Click `📸 Send as Image`
2. Check your Slack channel - image appears ✅

---

## ⚠️ TROUBLESHOOTING

### Images not sending?
- Check SLACK_BOT_TOKEN in Vercel settings
- Check bot has `files:write` scope
- Check channel name is correct

### Button doesn't appear?
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors (F12)
- Check Vercel deployment status

### Error messages?
- Read error carefully
- Check environment variables
- Share error with support

---

## 📝 NOTES

- App is ready to use immediately
- No additional setup needed
- Vercel handles hosting automatically
- Your code is safe on GitHub
- Free tier works great for this app

---

## 🎉 DEPLOYMENT COMPLETE!

You now have a live app that:
✅ Shows team progress
✅ Sends to Slack as text
✅ Sends to Slack as images
✅ Works on desktop and mobile
✅ Is fully secure

Congratulations! 🚀

