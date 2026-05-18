// ─── PROGRAM CONFIG ───────────────────────────────────────────────────────────
export const PROGRAM_START = "2026-05-01"; // change this to shift the sprint
export const PROGRAM_WEEKS = 5;

export function currentWeekNumber() {
  const start = new Date(PROGRAM_START);
  const now   = new Date();
  const diffMs = now - start;
  if (diffMs < 0) return 0;
  const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(week, PROGRAM_WEEKS);
}

export function programProgress() {
  const week = currentWeekNumber();
  return week / PROGRAM_WEEKS; // 0.0 → 1.0
}

// ─── CSM ROSTER ───────────────────────────────────────────────────────────────
// displayName = used in dropdown + leaderboard
// fullName    = stored in Google Sheet
// targets     = null means no target assigned (Tauseef, Aarathy)
export const CSMS = [
  {
    displayName: "Subho",
    fullName:    "Subhopriyo Sen",
    track:       "Enterprise, APAC",
    targets:     { reviews: 5, references: 1, stories: 1 },
  },
  {
    displayName: "Sakshi",
    fullName:    "sakshi.bagri",
    track:       "Enterprise, India",
    targets:     { reviews: 5, references: 1, stories: 1 },
  },
  {
    displayName: "Ram",
    fullName:    "Rama Varma",
    track:       "Enterprise, Americas",
    targets:     { reviews: 5, references: 1, stories: 1 },
  },
  {
    displayName: "Tamiz",
    fullName:    "Mohammed Tamiz Uddin",
    track:       "Specialist, Americas",
    targets:     { reviews: 7, references: 2, stories: 2 },
  },
  {
    displayName: "Aravinda",
    fullName:    "Aravinda G",
    track:       "Specialist, Americas",
    targets:     { reviews: 7, references: 2, stories: 2 },
  },
  {
    displayName: "Arun",
    fullName:    "Arun S",
    track:       "Specialist, EMEA",
    targets:     { reviews: 7, references: 2, stories: 2 },
  },
  {
    displayName: "Varun",
    fullName:    "Varun Thakur",
    track:       "Specialist, EMEA",
    targets:     { reviews: 7, references: 2, stories: 2 },
  },
  {
    displayName: "Shabrish",
    fullName:    "Shabrish BM",
    track:       "Specialist, India/APAC",
    targets:     { reviews: 7, references: 2, stories: 2 },
  },
  {
    displayName: "Tauseef",
    fullName:    "Tauseef Feraz",
    track:       "—",
    targets:     null,
  },
  {
    displayName: "Aarathy",
    fullName:    "Aarathy Sundaresan",
    track:       "—",
    targets:     null,
  },
];

export const CSM_DISPLAY_NAMES = CSMS.map(c => c.displayName);
export const CSM_FULL_NAMES    = CSMS.map(c => c.fullName);

export function getCsmByDisplay(displayName) {
  return CSMS.find(c => c.displayName === displayName) || null;
}
export function getCsmByFull(fullName) {
  return CSMS.find(c => c.fullName === fullName) || null;
}

// Team-level targets (sum of all CSMs with targets)
export const TEAM_TARGETS = CSMS.reduce(
  (acc, csm) => {
    if (csm.targets) {
      acc.reviews    += csm.targets.reviews;
      acc.references += csm.targets.references;
      acc.stories    += csm.targets.stories;
    }
    return acc;
  },
  { reviews: 0, references: 0, stories: 0 }
);

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────
export const ACTIVITIES = [
  // Reviews
  { id: "g2",       label: "G2 Review",                      category: "Reviews",           points: 2,  perReview: true,  showCount: true,  countLabel: "No. of Reviews", showCustomer: true,  showContext: false, contextLabel: null,               contextPlaceholder: null },
  { id: "gartner",  label: "Gartner Peer Insights Review",   category: "Reviews",           points: 3,  perReview: true,  showCount: true,  countLabel: "No. of Reviews", showCustomer: true,  showContext: false, contextLabel: null,               contextPlaceholder: null },
  // Customer Advocacy
  { id: "ref",      label: "Reference Customer",             category: "Customer Advocacy", points: 3,  perReview: false, showCount: false, countLabel: null,             showCustomer: true,  showContext: false, contextLabel: null,               contextPlaceholder: null },
  { id: "story",    label: "Success Story",                  category: "Customer Advocacy", points: 5,  perReview: false, showCount: false, countLabel: null,             showCustomer: true,  showContext: true,  contextLabel: "Story URL or Title", contextPlaceholder: "e.g. acme.com/story" },
  // Recognition
  { id: "webinar",  label: "Webinar Speaker",                category: "Recognition",       points: 3,  perReview: false, showCount: false, countLabel: null,             showCustomer: false, showContext: true,  contextLabel: "Webinar Name",       contextPlaceholder: "e.g. SaaStr 2026" },
  { id: "social",   label: "Customer Social Post",           category: "Recognition",       points: 2,  perReview: false, showCount: false, countLabel: null,             showCustomer: true,  showContext: true,  contextLabel: "Post URL",           contextPlaceholder: "e.g. linkedin.com/posts/xyz" },
];

