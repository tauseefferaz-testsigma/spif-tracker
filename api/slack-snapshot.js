const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'No message provided' })
    }

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    })

    if (!response.ok) {
      throw new Error('Failed to send to Slack')
    }

    return res.json({
      status: 'success',
      message: 'Message sent to Slack'
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}
