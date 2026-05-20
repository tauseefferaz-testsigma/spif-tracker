// Program Configuration
export const PROGRAM_START = new Date('2026-05-18');
export const PROGRAM_WEEKS = 6;

// CSM Targets for Q2
export const CSM_TARGETS = {
  'Mohammed Tamiz Uddin': { reviews: 2, references: 3, stories: 1 },
  'Aravinda G': { reviews: 2, references: 3, stories: 1 },
  'Subhopriyo Sen': { reviews: 2, references: 3, stories: 1 },
  'sakshi.bagri': { reviews: 2, references: 3, stories: 1 },
  'Rama Varma': { reviews: 1, references: 2, stories: 1 },
  'Arun S': { reviews: 1, references: 2, stories: 1 },
  'Varun Thakur': { reviews: 1, references: 2, stories: 1 },
  'Shabrish BM': { reviews: 1, references: 2, stories: 1 },
  'Tauseef Feraz': { reviews: 1, references: 2, stories: 1 },
  'Aarathy Sundaresan': { reviews: 1, references: 2, stories: 1 },
};

// Activity Types and Points
export const ACTIVITY_TYPES = [
  { id: 'g2_review', label: 'G2 Review', category: 'Reviews', points: 5 },
  { id: 'gartner_review', label: 'Gartner Peer Insights Review', category: 'Reviews', points: 5 },
  { id: 'reference_call', label: 'Reference Call', category: 'Customer Advocacy', points: 3 },
  { id: 'case_study', label: 'Case Study', category: 'Customer Advocacy', points: 10 },
  { id: 'video_testimonial', label: 'Video Testimonial', category: 'Customer Advocacy', points: 8 },
];

// Pace Status
export const PACE_LABELS = {
  ahead: { label: 'Ahead', color: '065f46', bg: 'dcfce7' },
  on_track: { label: 'On Track', color: '78350f', bg: 'fef3c7' },
  behind: { label: 'Behind', color: '7f1d1d', bg: 'fee2e2' },
};

// Helper Functions
export function currentWeekNumber() {
  const now = new Date();
  const diffMs = now - PROGRAM_START;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.min(PROGRAM_WEEKS, Math.max(1, Math.ceil((diffDays + 1) / 7)));
}

export function programProgress() {
  const now = new Date();
  const totalMs = PROGRAM_WEEKS * 7 * 24 * 60 * 60 * 1000;
  const elapsedMs = now - PROGRAM_START;
  return Math.min(1, Math.max(0, elapsedMs / totalMs));
}

export function getPaceStatus(actual, target) {
  const week = currentWeekNumber();
  const expectedProgress = week / PROGRAM_WEEKS;
  const actualProgress = target > 0 ? actual / target : 0;
  
  if (actualProgress >= expectedProgress * 1.1) return 'ahead';
  if (actualProgress >= expectedProgress * 0.9) return 'on_track';
  return 'behind';
}
