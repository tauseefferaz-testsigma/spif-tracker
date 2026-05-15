import { CSMS, PAYOUT_THRESHOLD, CERT_THRESHOLD, ACTIVITIES } from '../types/index.js';

export function buildLeaderboard(submissions) {
  const map = {};
  CSMS.forEach(csm => {
    map[csm] = { csm, pts: 0, reviews: 0, activities: 0 };
  });

  for (const row of submissions) {
    if (row._pending) continue; // exclude in-flight rows from stats
    const csm = row.csm;
    if (!csm) continue;
    if (!map[csm]) map[csm] = { csm, pts: 0, reviews: 0, activities: 0 };
    map[csm].pts        += Number(row.points) || 0;
    map[csm].activities += 1;
    if (String(row.activity).startsWith('G2 Review')) {
      map[csm].reviews += Number(row.reviews) || 0;
    }
  }

  return Object.values(map).sort((a, b) => b.pts - a.pts);
}

export function buildActivityBreakdown(submissions) {
  return ACTIVITIES.map(act => {
    const rows = submissions.filter(r => r.activity === act.label && !r._pending);
    const count = act.perReview
      ? rows.reduce((s, r) => s + (Number(r.reviews) || 0), 0)
      : rows.length;
    const pts = rows.reduce((s, r) => s + (Number(r.points) || 0), 0);
    return { ...act, count, pts };
  });
}

export function buildSummaryStats(submissions) {
  const real = submissions.filter(r => !r._pending);
  const totalPts    = real.reduce((s, r) => s + (Number(r.points) || 0), 0);
  const g2Reviews   = real
    .filter(r => String(r.activity).startsWith('G2 Review'))
    .reduce((s, r) => s + (Number(r.reviews) || 0), 0);
  const caseStudies = real.filter(r => r.activity === 'Case Study').length;
  const lb          = buildLeaderboard(real);
  const atPayout    = lb.filter(c => c.pts >= PAYOUT_THRESHOLD).length;

  return { totalPts, g2Reviews, caseStudies, atPayout };
}
