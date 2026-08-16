// ─── PROGRAM CONFIG ───────────────────────────────────────────────────────────
export const PROGRAM_START = "2026-05-18";
export const PROGRAM_WEEKS = 6;

export function currentWeekNumber() {
  const start  = new Date(PROGRAM_START);
  const now    = new Date();
  const diffMs = now - start;
  if (diffMs < 0) return 0;
  return Math.min(Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1, PROGRAM_WEEKS);
}

export function programProgress() {
  return currentWeekNumber() / PROGRAM_WEEKS;
}

// ─── QUARTERS ─────────────────────────────────────────────────────────────────
// QUARTERS lists every quarter/data-period the tracker supports. New quarters
// can be appended here without touching historical data — nothing is deleted
// or overwritten, each quarter is just a separate slice of the same sheet.
export const QUARTERS = ["Q2 2026", "Q3 2026"];

// New submissions are recorded against this quarter by default.
export const CURRENT_QUARTER = "Q3 2026";

// Any submission stored before the "Quarter" column existed (i.e. legacy rows
// with a blank quarter value) is historical Q2 2026 data — this is how we
// classify it without having to touch/rewrite those rows.
export const LEGACY_QUARTER = "Q2 2026";

export function isValidQuarter(value) {
  return QUARTERS.includes(value);
}

// Normalizes any incoming quarter value (blank/legacy/unrecognized) to a
// valid quarter, defaulting untagged historical rows to Q2 2026.
export function normalizeQuarter(value) {
  return isValidQuarter(value) ? value : LEGACY_QUARTER;
}

