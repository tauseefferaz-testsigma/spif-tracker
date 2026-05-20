import { useState, useEffect, useCallback } from 'react';
import { fetchSubmissions, createSubmission, updateSubmission, deleteSubmission } from '../lib/api.js';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await fetchSubmissions();
      setSubmissions(data);
      setLastSynced(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(async (formData) => {
    try {
      const result = await createSubmission(formData);
      if (result.ok) {
        await reload();
        return { ok: true };
      }
      return { ok: false, errors: result.errors };
    } catch (err) {
      return { ok: false, errors: { _global: err.message } };
    }
  }, [reload]);

  const update = useCallback(async (rowIndex, formData) => {
    try {
      const result = await updateSubmission(rowIndex, formData);
      if (result.ok) {
        await reload();
        return { ok: true };
      }
      return { ok: false, errors: result.errors };
    } catch (err) {
      return { ok: false, errors: { _global: err.message } };
    }
  }, [reload]);

  const remove = useCallback(async (rowIndex) => {
    try {
      const result = await deleteSubmission(rowIndex);
      if (result.ok) {
        await reload();
        return { ok: true };
      }
      return { ok: false, error: result.error };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [reload]);

  return {
    submissions,
    loading,
    refreshing,
    error,
    lastSynced,
    reload,
    create,
    update,
    remove,
  };
}
