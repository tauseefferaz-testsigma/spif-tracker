import { useState } from 'react';
import { useSubmissions } from './hooks/useSubmissions.js';
import { useToast }       from './hooks/useToast.js';
import { isConfigured }   from './lib/api.js';
import { colors }         from './components/ui.jsx';
import SubmissionForm  from './components/SubmissionForm.jsx';
import Dashboard       from './components/Dashboard.jsx';
import Leaderboard     from './components/Leaderboard.jsx';
import SubmissionLog   from './components/SubmissionLog.jsx';
import { ToastContainer } from './components/ui.jsx';

const TABS = [
  { key: 'submit',      label: 'Log Activity',     icon: '✏️' },
  { key: 'dashboard',   label: 'Dashboard',         icon: '📊' },
  { key: 'leaderboard', label: 'Leaderboard',       icon: '🏆' },
  { key: 'log',         label: 'All Submissions',   icon: '📋' },
];

export default function App() {
  const [tab,        setTab]        = useState('submit');
  const [editTarget, setEditTarget] = useState(null);
  const { toasts, success, error: toastError, dismiss } = useToast();
  const {
    submissions, loading, refreshing, error: dataError,
    lastSynced, reload, create, update, remove,
  } = useSubmissions();

  // ── Not configured guard
  if (!isConfigured()) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 500, background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 16, padding: 36 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Setup Required</h2>
          <p style={{ color: colors.mid, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            The environment variable <code style={{ background: '#f0eeff', padding: '2px 6px', borderRadius: 4 }}>VITE_APPS_SCRIPT_URL</code> is not set.
          </p>
          <ol style={{ color: colors.mid, fontSize: 14, paddingLeft: 20, lineHeight: 2 }}>
            <li>Deploy the Google Apps Script backend</li>
            <li>Copy the Web App URL</li>
            <li>In Vercel: Settings → Environment Variables → add <code>VITE_APPS_SCRIPT_URL</code></li>
            <li>Redeploy on Vercel</li>
          </ol>
        </div>
      </div>
    );
  }

  async function handleFormSubmit(formData, rowIndex) {
    if (rowIndex) {
      const result = await update(rowIndex, formData);
      if (result.ok) {
        success('Entry updated in Google Sheet.');
        setEditTarget(null);
        setTab('log');
      } else if (result.errors?._global) {
        toastError(result.errors._global);
      }
      return result;
    } else {
      const result = await create(formData);
      if (result.ok) {
        success('Activity logged successfully!');
      } else if (result.errors?._global) {
        toastError(result.errors._global);
      }
      return result;
    }
  }

  function handleEditRequest(submission) {
    setEditTarget(submission);
    setTab('submit');
  }

  async function handleDelete(rowIndex) {
    const result = await remove(rowIndex);
    if (result.ok) {
      success('Entry deleted from Google Sheet.');
    } else {
      toastError(result.error || 'Delete failed.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      {/* Header */}
      <div style={{ background: colors.dark, color: '#fff', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16 }}>
          <span style={{ fontSize: 20 }}>🏅</span>
          <span>SPIF Tracker</span>
          <span style={{ fontSize: 11, background: '#333', color: '#aaa', padding: '2px 9px', borderRadius: 99, fontWeight: 500 }}>
            Advocacy Program
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {refreshing && (
            <span style={{ fontSize: 11, color: '#aaa' }}>syncing…</span>
          )}
          {lastSynced && !refreshing && (
            <span style={{ fontSize: 11, color: '#666' }}>
              {submissions.filter(r => !r._pending).length} submissions
            </span>
          )}
          <button
            onClick={reload}
            disabled={refreshing}
            style={{ background: 'none', border: '1px solid #444', color: '#aaa', borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 16px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key !== 'submit') setEditTarget(null); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '13px 16px', fontSize: 14,
            fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? colors.dark : colors.muted,
            borderBottom: tab === t.key ? `2px solid ${colors.dark}` : '2px solid transparent',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>

        {/* Data error banner */}
        {dataError && (
          <div style={{ background: '#fee2e2', color: '#7f1d1d', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {dataError}</span>
            <button onClick={reload} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7f1d1d', fontWeight: 700, fontSize: 13 }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.muted, fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading submissions…
          </div>
        ) : (
          <>
            {tab === 'submit' && (
              <div style={{ maxWidth: 560 }}>
                <SubmissionForm
                  onSubmit={handleFormSubmit}
                  editTarget={editTarget}
                  onCancelEdit={() => setEditTarget(null)}
                  disabled={refreshing}
                />
              </div>
            )}

            {tab === 'dashboard' && (
              <Dashboard submissions={submissions} />
            )}

            {tab === 'leaderboard' && (
              <Leaderboard submissions={submissions} />
            )}

            {tab === 'log' && (
              <SubmissionLog
                submissions={submissions}
                onEdit={handleEditRequest}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