// ─── CSM ROSTER ───────────────────────────────────────────────────────────────
// name     = canonical display name — shown in dropdowns/leaderboards and used
//            for stats aggregation everywhere.
// aliases  = older raw values that may exist in the Sheet for this same person
//            (e.g. a username used before display names were standardized).
//            Historical rows stored under an alias are matched back to this
//            CSM so past totals/rankings are unaffected.
// quarters = which quarter(s) this CSM is part of. A CSM only shows up in the
//            dashboard/leaderboard/roster for the quarters listed here, but
//            their historical submissions are always preserved and remain
//            searchable in the submissions log regardless of this list.
// targets  = null means no target assigned.
export const CSMS = [
  { name: "Subhopriyo Sen",       track: "Enterprise, APAC",       targets: { reviews: 5, references: 1, stories: 1 }, quarters: ["Q2 2026"] },
  { name: "Rama Varma",           track: "Enterprise, Americas",   targets: { reviews: 5, references: 1, stories: 1 }, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Sakshi Bagri",         track: "Enterprise, India",      targets: { reviews: 5, references: 1, stories: 1 }, quarters: ["Q2 2026", "Q3 2026"], aliases: ["sakshi.bagri"] },
  { name: "Mohammed Tamiz Uddin", track: "Specialist, Americas",   targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Aravinda G",           track: "Specialist, Americas",   targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Arun S",               track: "Specialist, EMEA",       targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Varun Thakur",         track: "Specialist, EMEA",       targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Shabrish BM",          track: "Specialist, India/APAC", targets: { reviews: 7, references: 2, stories: 2 }, quarters: ["Q2 2026"] },
  { name: "Tauseef Feraz",        track: "—",                      targets: null, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Aarathy Sundaresan",   track: "—",                      targets: null, quarters: ["Q2 2026", "Q3 2026"] },
  { name: "Vanshika Adlakha",     track: "—",                      targets: null, quarters: ["Q3 2026"] },
  { name: "Yadhu Krishnan",       track: "—",                      targets: null, quarters: ["Q3 2026"] },
];

// All names ever used (active + former CSMs) — used for filters/search over
// historical data so past records always remain findable.
export const CSM_NAMES = CSMS.map(c => c.name);

// Names selectable when logging a *new* activity — only CSMs active in the
// current quarter's roster.
export const ACTIVE_CSM_NAMES = CSMS.filter(c => c.quarters.includes(CURRENT_QUARTER)).map(c => c.name);

export function getCsm(name) {
  return CSMS.find(c => c.name === name) || null;
}

// Resolves a raw CSM value from a submission (which may be an older alias)
// back to the canonical display name used across the app.
export function canonicalCsmName(rawName) {
  const name = String(rawName || "").trim();
  const direct = CSMS.find(c => c.name === name);
  if (direct) return direct.name;
  const viaAlias = CSMS.find(c => Array.isArray(c.aliases) && c.aliases.includes(name));
  return viaAlias ? viaAlias.name : name;
}

// CSM roster scoped to a given quarter (defaults to the current quarter).
export function csmsForQuarter(quarter = CURRENT_QUARTER) {
  return CSMS.filter(c => c.quarters.includes(quarter));
}

// Team-level targets (sum of CSMs with targets), scoped to a quarter so each
// quarter's roster/targets don't bleed into another quarter's totals.
export function getTeamTargets(quarter = CURRENT_QUARTER) {
  return csmsForQuarter(quarter).reduce(
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
}

// Backwards-compatible export (Q2 2026 team targets — unchanged from before).
export const TEAM_TARGETS = getTeamTargets("Q2 2026");

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────
export const ACTIVITIES = [
  { id: "g2",      label: "G2 Review",                    category: "Reviews",           points: 3,  perReview: true,  showCount: true,  countLabel: "No. of Reviews", showCustomer: true,  showUrl: true,  showContext: false, contextLabel: null,               contextPlaceholder: null },
  { id: "gartner", label: "Gartner Peer Insights Review", category: "Reviews",           points: 2,  perReview: true,  showCount: true,  countLabel: "No. of Reviews", showCustomer: true,  showUrl: true,  showContext: false, contextLabel: null,               contextPlaceholder: null },
  { id: "ref",     label: "Reference Customer",           category: "Customer Advocacy", points: 3,  perReview: false, showCount: false, countLabel: null,             showCustomer: true,  showUrl: true,  showContext: false, contextLabel: null,               contextPlaceholder: null },
  { id: "story",   label: "Success Story",                category: "Customer Advocacy", points: 5,  perReview: false, showCount: false, countLabel: null,             showCustomer: true,  showUrl: true,  showContext: true,  contextLabel: "Story URL or Title", contextPlaceholder: "e.g. acme.com/story" },
  { id: "webinar", label: "Webinar Speaker",              category: "Recognition",       points: 3,  perReview: false, showCount: false, countLabel: null,             showCustomer: false, showUrl: false, showContext: true,  contextLabel: "Webinar Name",       contextPlaceholder: "e.g. SaaStr 2026" },
  { id: "social",  label: "Customer Social Post",         category: "Recognition",       points: 2,  perReview: false, showCount: false, countLabel: null,             showCustomer: true,  showUrl: true,  showContext: true,  contextLabel: "Post URL",           contextPlaceholder: "e.g. linkedin.com/posts/xyz" },
];

export const ACTIVITY_CATEGORIES = ["Reviews", "Customer Advocacy", "Recognition"];

export function getActivity(label) {
  return ACTIVITIES.find(a => a.label === label) || null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s.]+\.[^\s]+$/i;

export function isValidUrl(value) {
  return URL_REGEX.test(String(value || "").trim());
}

export function parseEmailList(value) {
  return String(value || "")
    .split(/[\n,;]+/)
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function dedupeEmails(emails) {
  return [...new Set(emails)];
}

export function formatEmailList(value) {
  return dedupeEmails(parseEmailList(value)).join("\n");
}

export function getEmailValidationDetails(value) {
  const rawEmails = parseEmailList(value);
  const uniqueEmails = dedupeEmails(rawEmails);
  const invalidEmails = uniqueEmails.filter(email => !EMAIL_REGEX.test(email));
  return {
    rawEmails,
    uniqueEmails,
    invalidEmails,
    duplicateCount: rawEmails.length - uniqueEmails.length,
  };
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

  if (!data.csm || !CSM_NAMES.includes(data.csm))
    errors.csm = "Select a valid CSM name.";
  if (!activity)
    errors.activity = "Select a valid activity.";
  if (activity?.showCount) {
    const n = parseInt(data.reviews, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100)
      errors.reviews = "Enter a number between 1 and 100.";
  }
  if (activity?.showCustomer) {
    if (!data.customerName?.trim() || data.customerName.trim().length < 2)
      errors.customerName = "Enter the customer name.";
    const { rawEmails, uniqueEmails, invalidEmails, duplicateCount } = getEmailValidationDetails(data.customerEmail);
    if (rawEmails.length === 0) {
      errors.customerEmail = activity?.perReview
        ? "Enter one email per review."
        : "Enter at least one valid email address.";
    } else if (invalidEmails.length > 0) {
      errors.customerEmail = `Invalid email: ${invalidEmails[0]}`;
    } else if (duplicateCount > 0) {
      errors.customerEmail = "Remove duplicate email addresses.";
    } else if (activity?.perReview) {
      const reviewCount = Math.max(1, parseInt(data.reviews, 10) || 1);
      if (uniqueEmails.length !== reviewCount) {
        errors.customerEmail = `Add exactly ${reviewCount} unique email${reviewCount === 1 ? "" : "s"} for ${reviewCount} review${reviewCount === 1 ? "" : "s"}.`;
      }
    }
  }
  if (activity?.showUrl) {
    if (!data.url?.trim())
      errors.url = "Enter the approved/published link.";
    else if (!isValidUrl(data.url))
      errors.url = "Enter a valid link starting with http:// or https://";
  }
  if (activity?.showContext) {
    if (!data.context?.trim() || data.context.trim().length < 2)
      errors.context = `Enter the ${activity.contextLabel?.toLowerCase() || "required field"}.`;
  }
  if (data.notes && String(data.notes).length > 500)
    errors.notes = "Notes must be under 500 characters.";

  return { valid: Object.keys(errors).length === 0, errors };
}

export function sanitizeSubmission(raw) {
  const activity = getActivity(raw.activity);
  const normalizedEmails = formatEmailList(raw.customerEmail);
  return {
    date:          raw.date || todayISO(),
    csm:           String(raw.csm || "").trim(),
    activity:      String(raw.activity || "").trim(),
    category:      activity?.category || "",
    reviews:       activity?.perReview ? Math.max(1, parseInt(raw.reviews, 10) || 1) : "",
    customerName:  activity?.showCustomer ? String(raw.customerName || "").trim() : "",
    customerEmail: activity?.showCustomer ? normalizedEmails : "",
    context:       activity?.showContext  ? String(raw.context || "").trim() : "",
    url:           activity?.showUrl      ? String(raw.url || "").trim() : "",
    notes:         String(raw.notes || "").trim().slice(0, 500),
    points:        calcPoints(raw.activity, raw.reviews),
    // Preserve an existing (valid) quarter when editing a submission;
    // otherwise new submissions default to the current quarter.
    quarter:       isValidQuarter(raw.quarter) ? raw.quarter : CURRENT_QUARTER,
  };
}

// ─── PACE STATUS ──────────────────────────────────────────────────────────────
export function getPaceStatus(actual, target) {
  if (!target) return null;
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
