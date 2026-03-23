/**
 * enrich-data.js
 * Adds education + taxes blocks to fallback.json, recalculates composites + grades,
 * adds valueScore. Run with: node scripts/enrich-data.js
 */

const fs   = require('fs');
const path = require('path');

const FALLBACK_IN  = path.join(__dirname, '../frontend/src/data/fallback.json');
const FALLBACK_OUT = path.join(__dirname, '../frontend/src/data/fallback.json');
const CACHE_OUT    = path.join(__dirname, '../backend/data/fallback-cache.json');

// ─── Education data ───────────────────────────────────────────────────────────
const EDUCATION = {
  BC: { score:60, grade:'C',  pcapMathScore:504, pcapReadingScore:506, perPupilSpending:12700, studentTeacherRatio:17.5, avgUniversityTuition:5974,  tuitionScore:58, pcapScore:65, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  AB: { score:55, grade:'C-', pcapMathScore:503, pcapReadingScore:505, perPupilSpending:14200, studentTeacherRatio:16.8, avgUniversityTuition:7280,  tuitionScore:39, pcapScore:64, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  SK: { score:46, grade:'D',  pcapMathScore:483, pcapReadingScore:490, perPupilSpending:12900, studentTeacherRatio:17.2, avgUniversityTuition:6793,  tuitionScore:46, pcapScore:47, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  MB: { score:49, grade:'D',  pcapMathScore:473, pcapReadingScore:481, perPupilSpending:13200, studentTeacherRatio:16.5, avgUniversityTuition:4850,  tuitionScore:74, pcapScore:37, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  ON: { score:42, grade:'D',  pcapMathScore:494, pcapReadingScore:501, perPupilSpending:12400, studentTeacherRatio:18.2, avgUniversityTuition:9070,  tuitionScore:13, pcapScore:58, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  QC: { score:87, grade:'A',  pcapMathScore:531, pcapReadingScore:521, perPupilSpending:13400, studentTeacherRatio:15.8, avgUniversityTuition:3013,  tuitionScore:100,pcapScore:86, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  NB: { score:43, grade:'D',  pcapMathScore:475, pcapReadingScore:485, perPupilSpending:13100, studentTeacherRatio:14.2, avgUniversityTuition:7242,  tuitionScore:39, pcapScore:40, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  NS: { score:35, grade:'D',  pcapMathScore:472, pcapReadingScore:478, perPupilSpending:14000, studentTeacherRatio:14.8, avgUniversityTuition:8391,  tuitionScore:23, pcapScore:35, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  PE: { score:36, grade:'D',  pcapMathScore:464, pcapReadingScore:470, perPupilSpending:13600, studentTeacherRatio:14.1, avgUniversityTuition:7210,  tuitionScore:40, pcapScore:27, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
  NL: { score:48, grade:'D',  pcapMathScore:460, pcapReadingScore:466, perPupilSpending:17200, studentTeacherRatio:13.5, avgUniversityTuition:3872,  tuitionScore:88, pcapScore:23, sourceNotes:'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO' },
};

// ─── Taxes data ───────────────────────────────────────────────────────────────
const TAXES = {
  BC: { salesTaxPct:7,     hasHst:false, incomeEffectiveRatePct:9.8,  taxBurdenIndex:94,  childcareMonthlyAvg:897,  legislatureCostPerCapita:17,  publicSectorPer1000:73,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  AB: { salesTaxPct:0,     hasHst:false, incomeEffectiveRatePct:9.2,  taxBurdenIndex:70,  childcareMonthlyAvg:1242, legislatureCostPerCapita:24,  publicSectorPer1000:72,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  SK: { salesTaxPct:6,     hasHst:false, incomeEffectiveRatePct:11.5, taxBurdenIndex:85,  childcareMonthlyAvg:912,  legislatureCostPerCapita:43,  publicSectorPer1000:82,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  MB: { salesTaxPct:7,     hasHst:false, incomeEffectiveRatePct:13.5, taxBurdenIndex:92,  childcareMonthlyAvg:584,  legislatureCostPerCapita:35,  publicSectorPer1000:90,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  ON: { salesTaxPct:8,     hasHst:true,  incomeEffectiveRatePct:9.2,  taxBurdenIndex:97,  childcareMonthlyAvg:1456, legislatureCostPerCapita:9,   publicSectorPer1000:68,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  QC: { salesTaxPct:9.975, hasHst:false, incomeEffectiveRatePct:17.8, taxBurdenIndex:128, childcareMonthlyAvg:196,  legislatureCostPerCapita:22,  publicSectorPer1000:88,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  NB: { salesTaxPct:10,    hasHst:true,  incomeEffectiveRatePct:13.2, taxBurdenIndex:100, childcareMonthlyAvg:619,  legislatureCostPerCapita:54,  publicSectorPer1000:89,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  NS: { salesTaxPct:10,    hasHst:true,  incomeEffectiveRatePct:16.0, taxBurdenIndex:113, childcareMonthlyAvg:631,  legislatureCostPerCapita:62,  publicSectorPer1000:94,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  PE: { salesTaxPct:10,    hasHst:true,  incomeEffectiveRatePct:15.6, taxBurdenIndex:109, childcareMonthlyAvg:398,  legislatureCostPerCapita:120, publicSectorPer1000:98,  sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
  NL: { salesTaxPct:10,    hasHst:true,  incomeEffectiveRatePct:15.5, taxBurdenIndex:110, childcareMonthlyAvg:598,  legislatureCostPerCapita:107, publicSectorPer1000:104, sourceNotes:'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01' },
};

function toGrade(score) {
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

const data = JSON.parse(fs.readFileSync(FALLBACK_IN, 'utf8'));

for (const prov of data.provinces) {
  const code = prov.code;
  const edu  = EDUCATION[code];
  const tax  = TAXES[code];

  if (!edu || !tax) { console.warn(`No data for ${code}`); continue; }

  // Attach new categories
  prov.categories.education = edu;
  prov.taxes = tax;

  // Recalculate composite with new weights
  const { healthcare, housing, fiscal, infrastructure, economy } = prov.categories;
  const newComposite = Math.round(
    healthcare.score    * 0.22 +
    housing.score       * 0.17 +
    fiscal.score        * 0.17 +
    infrastructure.score* 0.12 +
    economy.score       * 0.17 +
    edu.score           * 0.15
  );
  prov.composite  = newComposite;
  prov.grade      = toGrade(newComposite);
  prov.valueScore = Math.round(newComposite * 100 / tax.taxBurdenIndex);
}

// Recalculate national summary
const avg = arr => Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
const p = data.provinces;
const sorted = [...p].sort((a,b)=>b.composite-a.composite);

data.national.avgComposite      = avg(p.map(x=>x.composite));
data.national.avgHealthcare     = avg(p.map(x=>x.categories.healthcare.score));
data.national.avgHousing        = avg(p.map(x=>x.categories.housing.score));
data.national.avgFiscal         = avg(p.map(x=>x.categories.fiscal.score));
data.national.avgInfrastructure = avg(p.map(x=>x.categories.infrastructure.score));
data.national.avgEconomy        = avg(p.map(x=>x.categories.economy.score));
data.national.avgEducation      = avg(p.map(x=>x.categories.education.score));
data.national.avgValue          = avg(p.map(x=>x.valueScore));
data.national.topProvince       = sorted[0].code;
data.national.bottomProvince    = sorted[sorted.length-1].code;
data.lastUpdated = new Date().toISOString();

const out = JSON.stringify(data, null, 2);
fs.writeFileSync(FALLBACK_OUT, out);
fs.writeFileSync(CACHE_OUT, out);

console.log('\n✓ Written to fallback.json and fallback-cache.json\n');
console.log('Province results:');
console.log('Code  Composite  Grade   ValueScore  EduScore');
console.log('─────────────────────────────────────────────');
for (const prov of sorted) {
  const line = `${prov.code.padEnd(4)}  ${String(prov.composite).padEnd(9)}  ${prov.grade.padEnd(6)}  ${String(prov.valueScore).padEnd(10)}  ${prov.categories.education.score}`;
  console.log(line);
}
