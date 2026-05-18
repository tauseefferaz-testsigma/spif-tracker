import { CSMS, ACTIVITIES, ACTIVITY_CATEGORIES, TEAM_TARGETS } from "../types/index.js";

function isReview(label)    { return ACTIVITIES.find(a => a.label === label)?.category === "Reviews"; }
function isReference(label) { return label === "Reference Customer"; }
function isStory(label)     { return label === "Success Story"; }

export function buildCsmStats(submissions) {
  const real = submissions.filter(r => !r._pending);
  const map  = {};

  CSMS.forEach(csm => {
    map[csm.name] = { name: csm.name, track: csm.track, targets: csm.targets,
      pts: 0, reviews: 0, references: 0, stories: 0, activities: 0 };
  });

  for (const row of real) {
    const key = row.csm; // always full name in sheet
    if (!map[key]) continue;
    map[key].pts        += Number(row.points) || 0;
    map[key].activities += 1;
    if (isReview(row.activity))    map[key].reviews    += Number(row.reviews) || 0;
    if (isReference(row.activity)) map[key].references += 1;
    if (isStory(row.activity))     map[key].stories    += 1;
  }

  return Object.values(map).sort((a, b) => b.pts - a.pts);
}

export function buildTeamSummary(submissions) {
  const stats = buildCsmStats(submissions);
  return {
    totalPts:     stats.reduce((s, c) => s + c.pts, 0),
    totalReviews: stats.reduce((s, c) => s + c.reviews, 0),
    totalRefs:    stats.reduce((s, c) => s + c.references, 0),
    totalStories: stats.reduce((s, c) => s + c.stories, 0),
    totalActs:    stats.reduce((s, c) => s + c.activities, 0),
    targets:      TEAM_TARGETS,
  };
}

export function buildLeaderboard(submissions) {
  return buildCsmStats(submissions);
}

export function buildActivityBreakdown(submissions) {
  const real = submissions.filter(r => !r._pending);
  return ACTIVITIES.map(act => {
    const rows  = real.filter(r => r.activity === act.label);
    const count = act.perReview
      ? rows.reduce((s, r) => s + (Number(r.reviews) || 0), 0)
      : rows.length;
    const pts   = rows.reduce((s, r) => s + (Number(r.points) || 0), 0);
    return { ...act, count, pts };
  });
}

export function buildCategoryBreakdown(submissions) {
  const actBreak = buildActivityBreakdown(submissions);
  return ACTIVITY_CATEGORIES.map(cat => {
    const acts = actBreak.filter(a => a.category === cat);
    return { category: cat, count: acts.reduce((s,a)=>s+a.count,0), pts: acts.reduce((s,a)=>s+a.pts,0), acts };
  });
}
