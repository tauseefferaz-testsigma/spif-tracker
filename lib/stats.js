import { ACTIVITIES, ACTIVITY_CATEGORIES, csmsForQuarter, getTeamTargets, canonicalCsmName, normalizeQuarter, CURRENT_QUARTER } from "../types/index.js";

function isReview(label)    { return ACTIVITIES.find(a => a.label === label)?.category === "Reviews"; }
function isReference(label) { return label === "Reference Customer"; }
function isStory(label)     { return label === "Success Story"; }

export function buildCsmStats(submissions, quarter = CURRENT_QUARTER) {
  // Defensively scope to the requested quarter here too (not just via the
  // caller pre-filtering) so Q3 2026 activity can never leak into Q2 2026
  // totals or vice versa, regardless of what's passed in.
  const real = submissions.filter(r => !r._pending && normalizeQuarter(r.quarter) === quarter);
  const map  = {};

  csmsForQuarter(quarter).forEach(csm => {
    map[csm.name] = { name: csm.name, track: csm.track, targets: csm.targets,
      pts: 0, reviews: 0, references: 0, stories: 0, activities: 0 };
  });

  for (const row of real) {
    const key = canonicalCsmName(row.csm); // resolves legacy aliases (e.g. "sakshi.bagri")
    if (!map[key]) continue;
    map[key].pts        += Number(row.points) || 0;
    map[key].activities += 1;
    if (isReview(row.activity))    map[key].reviews    += Number(row.reviews) || 0;
    if (isReference(row.activity)) map[key].references += 1;
    if (isStory(row.activity))     map[key].stories    += 1;
  }

  return Object.values(map).sort((a, b) => b.pts - a.pts);
}

export function buildTeamSummary(submissions, quarter = CURRENT_QUARTER) {
  const stats = buildCsmStats(submissions, quarter);
  return {
    totalPts:     stats.reduce((s, c) => s + c.pts, 0),
    totalReviews: stats.reduce((s, c) => s + c.reviews, 0),
    totalRefs:    stats.reduce((s, c) => s + c.references, 0),
    totalStories: stats.reduce((s, c) => s + c.stories, 0),
    totalActs:    stats.reduce((s, c) => s + c.activities, 0),
    targets:      getTeamTargets(quarter),
  };
}

export function buildLeaderboard(submissions, quarter = CURRENT_QUARTER) {
  return buildCsmStats(submissions, quarter);
}

export function buildActivityBreakdown(submissions, quarter = CURRENT_QUARTER) {
  const real = submissions.filter(r => !r._pending && normalizeQuarter(r.quarter) === quarter);
  return ACTIVITIES.map(act => {
    const rows  = real.filter(r => r.activity === act.label);
    const count = act.perReview
      ? rows.reduce((s, r) => s + (Number(r.reviews) || 0), 0)
      : rows.length;
    const pts   = rows.reduce((s, r) => s + (Number(r.points) || 0), 0);
    return { ...act, count, pts };
  });
}

export function buildCategoryBreakdown(submissions, quarter = CURRENT_QUARTER) {
  const actBreak = buildActivityBreakdown(submissions, quarter);
  return ACTIVITY_CATEGORIES.map(cat => {
    const acts = actBreak.filter(a => a.category === cat);
    return { category: cat, count: acts.reduce((s,a)=>s+a.count,0), pts: acts.reduce((s,a)=>s+a.pts,0), acts };
  });
}
