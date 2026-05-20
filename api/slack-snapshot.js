export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ 
      ok: false, 
      error: "SLACK_WEBHOOK_URL is not configured in Vercel.",
      hint: "Set SLACK_WEBHOOK_URL environment variable in Vercel dashboard"
    });
    return;
  }

  // Validate webhook URL format
  if (!webhookUrl.includes("hooks.slack.com")) {
    res.status(400).json({ 
      ok: false, 
      error: "Invalid SLACK_WEBHOOK_URL format. Must be from hooks.slack.com",
      hint: "Check your webhook URL in Vercel environment variables"
    });
    return;
  }

  const text = String(req.body?.text || "").trim();
  if (!text) {
    res.status(400).json({ ok: false, error: "Slack message text is empty." });
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ text }),
    });

    const responseText = await response.text();
    
    // Handle specific HTTP errors
    if (response.status === 404) {
      res.status(404).json({
        ok: false,
        error: "Slack webhook not found (404). Your webhook URL may be invalid or expired.",
        hint: "Regenerate your webhook URL in Slack and update SLACK_WEBHOOK_URL in Vercel"
      });
      return;
    }

    if (response.status === 410) {
      res.status(410).json({
        ok: false,
        error: "Slack webhook has been deactivated (410). The URL is no longer valid.",
        hint: "Create a new webhook URL in Slack and update it in Vercel"
      });
      return;
    }

    if (!response.ok) {
      res.status(response.status).json({
        ok: false,
        error: `Slack returned HTTP ${response.status}.`,
        details: responseText,
      });
      return;
    }

    res.status(200).json({ ok: true, message: "Sent to Slack." });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected Slack error.",
    });
  }
}