export const ACTIVITY_CATEGORIES = ["Reviews", "Customer Advocacy", "Recognition"];

export function getActivity(label) {
  return ACTIVITIES.find(a => a.label === label) || null;
}

export function calcPoints(activityLabel, reviewCount) {
  const a = getActivity(activityLabel);
  if (!a) return 0;
  if (!a.perReview) return a.points;
  return a.points * Math.max(1, parseInt(reviewCount, 10) || 1);
}

export function formatDate(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toISOString().split("T")[0];
}

export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────
export function validateSubmission(data) {
  const errors   = {};
  const activity = getActivity(data.activity);

  if (!data.csm || !CSM_DISPLAY_NAMES.includes(data.csm)) {
    errors.csm = "Select a valid CSM name.";
  }
  if (!activity) {
    errors.activity = "Select a valid activity.";
  }
  if (activity?.showCount) {
    const n = parseInt(data.reviews, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100) errors.reviews = "Enter a number between 1 and 100.";
  }
  if (activity?.showCustomer) {
    if (!data.customerName?.trim() || data.customerName.trim().length < 2)
      errors.customerName = "Enter the customer name.";
    if (!data.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail))
      errors.customerEmail = "Enter a valid email address.";
  }
  if (activity?.showContext) {
    if (!data.context?.trim() || data.context.trim().length < 2)
      errors.context = `Enter the ${activity.contextLabel?.toLowerCase() || "required field"}.`;
  }
  if (data.notes && String(data.notes).length > 500) {
    errors.notes = "Notes must be under 500 characters.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function sanitizeSubmission(raw) {
  const activity = getActivity(raw.activity);
  // store fullName in Sheet, displayName in UI
  const csm = getCsmByDisplay(raw.csm);
  return {
    date:          raw.date || todayISO(),
    csm:           csm?.fullName || raw.csm,
    displayName:   csm?.displayName || raw.csm,
    activity:      String(raw.activity || "").trim(),
    category:      activity?.category || "",
    reviews:       activity?.perReview ? Math.max(1, parseInt(raw.reviews, 10) || 1) : "",
    customerName:  activity?.showCustomer ? String(raw.customerName || "").trim() : "",
    customerEmail: activity?.showCustomer ? String(raw.customerEmail || "").trim().toLowerCase() : "",
    context:       activity?.showContext  ? String(raw.context || "").trim() : "",
    notes:         String(raw.notes || "").trim().slice(0, 500),
    points:        calcPoints(raw.activity, raw.reviews),
  };
}

// ─── PACE STATUS ──────────────────────────────────────────────────────────────
export function getPaceStatus(actual, target) {
  if (!target || target === 0) return null; // no target assigned
  const expected = programProgress() * target;
  if (expected === 0) return "on_track";
  const ratio = actual / expected;
  if (ratio >= 1.1)  return "ahead";
  if (ratio >= 0.85) return "on_track";
  return "behind";
}

export const PACE_LABELS = {
  ahead:    { label: "Ahead",    color: "059669", bg: "d1fae5" },
  on_track: { label: "On Track", color: "2563eb", bg: "dbeafe" },
  behind:   { label: "Behind",   color: "dc2626", bg: "fee2e2" },
};
