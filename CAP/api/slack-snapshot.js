export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ ok: false, error: "SLACK_WEBHOOK_URL is not configured." });
    return;
  }

  const { text } = req.body;

  if (!text) {
    res.status(400).json({ ok: false, error: "Text is required." });
    return;
  }

  try {
    // Send formatted message to Slack
    const payload = {
      text: text,
      mrkdwn: true
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 200) {
      res.status(200).json({ ok: true, message: "Sent to Slack! 📸" });
      return;
    }

    const responseText = await response.text();
    res.status(response.status).json({
      ok: false,
      error: `Slack returned HTTP ${response.status}`,
      details: responseText
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Error sending to Slack"
    });
  }
}
