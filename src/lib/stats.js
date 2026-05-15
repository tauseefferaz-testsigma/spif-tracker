import { CSMS, REVIEW_TARGET, ACTIVITIES } from '../types/index.js';

export function buildLeaderboard(submissions) {
  const map = {};
  CSMS.forEach(csm => {
    map[csm] = { csm, pts: 0, reviews: 0, activities: 0 };
  });

  for (const row of submissions) {
    if (row._pending) continue;
    const csm = row.csm;
    if (!csm) continue;
    if (!map[csm]) map[csm] = { csm, pts: 0, reviews: 0, activities: 0 };
    map[csm].pts        += Number(row.points) || 0;
    map[csm].activities += 1;
    // Count reviews = G2 Review + Gartner (both showCount activities)
    if (row.reviews && Number(row.reviews) > 0) {
      const act = ACTIVITIES.find(a => a.label === row.activity);
      if (act?.showCount) {
        map[csm].reviews += Number(row.reviews) || 0;
      }
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
  const real        = submissions.filter(r => !r._pending);
  const totalPts    = real.reduce((s, r) => s + (Number(r.points) || 0), 0);
  const totalActs   = real.length;
  // Reviews = sum of review counts for showCount activities
  const totalReviews = real
    .filter(r => {
      const act = ACTIVITIES.find(a => a.label === r.activity);
      return act?.showCount;
    })
    .reduce((s, r) => s + (Number(r.reviews) || 0), 0);
  const primaryActs = real.filter(r => {
    const act = ACTIVITIES.find(a => a.label === r.activity);
    return act?.category === 'Primary';
  }).length;

  return { totalPts, totalReviews, totalActs, primaryActs };
}
