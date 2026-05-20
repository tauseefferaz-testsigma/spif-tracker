// API endpoint for sending Slack messages
// Webhook URL is read from environment variables ONLY - never hardcoded

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read webhook URL from environment variable (set in Vercel dashboard)
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return res.status(500).json({ 
      error: 'SLACK_WEBHOOK_URL not configured in Vercel environment variables' 
    });
  }

  // Get message text from request body
  const { text } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    // Send message to Slack
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      return res.status(slackResponse.status).json({
        error: `Slack API error: ${slackResponse.status}`,
        details: errorText,
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Message sent to Slack' 
    });
    
  } catch (error) {
    console.error('Slack webhook error:', error);
    return res.status(500).json({ 
      error: 'Failed to send message to Slack',
      details: error.message 
    });
  }
}
