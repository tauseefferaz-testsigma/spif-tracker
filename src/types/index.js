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
];

// Activities with full metadata
// perReview: points multiply by count entered
// showCount: show "No. of Reviews" number input
// showContext: show the smart context field (URL, name, etc.)
// showCustomer: show Customer Name + Email fields
// contextLabel/contextPlaceholder: label and hint for the context field
export const ACTIVITIES = [
  {
    id:                 'g2_review',
    label:              'G2 Review',
    points:             2,
    perReview:          true,
    showCount:          true,
    countLabel:         'No. of Reviews',
    showCustomer:       true,
    showContext:        false,
    contextLabel:       null,
    contextPlaceholder: null,
    category:           'Primary',
  },
  {
    id:                 'gartner',
    label:              'Gartner Peer Insights Review',
    points:             3,
    perReview:          true,
    showCount:          true,
    countLabel:         'No. of Reviews',
    showCustomer:       true,
    showContext:        false,
    contextLabel:       null,
    contextPlaceholder: null,
    category:           'Primary',
  },
  {
    id:                 'reference_customer',
    label:              'Reference Customer',
    points:             3,
    perReview:          false,
    showCount:          false,
    countLabel:         null,
    showCustomer:       true,
    showContext:        false,
    contextLabel:       null,
    contextPlaceholder: null,
    category:           'Primary',
  },
  {
    id:                 'success_story',
    label:              'Success Story',
    points:             5,
    perReview:          false,
    showCount:          false,
    countLabel:         null,
    showCustomer:       true,
    showContext:        true,
    contextLabel:       'Story URL or Title',
    contextPlaceholder: 'e.g. acme.com/story or "Acme doubles revenue with..."',
    category:           'Primary',
  },
  {
    id:                 'webinar_speaker',
    label:              'Webinar Speaker',
    points:             3,
    perReview:          false,
    showCount:          false,
    countLabel:         null,
    showCustomer:       false,
    showContext:        true,
    contextLabel:       'Webinar Name',
    contextPlaceholder: 'e.g. SaaStr 2026',
    category:           'Recognition',
  },
  {
    id:                 'social_post',
    label:              'Customer Social Post',
    points:             2,
    perReview:          false,
    showCount:          false,
    countLabel:         null,
    showCustomer:       true,
    showContext:        true,
    contextLabel:       'Post URL',
    contextPlaceholder: 'e.g. linkedin.com/posts/xyz',
    category:           'Recognition',
  },
];

export const REVIEW_TARGET = 50; // team target — used for progress bars

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

export function isReviewActivity(activityLabel) {
  const a = getActivity(activityLabel);
  return a ? a.showCount : false;
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

export function validateSubmission(data) {
  const errors  = {};
  const activity = getActivity(data.activity);

  if (!data.csm || !CSMS.includes(data.csm)) {
    errors.csm = 'Select a valid CSM name.';
  }

  if (!activity) {
    errors.activity = 'Select a valid activity.';
  }

  if (activity?.showCount) {
    const n = parseInt(data.reviews, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      errors.reviews = 'Enter a number between 1 and 100.';
    }
  }

  if (activity?.showCustomer) {
    if (!data.customerName || String(data.customerName).trim().length < 2) {
      errors.customerName = 'Enter the customer name.';
    }
    if (!data.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
      errors.customerEmail = 'Enter a valid email address.';
    }
  }

  if (activity?.showContext) {
    if (!data.context || String(data.context).trim().length < 2) {
      errors.context = `Enter the ${activity.contextLabel?.toLowerCase() || 'required field'}.`;
    }
  }

  if (data.notes && String(data.notes).length > 500) {
    errors.notes = 'Notes must be under 500 characters.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── SANITIZATION ─────────────────────────────────────────────────────────────

export function sanitizeSubmission(raw) {
  const activity = getActivity(raw.activity);
  return {
    date:          raw.date || todayISO(),
    csm:           String(raw.csm || '').trim(),
    activity:      String(raw.activity || '').trim(),
    category:      activity?.category || '',
    reviews:       activity?.perReview ? Math.max(1, parseInt(raw.reviews, 10) || 1) : '',
    customerName:  activity?.showCustomer ? String(raw.customerName || '').trim() : '',
    customerEmail: activity?.showCustomer ? String(raw.customerEmail || '').trim().toLowerCase() : '',
    context:       activity?.showContext  ? String(raw.context || '').trim() : '',
    notes:         String(raw.notes || '').trim().slice(0, 500),
    points:        calcPoints(raw.activity, raw.reviews),
  };
}
