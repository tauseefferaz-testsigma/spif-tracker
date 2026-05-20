# 📊 Customer Advocacy App

A professional web application for tracking customer advocacy metrics and sharing team progress to Slack.

## Features

✅ **Team Progress Dashboard**
- Track reviews, references, and stories
- Visual progress bars
- Send as text or image to Slack

✅ **CSM Snapshot**
- View all submissions
- Professional table layout
- Send as text or image to Slack

✅ **Slack Integration**
- Send formatted text messages
- Send beautiful image screenshots
- Click buttons to share instantly

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: CSS
- **Screenshots**: html2canvas
- **Slack**: Official Slack API

## Setup

### 1. Prerequisites

- Node.js (v16+)
- npm or yarn
- Slack workspace access

### 2. Installation

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` in root folder:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_CHANNEL=#advocacy-updates
```

Get your Slack credentials:
1. Go to https://api.slack.com/apps
2. Create or select your app
3. Get Bot Token from OAuth & Permissions
4. Get Webhook URL from Incoming Webhooks

### 4. Development

```bash
npm run dev
```

Open http://localhost:5173

### 5. Build for Production

```bash
npm run build
```

## Deployment to Vercel

1. Push code to GitHub
2. Go to vercel.com
3. Import your GitHub repository
4. Add environment variables:
   - SLACK_WEBHOOK_URL
   - SLACK_BOT_TOKEN
   - SLACK_CHANNEL
5. Deploy!

## Usage

### Send Team Progress
1. Click `💬 Send to Slack | Team Progress`
2. Text message appears in Slack

### Send Team Progress as Image
1. Click `📸 Send as Image`
2. Beautiful screenshot appears in Slack

### Send CSM Snapshot
1. Click `📋 Send to Slack | CSM Snapshot`
2. Text message appears in Slack

### Send CSM Snapshot as Image
1. Click `📸 Send as Image`
2. Beautiful screenshot appears in Slack

## Button Features

| Button | Action | Output |
|--------|--------|--------|
| 💬 Send to Slack \| Team Progress | Send text message | Formatted text in Slack |
| 📸 Send as Image (Team) | Send screenshot | Professional image in Slack |
| 📋 Send to Slack \| CSM Snapshot | Send text message | Formatted text in Slack |
| 📸 Send as Image (CSM) | Send screenshot | Professional image in Slack |

## File Structure

```
src/
├─ App.jsx ..................... Main app component
├─ main.jsx .................... Entry point
├─ index.css ................... Global styles
├─ components/
│  └─ Dashboard.jsx ............ Dashboard with buttons
├─ hooks/
│  └─ useToast.js .............. Toast notifications
└─ lib/
   ├─ slack.js ................. Slack message builders
   └─ api.js ................... API helpers

api/
├─ slack-snapshot.js ........... Text message endpoint
└─ slack-image-snapshot.js ..... Image upload endpoint

public/ ........................ Static assets
```

## Troubleshooting

### Button doesn't appear
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
- Check console for errors (F12)

### Message doesn't send to Slack
- Check SLACK_WEBHOOK_URL in .env.local
- Check SLACK_BOT_TOKEN has files:write scope
- Check SLACK_CHANNEL format (#channel-name)

### Image send fails
- Check bot token is correct
- Verify files:write scope is enabled
- Check browser console for errors

### Can't find Terminal
- Windows: Right-click folder → Open Terminal Here
- Mac: Right-click in Finder → Services → New Terminal Tab
- VS Code: Press Ctrl+` (or Cmd+` on Mac)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| SLACK_WEBHOOK_URL | Incoming webhook for text messages | https://hooks.slack.com/... |
| SLACK_BOT_TOKEN | Bot token for image uploads | xoxb-... |
| SLACK_CHANNEL | Target Slack channel | #advocacy-updates |

## Slack Setup

### Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. Name: "Customer Advocacy"
5. Choose your workspace

### Add Scopes

1. Go to OAuth & Permissions
2. Add these scopes:
   - files:write
   - chat:write
   - channels:read

### Get Credentials

1. Bot Token: Copy from OAuth & Permissions
2. Webhook: Create in Incoming Webhooks
3. Channel: Use your #advocacy-updates channel

## Security

✅ Safe to use
✅ No external trackers
✅ Open source libraries
✅ Your data stays in Slack

## License

MIT

## Support

If you need help:
1. Check the Troubleshooting section
2. Check browser console (F12)
3. Read error messages carefully
4. Share the exact error with support

---

Made with ❤️ for customer advocacy teams
