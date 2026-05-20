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
  const imageBase64 = req.body?.image_base64;

  if (!text && !imageBase64) {
    res.status(400).json({ ok: false, error: "Slack message text or image is required." });
    return;
  }

  try {
    // If image data is provided, send as file upload
    if (imageBase64) {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageBase64, "base64");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", new Blob([imageBuffer], { type: "image/png" }), "snapshot.png");
      formData.append("channels", "#general"); // Change to your channel
      formData.append("title", text || "Weekly Snapshot");

      const uploadResponse = await fetch("https://slack.com/api/files.upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${webhookUrl.split("hooks/")[1] || ""}`,
        },
        body: formData,
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.ok) {
        // Fallback: send as text message if file upload fails
        const textResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ text: text || "📸 Snapshot (image upload failed)" }),
        });

        if (!textResponse.ok) {
          res.status(textResponse.status).json({
            ok: false,
            error: `Slack returned HTTP ${textResponse.status}.`,
          });
          return;
        }
      }

      res.status(200).json({ ok: true, message: "Snapshot sent to Slack!" });
      return;
    }

    // Send as text message
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
