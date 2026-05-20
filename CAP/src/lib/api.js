const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export function isConfigured() {
  return Boolean(API_URL);
}

export async function fetchSubmissions() {
  if (!isConfigured()) {
    throw new Error('VITE_APPS_SCRIPT_URL not configured');
  }

  const response = await fetch(`${API_URL}?action=read`);
  if (!response.ok) {
    throw new Error('Failed to fetch submissions');
  }

  const data = await response.json();
  return data.rows || [];
}

export async function createSubmission(formData) {
  if (!isConfigured()) {
    throw new Error('VITE_APPS_SCRIPT_URL not configured');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', ...formData }),
  });

  if (!response.ok) {
    throw new Error('Failed to create submission');
  }

  return await response.json();
}

export async function updateSubmission(rowIndex, formData) {
  if (!isConfigured()) {
    throw new Error('VITE_APPS_SCRIPT_URL not configured');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', rowIndex, ...formData }),
  });

  if (!response.ok) {
    throw new Error('Failed to update submission');
  }

  return await response.json();
}

export async function deleteSubmission(rowIndex) {
  if (!isConfigured()) {
    throw new Error('VITE_APPS_SCRIPT_URL not configured');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', rowIndex }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete submission');
  }

  return await response.json();
}
