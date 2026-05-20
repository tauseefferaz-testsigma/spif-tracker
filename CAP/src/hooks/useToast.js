import { useState, useCallback } from 'react';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const success = useCallback((message) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type: 'success', message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const error = useCallback((message) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type: 'error', message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, success, error, dismiss };
}
