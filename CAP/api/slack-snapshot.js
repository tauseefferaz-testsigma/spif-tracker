export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ ok: false, error: "SLACK_WEBHOOK_URL is not configured in Vercel." });
    return;
  }

  const { text, image_base64, isImage } = req.body;

  if (!text) {
    res.status(400).json({ ok: false, error: "Message text is required." });
    return;
  }

  try {
    // If this is an image, send as image file
    if (isImage && image_base64) {
      // Get Slack token from webhook URL (extract token part)
      // Note: Webhook URLs don't have direct file upload capability
      // We need to use the legacy API with a bot token or use incoming webhook with message blocks
      
      // For incoming webhooks, we'll send a message with image blocks
      const imageBuffer = Buffer.from(image_base64, "base64");
      const fileName = `snapshot-${new Date().toISOString().slice(0, 10)}.png`;
      
      // Send via webhook with image attachment
      const slackMessage = {
        text: text,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: text
            }
          },
          {
            type: "image",
            image_url: `data:image/png;base64,${image_base64}`,
            alt_text: "Weekly Snapshot"
          }
        ]
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(slackMessage),
      });

      const responseText = await response.text();
      if (!response.ok) {
        res.status(response.status).json({
          ok: false,
          error: `Slack returned HTTP ${response.status}`,
          details: responseText,
        });
        return;
      }

      res.status(200).json({ ok: true, message: "Snapshot image sent to Slack!" });
      return;
    }

    // Fallback: send as text message
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ text }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      res.status(response.status).json({
        ok: false,
        error: `Slack returned HTTP ${response.status}`,
        details: responseText,
      });
      return;
    }

    res.status(200).json({ ok: true, message: "Sent to Slack." });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error.",
    });
  }
}
