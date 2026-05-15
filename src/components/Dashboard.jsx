import { useMemo } from 'react';
import { CSMS, CERT_THRESHOLD, PAYOUT_THRESHOLD, formatDate, getPayoutStatus } from '../types/index.js';
import { buildSummaryStats, buildLeaderboard, buildActivityBreakdown } from '../lib/stats.js';
import { exportReport } from '../lib/pdf.js';
import { StatCard, Card, Badge, ProgressBar, Button, SectionTitle, colors } from './ui.jsx';

export default function Dashboard({ submissions }) {
  const stats     = useMemo(() => buildSummaryStats(submissions), [submissions]);
  const lb        = useMemo(() => buildLeaderboard(submissions),  [submissions]);
  const actBreak  = useMemo(() => buildActivityBreakdown(submissions), [submissions]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.dark }}>📊 Live Dashboard</h2>
        <Button variant="secondary" onClick={() => exportReport(submissions)}>
          ⬇ Download PDF Report
        </Button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Points"    value={stats.totalPts}    accent={colors.accent} />
        <StatCard label="G2 Reviews"      value={stats.g2Reviews}   accent={colors.green} />
        <StatCard label="Case Studies"    value={stats.caseStudies} accent={colors.amber} />
        <StatCard label="At Payout (50+)" value={stats.atPayout}    accent={colors.purple} sub={`of ${CSMS.length} CSMs`} />
      </div>

      {/* Progress bars */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Progress to payout</SectionTitle>
        {lb.map(c => {
          const status = getPayoutStatus(c.pts);
          const barColor = c.pts >= CERT_THRESHOLD ? colors.purple
            : c.pts >= PAYOUT_THRESHOLD ? colors.green
            : colors.accent;
          return (
            <div key={c.csm} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{c.csm}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge color={status.color}>{status.label}</Badge>
                  <span style={{ fontSize: 14, fontWeight: 700, minWidth: 54, textAlign: 'right' }}>
                    {c.pts} pts
                  </span>
                </div>
              </div>
              <ProgressBar value={c.pts} max={CERT_THRESHOLD} color={barColor} />
            </div>
          );
        })}
      </Card>

      {/* Activity Breakdown */}
      <Card>
        <SectionTitle>Activity breakdown</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f7f6f2' }}>
              <th style={{ textAlign: 'left',   padding: '9px 12px', fontWeight: 600, color: colors.mid }}>Activity</th>
              <th style={{ textAlign: 'center', padding: '9px 12px', fontWeight: 600, color: colors.mid }}>Reviews / Count</th>
              <th style={{ textAlign: 'center', padding: '9px 12px', fontWeight: 600, color: colors.mid }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {actBreak.map(a => (
              <tr key={a.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                <td style={{ padding: '10px 12px' }}>{a.label}</td>
                <td style={{ textAlign: 'center', padding: '10px 12px' }}>{a.count}</td>
                <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 600, color: colors.accent }}>{a.pts}</td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${colors.dark}`, background: '#f7f6f2' }}>
              <td style={{ padding: '10px 12px', fontWeight: 700 }}>TOTAL</td>
              <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>
                {actBreak.reduce((s, a) => s + a.count, 0)}
              </td>
              <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: colors.accent }}>
                {actBreak.reduce((s, a) => s + a.pts, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
