import { useState, useMemo } from 'react';
import { CSMS, formatDate } from '../types/index.js';
import { Card, Badge, Button, Select, Input, EmptyState, colors } from './ui.jsx';

export default function SubmissionLog({ submissions, onEdit, onDelete }) {
  const [search,    setSearch]    = useState('');
  const [filterCsm, setFilterCsm] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return submissions
      .filter(r => filterCsm === 'All' || r.csm === filterCsm)
      .filter(r => {
        if (!q) return true;
        return [r.csm, r.activity, r.tier, r.notes || ''].some(v =>
          String(v).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [submissions, search, filterCsm]);

  async function handleDelete(row) {
    if (!window.confirm(`Delete this entry?\n\n${row.csm} — ${row.activity} (${formatDate(row.date)})\n\nThis cannot be undone.`)) {
      return;
    }
    setDeletingId(row.rowIndex);
    await onDelete(row.rowIndex);
    setDeletingId(null);
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          value={search}
          onChange={setSearch}
          placeholder="Search CSM, activity, notes…"
        />
        <div style={{ width: 220, flexShrink: 0 }}>
          <Select
            value={filterCsm}
            onChange={setFilterCsm}
            options={[{ value: 'All', label: 'All CSMs' }, ...CSMS.map(c => ({ value: c, label: c }))]}
          />
        </div>
      </div>

      <Card>
        {filtered.length === 0
          ? <EmptyState message={submissions.length === 0 ? 'No submissions yet. Log the first one!' : 'No results match your search.'} />
          : filtered.map((s, i) => (
              <div key={`${s.rowIndex}_${i}`} style={{
                padding: '13px 4px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${colors.border}` : 'none',
                opacity: s._pending || deletingId === s.rowIndex ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: colors.dark }}>{s.csm}</span>
                      <Badge color="gray">{s.tier}</Badge>
                      {s.reviews && Number(s.reviews) > 0 && <Badge color="blue">×{s.reviews} reviews</Badge>}
                      {s._pending && <Badge color="amber">saving…</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: colors.mid }}>{s.activity}</div>
                    {s.notes && (
                      <div style={{ fontSize: 12, color: colors.muted, marginTop: 2, fontStyle: 'italic' }}>
                        {s.notes}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{formatDate(s.date)}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: colors.accent }}>
                      +{s.points}
                    </span>
                    {!s._pending && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => onEdit(s)}
                          disabled={deletingId === s.rowIndex}
                          style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(s)}
                          disabled={deletingId === s.rowIndex}
                          style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8 }}
                        >
                          {deletingId === s.rowIndex ? '…' : '🗑️'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
        }
      </Card>

      <div style={{ marginTop: 10, fontSize: 12, color: colors.muted, textAlign: 'right' }}>
        {filtered.length} of {submissions.length} submissions
      </div>
    </div>
  );
}
