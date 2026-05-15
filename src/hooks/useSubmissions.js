import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchSubmissions,
  createSubmission,
  updateSubmission,
  deleteSubmission,
} from '../lib/api.js';
import { sanitizeSubmission, validateSubmission } from '../types/index.js';

const POLL_INTERVAL_MS = 30_000;

export function useSubmissions() {
  const [submissions, setSubmissions]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState(null);
  const [lastSynced, setLastSynced]       = useState(null);
  const pollRef                           = useRef(null);
  const mountedRef                        = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await fetchSubmissions();
      if (mountedRef.current) {
        setSubmissions(data);
        setLastSynced(new Date());
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    mountedRef.current = true;
    load(false);
    pollRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
    };
  }, [load]);

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async function create(formData) {
    const { valid, errors } = validateSubmission(formData);
    if (!valid) return { ok: false, errors };

    const payload = sanitizeSubmission(formData);

    // Optimistic: add placeholder row immediately
    const tempId = `temp_${Date.now()}`;
    const optimisticRow = { ...payload, rowIndex: tempId, _pending: true };
    setSubmissions(prev => [optimisticRow, ...prev]);

    try {
      await createSubmission(payload);
      // Replace optimistic row with real data after a short delay for Sheet to settle
      setTimeout(() => load(true), 1500);
      return { ok: true };
    } catch (err) {
      // Roll back optimistic update
      setSubmissions(prev => prev.filter(r => r.rowIndex !== tempId));
      return { ok: false, errors: { _global: err.message } };
    }
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async function update(rowIndex, formData) {
    if (!rowIndex) return { ok: false, errors: { _global: 'Missing row reference.' } };

    const { valid, errors } = validateSubmission(formData);
    if (!valid) return { ok: false, errors };

    const payload = sanitizeSubmission(formData);
    const original = submissions.find(r => r.rowIndex === rowIndex);

    // Optimistic update
    setSubmissions(prev =>
      prev.map(r => r.rowIndex === rowIndex ? { ...r, ...payload, _pending: true } : r)
    );

    try {
      await updateSubmission({ ...payload, rowIndex });
      setTimeout(() => load(true), 1500);
      return { ok: true };
    } catch (err) {
      // Roll back to original
      if (original) {
        setSubmissions(prev =>
          prev.map(r => r.rowIndex === rowIndex ? original : r)
        );
      }
      return { ok: false, errors: { _global: err.message } };
    }
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  async function remove(rowIndex) {
    if (!rowIndex) return { ok: false, error: 'Missing row reference.' };

    const original = submissions.find(r => r.rowIndex === rowIndex);

    // Optimistic remove
    setSubmissions(prev => prev.filter(r => r.rowIndex !== rowIndex));

    try {
      await deleteSubmission(rowIndex);
      setTimeout(() => load(true), 1500);
      return { ok: true };
    } catch (err) {
      // Roll back
      if (original) {
        setSubmissions(prev => [...prev, original].sort((a, b) =>
          new Date(b.date) - new Date(a.date)
        ));
      }
      return { ok: false, error: err.message };
    }
  }

  return {
    submissions,
    loading,
    refreshing,
    error,
    lastSynced,
    reload: () => load(true),
    create,
    update,
    remove,
  };
}
