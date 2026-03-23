export function toGrade(score) {
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
  if (!grade) return '';
  const letter = grade[0];
  if (letter === 'A') return 'grade-color-A';
  if (letter === 'B') return 'grade-color-B';
  if (letter === 'C') return 'grade-color-C';
  if (letter === 'D') return 'grade-color-D';
  return 'grade-color-F';
}

export function gradeBgClass(grade) {
  if (!grade) return '';
  const letter = grade[0];
  if (letter === 'A') return 'grade-bg-A';
  if (letter === 'B') return 'grade-bg-B';
  if (letter === 'C') return 'grade-bg-C';
  if (letter === 'D') return 'grade-bg-D';
  return 'grade-bg-F';
}

export function gradeFill(grade) {
  if (!grade) return '#ccc';
  const letter = grade[0];
  const map = { A: '#1B5E20', B: '#388E3C', C: '#F57F17', D: '#E65100', F: '#B71C1C' };
  return map[letter] ?? '#ccc';
}

export function scoreFill(score) {
  return gradeFill(toGrade(score ?? 0));
}

export function overrunColor(pct) {
  if (pct <= 5)  return '#1B5E20';
  if (pct <= 15) return '#F57F17';
  return '#B71C1C';
}

export function delayColor(months) {
  if (months <= 3)  return '#1B5E20';
  if (months <= 12) return '#F57F17';
  return '#B71C1C';
}

export function outlookSymbol(outlook) {
  if (!outlook) return '–';
  const o = outlook.toLowerCase();
  if (o === 'positive') return '↑';
  if (o === 'negative') return '↓';
  return '–';
}

export function outlookLabel(outlook) {
  if (!outlook) return 'stable';
  return outlook.charAt(0).toUpperCase() + outlook.slice(1).toLowerCase();
}

export function formatDollars(n) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString('en-CA')}`;
}

export function formatDollarsShort(n) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString('en-CA')}`;
}

export const PROVINCE_COLORS = {
  BC: '#003366', AB: '#005B31', SK: '#CC0000', MB: '#083D77',
  ON: '#0057A8', QC: '#003C71', NB: '#B8860B', NS: '#002B7F',
  PE: '#CF0A2C', NL: '#003DA5',
};

export const CATEGORY_ICONS = {
  healthcare:     '🏥',
  housing:        '🏠',
  fiscal:         '💰',
  infrastructure: '🏗️',
  economy:        '📈',
  education:      '🎓',
};

export const CATEGORY_LABELS = {
  overall:        'Overall',
  healthcare:     'Healthcare',
  housing:        'Housing',
  fiscal:         'Fiscal',
  infrastructure: 'Infrastructure',
  economy:        'Economy',
  education:      'Education',
  value:          'Best Value',
};
