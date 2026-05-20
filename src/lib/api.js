export async function sendToSlack(message) {
  const response = await fetch('/api/slack-snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })
  return response.ok
}

export async function sendImageToSlack(formData) {
  const response = await fetch('/api/slack-image-snapshot', {
    method: 'POST',
    body: formData
  })
  return response.ok
}
