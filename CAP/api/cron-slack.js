// Automated Slack cron job
// Runs every Monday and Friday at 10:00 AM (UTC)
// Configured in vercel.json: "0 10 * * 1,5"

export default async function handler(req, res) {
  // Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Read environment variables
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const appsScriptUrl = process.env.VITE_APPS_SCRIPT_URL;

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return res.status(500).json({ error: 'SLACK_WEBHOOK_URL not configured' });
  }

  if (!appsScriptUrl) {
    console.error('VITE_APPS_SCRIPT_URL not configured');
    return res.status(500).json({ error: 'VITE_APPS_SCRIPT_URL not configured' });
  }

  try {
    // Fetch submissions from Google Sheets
    const dataResponse = await fetch(`${appsScriptUrl}?action=read`);
    if (!dataResponse.ok) {
      throw new Error(`Failed to fetch data: ${dataResponse.status}`);
    }
    const data = await dataResponse.json();
    const submissions = data.rows || [];

    // Build team summary message (same logic as manual button)
    const message = buildTeamSummary(submissions);

    // Send to Slack
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    if (!slackResponse.ok) {
      throw new Error(`Slack API error: ${slackResponse.status}`);
    }

    console.log('Automated Slack message sent successfully');
    return res.status(200).json({ 
      success: true, 
      message: 'Automated Slack message sent',
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ 
      error: 'Cron job failed',
      details: error.message 
    });
  }
}

// Helper function to build team summary (duplicated from lib/slack.js for server-side use)
function buildTeamSummary(submissions) {
  const week = getCurrentWeek();
  const stats = calculateStats(submissions);
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  return `📊 Customer Advocacy App — Weekly Update | ${dateStr} · Week ${week} of 6

📊 Team Progress
Reviews      ${progressBar(stats.reviews, stats.reviewTarget)}  ${stats.reviews} / ${stats.reviewTarget}
References   ${progressBar(stats.references, stats.refTarget)}  ${stats.references} / ${stats.refTarget}
Stories      ${progressBar(stats.stories, stats.storyTarget)}  ${stats.stories} / ${stats.storyTarget}

🏆 Top Performers
${stats.topPerformers.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} — ${p.points} pts`).join('\n')}

⚡ This is an automated weekly update`;
}

function getCurrentWeek() {
  const start = new Date('2026-05-18');
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.min(6, Math.max(1, Math.ceil((diff + 1) / 7)));
}

function progressBar(actual, target, length = 10) {
  const filled = Math.round(Math.min(1, actual / target) * length);
  return '▓'.repeat(filled) + '░'.repeat(length - filled);
}

function calculateStats(submissions) {
  const csmPoints = {};
  let reviews = 0, references = 0, stories = 0;

  submissions.forEach(sub => {
    csmPoints[sub.csmName] = (csmPoints[sub.csmName] || 0) + (sub.points || 0);
    
    if (sub.activityType === 'g2_review' || sub.activityType === 'gartner_review') reviews++;
    if (sub.activityType === 'reference_call') references++;
    if (sub.activityType === 'case_study' || sub.activityType === 'video_testimonial') stories++;
  });

  const topPerformers = Object.entries(csmPoints)
    .map(([name, points]) => ({ name, points }))
    .sort((a, b) => b.points - a.points);

  return {
    reviews,
    references,
    stories,
    reviewTarget: 18,
    refTarget: 24,
    storyTarget: 12,
    topPerformers,
  };
}
