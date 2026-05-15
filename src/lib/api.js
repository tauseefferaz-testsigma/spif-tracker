const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// Request timeout in ms
const TIMEOUT_MS = 15_000;

// In-flight request tracker to prevent duplicate submissions
const inFlight = new Set();

// ─── INTERNAL ─────────────────────────────────────────────────────────────────

function log(level, message, data = {}) {
  const prefix = `[SPIF API ${new Date().toISOString()}]`;
  if (level === 'error') console.error(prefix, message, data);
  else if (level === 'warn')  console.warn(prefix, message, data);
  else console.log(prefix, message, data);
}

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function request(method, payload = null, retries = 2) {
  if (!BASE_URL) {
    throw new Error('VITE_APPS_SCRIPT_URL is not configured.');
  }

  const dedupKey = payload ? `${method}:${JSON.stringify(payload)}` : method;

  if (method !== 'GET' && inFlight.has(dedupKey)) {
    log('warn', 'Duplicate request blocked', { dedupKey });
    throw new Error('A duplicate request is already in progress. Please wait.');
  }

  if (method !== 'GET') inFlight.add(dedupKey);

  const options = {
    method,
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  };
  if (payload) options.body = JSON.stringify(payload);

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = attempt * 1000;
        log('warn', `Retrying (${attempt}/${retries}) after ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }

      if (method === 'GET') {
        const res = await withTimeout(fetch(BASE_URL));
        const data = await res.json();
        log('log', 'GET success', { count: data.submissions?.length });
        return data;
      } else {
        // no-cors returns opaque response — we can't read body
        await withTimeout(fetch(BASE_URL, options));
        log('log', `${method} success (opaque response)`);
        return { success: true };
      }
    } catch (err) {
      lastError = err;
      log('error', `${method} attempt ${attempt + 1} failed`, { error: err.message });
    }
  }

  if (method !== 'GET') inFlight.delete(dedupKey);
  throw lastError || new Error('Request failed after retries.');
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function fetchSubmissions() {
  const data = await request('GET');
  if (!Array.isArray(data.submissions)) {
    log('warn', 'Unexpected response shape', data);
    return [];
  }
  return data.submissions;
}

export async function createSubmission(payload) {
  log('log', 'Creating submission', payload);
  const result = await request('POST', { ...payload, _action: 'create' });
  return result;
}

export async function updateSubmission(payload) {
  if (!payload.rowIndex) throw new Error('rowIndex is required for updates.');
  log('log', 'Updating submission', { rowIndex: payload.rowIndex });
  const result = await request('PUT', { ...payload, _action: 'update' });
  return result;
}

export async function deleteSubmission(rowIndex) {
  if (!rowIndex) throw new Error('rowIndex is required for deletion.');
  log('log', 'Deleting submission', { rowIndex });
  const result = await request('DELETE', { rowIndex, _action: 'delete' });
  return result;
}

export function isConfigured() {
  return Boolean(BASE_URL);
}
