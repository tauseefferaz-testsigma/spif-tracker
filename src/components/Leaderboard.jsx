import { useMemo } from 'react';
import { REVIEW_TARGET } from '../types/index.js';
import { buildLeaderboard } from '../lib/stats.js';
import { Card, ProgressBar, colors } from './ui.jsx';

export default function Leaderboard({ submissions }) {
  const lb   = useMemo(() => buildLeaderboard(submissions), [submissions]);
  const top3 = lb.slice(0, 3);

  return (
    <div>
      {/* Top 3 podium */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        {top3.map((c, i) => {
          const medals  = ['🥇', '🥈', '🥉'];
          const accents = ['#f59e0b', '#94a3b8', '#b45309'];
          return (
            <div key={c.csm} style={{
              background: colors.surface, border: `1px solid ${colors.border}`,
              borderTop: `3px solid ${accents[i]}`,
              borderRadius: 14, padding: '22px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{medals[i]}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: colors.dark }}>{c.csm}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: colors.accent, lineHeight: 1 }}>{c.pts}</div>
              <div style={{ fontSize: 11, color: colors.muted, margin: '4px 0 8px' }}>points</div>
              <div style={{ fontSize: 12, color: colors.muted }}>{c.reviews} reviews</div>
            </div>
          );
        })}
      </div>

      {/* Full ranked list */}
      <Card>
        {lb.map((c, i) => (
          <div key={c.csm} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 4px',
            borderBottom: i < lb.length - 1 ? `1px solid ${colors.border}` : 'none',
          }}>
            <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#ccc' }}>
              #{i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.dark, marginBottom: 3 }}>{c.csm}</div>
              <div style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>
                {c.reviews} / {REVIEW_TARGET} reviews · {c.activities} activities
              </div>
              <ProgressBar value={c.reviews} max={REVIEW_TARGET} color={colors.green} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: colors.accent, minWidth: 56, textAlign: 'right' }}>
              {c.pts} pts
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
