const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#advocacy-updates'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const formData = req.body

    if (!formData.image) {
      return res.status(400).json({ error: 'No image provided' })
    }

    const title = formData.title || '📸 Dashboard Snapshot'

    const response = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: formData
    })

    const result = await response.json()

    if (!result.ok) {
      console.error('Slack API error:', result.error)
      return res.status(500).json({
        error: 'Failed to upload to Slack',
        details: result.error
      })
    }

    return res.json({
      status: 'success',
      message: 'Image sent to Slack successfully',
      file: result.file,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error sending image to Slack:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}
