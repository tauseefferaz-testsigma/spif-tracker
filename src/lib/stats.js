import {
  CSMS, ACTIVITIES, ACTIVITY_CATEGORIES, TEAM_TARGETS,
  getPaceStatus, getCsmByFull, getCsmByDisplay,
} from "../types/index.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function isReviewActivity(actLabel) {
  const a = ACTIVITIES.find(x => x.label === actLabel);
  return a?.category === "Reviews";
}
function isReferenceActivity(actLabel) {
  return actLabel === "Reference Customer";
}
function isStoryActivity(actLabel) {
  return actLabel === "Success Story";
}

// ─── PER-CSM STATS ───────────────────────────────────────────────────────────
export function buildCsmStats(submissions) {
  const real = submissions.filter(r => !r._pending);

  // initialise map by display name
  const map = {};
  CSMS.forEach(csm => {
    map[csm.displayName] = {
      displayName: csm.displayName,
      fullName:    csm.fullName,
      track:       csm.track,
      targets:     csm.targets,
      pts:         0,
      reviews:     0,
      references:  0,
      stories:     0,
      activities:  0,
    };
  });

  for (const row of real) {
    // match by fullName OR displayName (handles both storage formats)
    const csm = getCsmByFull(row.csm) || getCsmByDisplay(row.csm);
    if (!csm) continue;
    const d = map[csm.displayName];
    if (!d) continue;

    d.pts        += Number(row.points) || 0;
    d.activities += 1;

    if (isReviewActivity(row.activity)) {
      d.reviews += Number(row.reviews) || 0;
    } else if (isReferenceActivity(row.activity)) {
      d.references += 1;
    } else if (isStoryActivity(row.activity)) {
      d.stories += 1;
    }
  }

  return Object.values(map).sort((a, b) => b.pts - a.pts);
}

// ─── TEAM SUMMARY ─────────────────────────────────────────────────────────────
export function buildTeamSummary(submissions) {
  const stats = buildCsmStats(submissions);
  const totalPts       = stats.reduce((s, c) => s + c.pts, 0);
  const totalReviews   = stats.reduce((s, c) => s + c.reviews, 0);
  const totalRefs      = stats.reduce((s, c) => s + c.references, 0);
  const totalStories   = stats.reduce((s, c) => s + c.stories, 0);
  const totalActs      = stats.reduce((s, c) => s + c.activities, 0);

  return {
    totalPts, totalReviews, totalRefs, totalStories, totalActs,
    targets: TEAM_TARGETS,
  };
}

// ─── CATEGORY BREAKDOWN ──────────────────────────────────────────────────────
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
    return {
      category: cat,
      count:    acts.reduce((s, a) => s + a.count, 0),
      pts:      acts.reduce((s, a) => s + a.pts, 0),
      acts,
    };
  });
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
export function buildLeaderboard(submissions) {
  return buildCsmStats(submissions); // already sorted by pts desc
}
