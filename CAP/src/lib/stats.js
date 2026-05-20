import { CSM_TARGETS, ACTIVITY_TYPES } from '../types/index.js';

export function buildTeamSummary(submissions) {
  const totals = {
    totalPts: 0,
    totalReviews: 0,
    totalRefs: 0,
    totalStories: 0,
    totalActs: submissions.length,
  };

  submissions.forEach(sub => {
    totals.totalPts += sub.points || 0;
    const activity = ACTIVITY_TYPES.find(a => a.id === sub.activityType);
    if (activity) {
      if (activity.category === 'Reviews') totals.totalReviews++;
      if (activity.id === 'reference_call') totals.totalRefs++;
      if (activity.id === 'case_study' || activity.id === 'video_testimonial') totals.totalStories++;
    }
  });

  const allTargets = Object.values(CSM_TARGETS);
  totals.targets = {
    reviews: allTargets.reduce((sum, t) => sum + t.reviews, 0),
    references: allTargets.reduce((sum, t) => sum + t.references, 0),
    stories: allTargets.reduce((sum, t) => sum + t.stories, 0),
  };

  return totals;
}

export function buildCsmStats(submissions) {
  const csmMap = {};

  Object.keys(CSM_TARGETS).forEach(name => {
    csmMap[name] = {
      name,
      pts: 0,
      reviews: 0,
      references: 0,
      stories: 0,
      targets: CSM_TARGETS[name],
      track: name.includes('Tamiz') || name.includes('Aravinda') || name.includes('Subho') || name.includes('sakshi') ? 'Enterprise' : 'Mid-Market',
    };
  });

  submissions.forEach(sub => {
    const csm = csmMap[sub.csmName];
    if (!csm) return;

    csm.pts += sub.points || 0;

    const activity = ACTIVITY_TYPES.find(a => a.id === sub.activityType);
    if (activity) {
      if (activity.category === 'Reviews') csm.reviews++;
      if (activity.id === 'reference_call') csm.references++;
      if (activity.id === 'case_study' || activity.id === 'video_testimonial') csm.stories++;
    }
  });

  return Object.values(csmMap).sort((a, b) => b.pts - a.pts);
}

export function buildActivityBreakdown(submissions) {
  const breakdown = ACTIVITY_TYPES.map(type => ({
    ...type,
    count: 0,
    pts: 0,
  }));

  submissions.forEach(sub => {
    const activity = breakdown.find(a => a.id === sub.activityType);
    if (activity) {
      activity.count++;
      activity.pts += sub.points || 0;
    }
  });

  return breakdown.filter(a => a.count > 0);
}
