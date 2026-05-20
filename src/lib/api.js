const BASE_URL   = import.meta.env.VITE_APPS_SCRIPT_URL || '';
const TIMEOUT_MS = 15_000;
const inFlight   = new Set();

function log(level, message, data = {}) {
  const prefix = `[SPIF ${new Date().toISOString()}]`;
  if (level === 'error') console.error(prefix, message, data);
  else if (level === 'warn') console.warn(prefix, message, data);
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

async function get(retries = 2) {
  if (!BASE_URL) throw new Error('VITE_APPS_SCRIPT_URL is not configured.');
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        log('warn', `GET retry ${attempt}/${retries}`);
      }
      const res  = await withTimeout(fetch(BASE_URL));
      const data = await res.json();
      log('log', 'GET success', { count: data.submissions?.length });
      return data;
    } catch (err) {
      lastError = err;
      log('error', `GET attempt ${attempt + 1} failed`, { error: err.message });
    }
  }
  throw lastError || new Error('Failed to load data.');
}

async function post(payload, retries = 2) {
  if (!BASE_URL) throw new Error('VITE_APPS_SCRIPT_URL is not configured.');
  const dedupKey = JSON.stringify(payload);
  if (inFlight.has(dedupKey)) {
    log('warn', 'Duplicate request blocked', { action: payload._action });
    throw new Error('This request is already in progress.');
  }
  inFlight.add(dedupKey);
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        log('warn', `POST retry ${attempt}/${retries}`, { action: payload._action });
      }
      await withTimeout(fetch(BASE_URL, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(payload),
      }));
      log('log', 'POST success', { action: payload._action });
      inFlight.delete(dedupKey);
      return { success: true };
    } catch (err) {
      lastError = err;
      log('error', `POST attempt ${attempt + 1} failed`, { error: err.message });
    }
  }
  inFlight.delete(dedupKey);
  throw lastError || new Error('Request failed after retries.');
}

export async function fetchSubmissions() {
  const data = await get();
  if (!Array.isArray(data.submissions)) return [];
  return data.submissions;
}

export async function createSubmission(payload) {
  return post({ ...payload, _action: 'create' });
}

export async function updateSubmission(payload) {
  if (!payload.rowIndex) throw new Error('rowIndex is required for updates.');
  return post({ ...payload, _action: 'update' });
}

export async function deleteSubmission(rowIndex) {
  if (!rowIndex) throw new Error('rowIndex is required for deletion.');
  return post({ rowIndex, _action: 'delete' });
}

export function isConfigured() {
  return Boolean(BASE_URL);
}
