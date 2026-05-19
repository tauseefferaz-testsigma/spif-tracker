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
