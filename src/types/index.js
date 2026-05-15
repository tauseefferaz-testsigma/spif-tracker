// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const CSMS = [
  'Aarathy Sundaresan',
  'Aravinda G',
  'Arun S',
  'Mohammed Tamiz Uddin',
  'Rama Varma',
  'sakshi.bagri',
  'Shabrish BM',
  'Subhopriyo Sen',
  'Tauseef Feraz',
  'Varun Thakur',
  'Vig',
];

export const TIERS = ['SMB', 'Enterprise'];

export const ACTIVITIES = [
  { id: 'g2_smb',        label: 'G2 Review — SMB',        points: 10, perReview: true  },
  { id: 'g2_enterprise', label: 'G2 Review — Enterprise', points: 20, perReview: true  },
  { id: 'case_study',    label: 'Case Study',              points: 20, perReview: false },
  { id: 'gpi',           label: 'GPI',                     points: 15, perReview: false },
];

export const PAYOUT_THRESHOLD = 50;
export const CERT_THRESHOLD   = 200;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getActivity(label) {
  return ACTIVITIES.find(a => a.label === label) || null;
}

export function calcPoints(activityLabel, reviewCount) {
  const activity = getActivity(activityLabel);
  if (!activity) return 0;
  if (!activity.perReview) return activity.points;
  const n = Math.max(1, parseInt(reviewCount, 10) || 1);
  return activity.points * n;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toISOString().split('T')[0];
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

export function validateSubmission(data) {
  const errors = {};

  if (!data.csm || !CSMS.includes(data.csm)) {
    errors.csm = 'Select a valid CSM name.';
  }

  if (!data.tier || !TIERS.includes(data.tier)) {
    errors.tier = 'Select a valid tier.';
  }

  const activity = getActivity(data.activity);
  if (!activity) {
    errors.activity = 'Select a valid activity.';
  }

  if (activity?.perReview) {
    const n = parseInt(data.reviews, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      errors.reviews = 'Enter a number between 1 and 100.';
    }
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must be under 500 characters.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── SANITIZATION ─────────────────────────────────────────────────────────────

export function sanitizeSubmission(raw) {
  const activity = getActivity(raw.activity);
  return {
    date:     raw.date || todayISO(),
    csm:      String(raw.csm || '').trim(),
    tier:     String(raw.tier || '').trim(),
    activity: String(raw.activity || '').trim(),
    reviews:  activity?.perReview ? Math.max(1, parseInt(raw.reviews, 10) || 1) : '',
    notes:    String(raw.notes || '').trim().slice(0, 500),
    points:   calcPoints(raw.activity, raw.reviews),
  };
}

// ─── STATUS LOGIC ─────────────────────────────────────────────────────────────

export function getPayoutStatus(points) {
  if (points >= CERT_THRESHOLD)   return { label: 'Certified 🏆', color: 'purple' };
  if (points >= PAYOUT_THRESHOLD) return { label: 'Payout unlocked ✅', color: 'green' };
  if (points > 0)                 return { label: `${PAYOUT_THRESHOLD - points} pts to payout`, color: 'amber' };
  return { label: 'No activity', color: 'gray' };
}
