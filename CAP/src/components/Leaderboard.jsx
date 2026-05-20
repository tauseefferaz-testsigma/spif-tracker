import { useMemo } from 'react';
import { buildCsmStats } from '../lib/stats.js';
import { getPaceStatus, PACE_LABELS } from '../types/index.js';
import { Card, colors } from './ui.jsx';

export default function Leaderboard({ submissions }) {
  const stats = useMemo(() => buildCsmStats(submissions), [submissions]);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.dark, marginBottom: 16 }}>🏆 Leaderboard</h2>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f7f6f2' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600, color: colors.muted }}>Rank</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600, color: colors.muted }}>CSM</th>
              <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, color: colors.muted }}>Points</th>
              <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, color: colors.muted }}>Reviews</th>
              <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600, color: colors.muted }}>Pace</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((csm, i) => {
              const pace = csm.targets ? getPaceStatus(csm.reviews, csm.targets.reviews) : null;
              const paceLabel = pace ? PACE_LABELS[pace] : null;
              
              return (
                <tr key={csm.name} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: colors.dark }}>#{i + 1}</td>
                  <td style={{ padding: '12px' }}>{csm.name}</td>
                  <td style={{ textAlign: 'center', padding: '12px', fontWeight: 700, color: colors.accent }}>{csm.pts}</td>
                  <td style={{ textAlign: 'center', padding: '12px', color: colors.mid }}>
                    {csm.reviews}{csm.targets ? ` / ${csm.targets.reviews}` : ''}
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    {paceLabel && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: `#${paceLabel.bg}`,
                        color: `#${paceLabel.color}`,
                      }}>
                        {paceLabel.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
