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
  if (!grade || grade === 'N/A') return 'grade--muted';
  if (grade.startsWith('A')) return 'grade--a';
  if (grade.startsWith('B')) return 'grade--b';
  if (grade.startsWith('C')) return 'grade--c';
  return 'grade--f';
}

export function gradeFill(grade) {
  if (!grade || grade === 'N/A') return 'var(--text-muted)';
  if (grade.startsWith('A')) return 'var(--grade-a)';
  if (grade.startsWith('B')) return 'var(--grade-b)';
  if (grade.startsWith('C')) return 'var(--grade-c)';
  return 'var(--grade-f)';
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
