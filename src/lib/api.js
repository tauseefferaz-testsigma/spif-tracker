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

// Apps Script only supports GET and POST in no-cors mode.
// All write operations (create, update, delete) go through POST with an _action field.

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
    throw new Error('This request is already in progress. Please wait.');
  }
  inFlight.add(dedupKey);

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, attempt * 1000));
        log('warn', `POST retry ${attempt}/${retries}`, { action: payload._action });
      }
      // no-cors POST is the only reliable cross-origin write method for Apps Script
      await withTimeout(fetch(BASE_URL, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(payload),
      }));
      log('log', `POST success`, { action: payload._action });
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

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function fetchSubmissions() {
  const data = await get();
  if (!Array.isArray(data.submissions)) {
    log('warn', 'Unexpected response shape', data);
    return [];
  }
  return data.submissions;
}

export async function createSubmission(payload) {
  log('log', 'Creating submission', { csm: payload.csm, activity: payload.activity });
  return post({ ...payload, _action: 'create' });
}

export async function updateSubmission(payload) {
  if (!payload.rowIndex) throw new Error('rowIndex is required for updates.');
  log('log', 'Updating submission', { rowIndex: payload.rowIndex });
  return post({ ...payload, _action: 'update' });
}

export async function deleteSubmission(rowIndex) {
  if (!rowIndex) throw new Error('rowIndex is required for deletion.');
  log('log', 'Deleting submission', { rowIndex });
  return post({ rowIndex, _action: 'delete' });
}

export function isConfigured() {
  return Boolean(BASE_URL);
}
