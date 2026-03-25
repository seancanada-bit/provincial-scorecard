// Shared grading utilities — mirrors provinces/src/utils/grading.js

export function toGrade(score) {
  if (score == null) return 'N/A';
  if (score >= 93) return 'A+';
  if (score >= 87) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 77) return 'B+';
  if (score >= 73) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 67) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 57) return 'C-';
  if (score >= 40) return 'D';
  return 'F';
}

export function gradeColorClass(grade) {
  if (!grade || grade === 'N/A') return 'grade-color-muted';
  const l = grade[0];
  if (l === 'A') return 'grade-color-A';
  if (l === 'B') return 'grade-color-B';
  if (l === 'C') return 'grade-color-C';
  if (l === 'D') return 'grade-color-D';
  return 'grade-color-F';
}

export function gradeBgClass(grade) {
  if (!grade || grade === 'N/A') return '';
  const l = grade[0];
  if (l === 'A') return 'grade-bg-A';
  if (l === 'B') return 'grade-bg-B';
  if (l === 'C') return 'grade-bg-C';
  if (l === 'D') return 'grade-bg-D';
  return 'grade-bg-F';
}

export function gradeFill(grade) {
  if (!grade || grade === 'N/A') return '#8C8C8C';
  const l = grade[0];
  const map = { A: '#1B5E20', B: '#2E7D32', C: '#B45309', D: '#C2410C', F: '#B71C1C' };
  return map[l] ?? '#8C8C8C';
}

export function scoreFill(score) {
  return gradeFill(toGrade(score ?? 0));
}

// Accessible grade colours on dark backgrounds
export function gradeFillDark(grade) {
  if (!grade || grade === 'N/A') return '#aaa';
  const l = grade[0];
  const map = { A: '#6EE7B7', B: '#86EFAC', C: '#FCD34D', D: '#FB923C', F: '#FCA5A5' };
  return map[l] ?? '#aaa';
}

export const CATEGORY_ICONS = {
  housing:     '🏠',
  safety:      '🛡️',
  fiscal:      '💰',
  liveability: '🌳',
  economic:    '📈',
  community:   '🤝',
};

export const CATEGORY_LABELS = {
  housing:     'Housing & Affordability',
  safety:      'Safety',
  fiscal:      'Fiscal Management',
  liveability: 'Liveability',
  economic:    'Economic Vitality',
  community:   'Community Investment',
};

export const PROVINCE_NAMES = {
  BC:  'British Columbia',
  AB:  'Alberta',
  SK:  'Saskatchewan',
  MB:  'Manitoba',
  ON:  'Ontario',
  QC:  'Quebec',
  NB:  'New Brunswick',
  NS:  'Nova Scotia',
  PE:  'Prince Edward Island',
  NL:  'Newfoundland & Labrador',
};

export const PROVINCE_COLORS = {
  BC:  '#003366',
  AB:  '#005B31',
  SK:  '#CC0000',
  MB:  '#083D77',
  ON:  '#0057A8',
  QC:  '#003C71',
  NB:  '#B8860B',
  NS:  '#002B7F',
  PE:  '#CF0A2C',
  NL:  '#003DA5',
};
