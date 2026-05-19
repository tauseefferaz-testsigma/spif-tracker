# Customer Advocacy App - Implementation

**Status:** Ready to Deploy  
**Date:** May 19, 2026

## 3 Features Implemented

1. ✅ Branding: SPIF Tracker → Customer Advocacy App
2. ✅ Timing: May 18, 2026 for 6 weeks  
3. ✅ New: CSM Snapshot Slack button

## Quick Deploy

### Copy These Files

```
src/types/index.js                 ← UPDATED_src_types_index.js
src/App.jsx                        ← UPDATED_src_App.jsx
src/lib/slack.js                   ← UPDATED_src_lib_slack.js
src/lib/pdf.js                     ← UPDATED_src_lib_pdf.js
src/components/Dashboard.jsx       ← UPDATED_src_components_Dashboard.jsx
api/slack-snapshot.js              ← api_slack-snapshot.js
```

### Push to Git

```bash
git add . && git commit -m "feat: update app" && git push origin main
```

Vercel auto-deploys ✓

### Optional: Update Apps Script

Copy `UPDATED_AppsScript.gs` to Google Apps Script editor → Deploy

## Changes Summary

| Item | Change |
|------|--------|
| App Title | SPIF Tracker → Customer Advocacy App |
| Program | May 1 (5 wks) → May 18 (6 wks) |
| Buttons | 1 → 2 (added CSM Snapshot) |
| API | Unchanged (/api/slack-snapshot) |

## File Structure

```
src/
├── types/index.js ............. Program timing
├── App.jsx .................... App title
├── lib/
│   ├── slack.js ............... Message builders (+ new CSM snapshot)
│   └── pdf.js ................. PDF title
└── components/
    └── Dashboard.jsx .......... Two Slack buttons

api/
└── slack-snapshot.js .......... Vercel function (unchanged)

AppsScript.gs .................. Backend (optional update)
```

## Verify After Deploy

- ✓ Title: "Customer Advocacy App"
- ✓ Week: "Week 1 of 6"
- ✓ Two Slack buttons visible
- ✓ Both buttons send messages

## Notes

- Zero breaking changes
- 100% backward compatible  
- API/Slack flow unchanged
- Ready for production

**That's it! Deploy and enjoy.** 🎉

