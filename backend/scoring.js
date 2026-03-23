/**
 * Provincial Scorecard - Scoring Engine (Node/backend version)
 * Pure functions: input raw merged dataset, output fully scored province objects.
 * Identical logic to frontend/src/utils/scoring.js
 */

const BOUNDS = {
  surgicalWait:        { best: 19,    worst: 61    }, // weeks (lower = better)
  primaryCareAttach:   { best: 100,   worst: 70    }, // % (higher = better)
  erBenchmark:         { best: 90,    worst: 50    }, // % (higher = better)
  housingStartsPer1k:  { best: 300,   worst: 50    }, // per 1k pop growth (higher = better)
  homePriceYoy:        { best: -2,    worst: 15    }, // % (lower = better)
  rentInflation:       { best: 0,     worst: 10    }, // % (lower = better)
  budgetBalancePctGdp: { best: 1.5,   worst: -5    }, // % GDP (higher = better)
  debtInterestCents:   { best: 4,     worst: 15    }, // cents per $ (lower = better)
  netDebtPerCapita:    { best: 5000,  worst: 40000 }, // $ (lower = better)
  creditNumeric:       { best: 20,    worst: 1     }, // (higher = better)
  premierNetApproval:  { best: 40,    worst: -40   }, // % net (higher = better)
  unemploymentDelta:   { best: -3,    worst: 3     }, // vs national (lower = better)
  gdpGrowthDelta:      { best: 3,     worst: -3    }, // vs national (higher = better)
  infraOverrunPct:     { best: 0,     worst: 100   }, // % (lower = better)
  infraDelayMonths:    { best: 0,     worst: 36    }, // months (lower = better)
  // Education
  pcapScore:           { best: 540,   worst: 440   }, // PCAP score (higher = better)
  tuition:             { best: 3000,  worst: 10000 }, // $ annual (lower = better)
  studentTeacherRatio: { best: 12,    worst: 21    }, // (lower = better)
  // Tax burden
  taxBurdenIndex:      { best: 65,    worst: 135   }, // 100 = national avg (lower = better)
  // Safety — survey-based, not police-reported (avoids reporting-bias)
  victimizationRate:   { best: 55,    worst: 175   }, // GSS per 1,000 (lower = better)
  homicideRate:        { best: 0.3,   worst: 6.5   }, // per 100k (lower = better)
  // Cost of living / purchasing power (lower cost = better score)
  rentToIncomePct:     { best: 12,    worst: 30    }, // % of income on rent (lower = better)
  groceryIndex:        { best: 94,    worst: 116   }, // relative index, 100 = national avg
  annualEnergyCost:    { best: 1400,  worst: 4200  }, // $ per household/yr (lower = better)
  autoInsuranceAnnual: { best: 600,   worst: 2100  }, // $ per year (lower = better)
  childcareMonthly:    { best: 150,   worst: 1500  }, // $ per month (lower = better)
};

function normalize(value, best, worst) {
  if (value === null || value === undefined) return null;
  const clamped = Math.max(Math.min(value, Math.max(best, worst)), Math.min(best, worst));
  if (best === worst) return 100;
  return Math.round(((clamped - worst) / (best - worst)) * 100);
}

function normalizeInverted(value, best, worst) {
  // For metrics where lower value = better score
  return normalize(value, worst, best);
}

function avg(...values) {
  const valid = values.filter(v => v !== null && v !== undefined);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

const CREDIT_MAP = {
  'Aaa': 20, 'AAA': 20,
  'Aa1': 19, 'AA+': 19,
  'Aa2': 18, 'AA':  18,
  'Aa3': 17, 'AA-': 17,
  'A1':  16, 'A+':  16,
  'A2':  15, 'A':   15,
  'A3':  14, 'A-':  14,
  'Baa1': 13, 'BBB+': 13,
  'Baa2': 12, 'BBB':  12,
  'Baa3': 11, 'BBB-': 11,
};

const OUTLOOK_MULT = { 'positive': 1.05, 'stable': 1.0, 'negative': 0.95 };

function creditToNumeric(rating, outlook) {
  const base = CREDIT_MAP[rating] ?? null;
  if (base === null) return null;
  const mult = OUTLOOK_MULT[(outlook || 'stable').toLowerCase()] ?? 1.0;
  return base * mult;
}

function scoreCredit(creditRow) {
  if (!creditRow) return null;
  const ratings = [
    creditToNumeric(creditRow.moodys_rating, creditRow.moodys_outlook),
    creditToNumeric(creditRow.dbrs_rating,   creditRow.dbrs_outlook),
    creditToNumeric(creditRow.sp_rating,     creditRow.sp_outlook),
    creditToNumeric(creditRow.fitch_rating,  creditRow.fitch_outlook),
  ].filter(v => v !== null);
  if (!ratings.length) return null;
  const avgNumeric = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return normalize(avgNumeric, BOUNDS.creditNumeric.best, BOUNDS.creditNumeric.worst);
}

function scoreAgOpinion(opinion) {
  if (!opinion) return null;
  const map = { 'clean': 100, 'qualified': 50, 'adverse': 0 };
  return map[(opinion || '').toLowerCase()] ?? null;
}

function scoreInfraProjects(projects) {
  if (!projects || !projects.length) return { score: null, avgOverrunPct: null, avgDelayMonths: null };
  const overruns = projects.map(p => p.overrun_pct ?? 0);
  const delays   = projects.map(p => p.months_delayed ?? 0);
  const avgOverrun = overruns.reduce((a, b) => a + b, 0) / overruns.length;
  const avgDelay   = delays.reduce((a, b) => a + b, 0) / delays.length;
  const overrunScore = normalizeInverted(avgOverrun, BOUNDS.infraOverrunPct.best, BOUNDS.infraOverrunPct.worst);
  const delayScore   = normalizeInverted(avgDelay,   BOUNDS.infraDelayMonths.best, BOUNDS.infraDelayMonths.worst);
  const score = Math.round(overrunScore * 0.6 + delayScore * 0.4);
  return { score, avgOverrunPct: Math.round(avgOverrun * 10) / 10, avgDelayMonths: Math.round(avgDelay * 10) / 10 };
}

function scoreProvince(prov) {
  const { meta, healthcare, housing, fiscal, credit, polling, governance, infrastructure, statscan, education, taxes, safety, costOfLiving } = prov;

  // ─── HEALTHCARE (25%) ───────────────────────────────────────────────
  const surgicalScore  = healthcare ? normalizeInverted(healthcare.surgical_wait_weeks, BOUNDS.surgicalWait.best, BOUNDS.surgicalWait.worst) : null;
  const primaryCareScore = healthcare ? normalize(healthcare.primary_care_attachment_pct, BOUNDS.primaryCareAttach.best, BOUNDS.primaryCareAttach.worst) : null;
  const erScore        = healthcare ? normalize(healthcare.er_benchmark_met_pct, BOUNDS.erBenchmark.best, BOUNDS.erBenchmark.worst) : null;
  const healthcareScore = Math.round(avg(surgicalScore, primaryCareScore, erScore) ?? 50);

  // ─── HOUSING (20%) ──────────────────────────────────────────────────
  const startsScore  = housing ? normalize(housing.housing_starts_per_1000_growth, BOUNDS.housingStartsPer1k.best, BOUNDS.housingStartsPer1k.worst) : null;
  const priceScore   = housing ? normalizeInverted(housing.mls_hpi_yoy_pct, BOUNDS.homePriceYoy.best, BOUNDS.homePriceYoy.worst) : null;
  const rentScore    = housing ? normalizeInverted(housing.rent_inflation_pct, BOUNDS.rentInflation.best, BOUNDS.rentInflation.worst) : null;
  const housingScore = Math.round(avg(startsScore, priceScore, rentScore) ?? 50);

  // ─── FISCAL (20%) ───────────────────────────────────────────────────
  let balanceScore = null, interestScore = null, debtScore = null, trendBonus = 0;
  if (fiscal) {
    balanceScore  = normalize(fiscal.budget_balance_pct_gdp, BOUNDS.budgetBalancePctGdp.best, BOUNDS.budgetBalancePctGdp.worst);
    interestScore = normalizeInverted(fiscal.debt_interest_cents_per_dollar, BOUNDS.debtInterestCents.best, BOUNDS.debtInterestCents.worst);
    debtScore     = normalizeInverted(fiscal.net_debt_per_capita, BOUNDS.netDebtPerCapita.best, BOUNDS.netDebtPerCapita.worst);
    trendBonus    = fiscal.fiscal_trend === 'improving' ? 5 : fiscal.fiscal_trend === 'worsening' ? -5 : 0;
  } else if (statscan) {
    balanceScore  = normalize(statscan.budget_balance_pct_gdp, BOUNDS.budgetBalancePctGdp.best, BOUNDS.budgetBalancePctGdp.worst);
    interestScore = normalizeInverted(statscan.debt_interest_cents_per_dollar, BOUNDS.debtInterestCents.best, BOUNDS.debtInterestCents.worst);
    debtScore     = normalizeInverted(statscan.net_debt_per_capita, BOUNDS.netDebtPerCapita.best, BOUNDS.netDebtPerCapita.worst);
  }
  const fiscalBase = avg(balanceScore, interestScore, debtScore) ?? 50;
  const fiscalScore = Math.max(0, Math.min(100, Math.round(fiscalBase + trendBonus)));

  // ─── INFRASTRUCTURE (15%) ───────────────────────────────────────────
  const infraResult = scoreInfraProjects(infrastructure);
  const infrastructureScore = infraResult.score ?? 50;

  // ─── ECONOMY & GOVERNANCE (15%) ─────────────────────────────────────
  let unemployScore = null, gdpGrowthScore = null;
  if (statscan) {
    unemployScore   = normalizeInverted(statscan.unemployment_delta_from_national ?? 0, BOUNDS.unemploymentDelta.best, BOUNDS.unemploymentDelta.worst);
    gdpGrowthScore  = normalize(statscan.gdp_growth_delta_from_national ?? 0, BOUNDS.gdpGrowthDelta.best, BOUNDS.gdpGrowthDelta.worst);
  }
  const employmentScore = Math.round(avg(unemployScore, gdpGrowthScore) ?? 50);
  const creditScore     = scoreCredit(credit) ?? 60;
  const agScore         = scoreAgOpinion(governance?.ag_opinion) ?? 75;
  const approvalScore   = polling ? normalize(
    (polling.premier_approval_pct - polling.premier_disapproval_pct),
    BOUNDS.premierNetApproval.best, BOUNDS.premierNetApproval.worst
  ) : 50;
  // Childcare as economy sub-metric: high costs suppress labour force participation
  // Note: federal cost-sharing (2021 deal) means not purely provincial, flagged in methodology
  const childcareScore = taxes?.childcare_monthly_avg != null
    ? normalizeInverted(taxes.childcare_monthly_avg, BOUNDS.childcareMonthly.best, BOUNDS.childcareMonthly.worst)
    : null;
  // Weighted economy: employment 25%, credit 20%, AG 20%, approval 20%, childcare 15%
  const economyScore = (() => {
    const parts = [], wts = [];
    parts.push(employmentScore * 0.25); wts.push(0.25);
    parts.push(creditScore     * 0.20); wts.push(0.20);
    parts.push(agScore         * 0.20); wts.push(0.20);
    parts.push(approvalScore   * 0.20); wts.push(0.20);
    if (childcareScore != null) { parts.push(childcareScore * 0.15); wts.push(0.15); }
    const tw = wts.reduce((a, b) => a + b, 0);
    return Math.round(parts.reduce((a, b) => a + b, 0) / tw);
  })();

  // ─── SAFETY (10%) ───────────────────────────────────────────────────
  let victimizationScore = null, homicideScore = null;
  if (safety) {
    victimizationScore = safety.victimization_rate_per_1000 != null
      ? normalize(safety.victimization_rate_per_1000, BOUNDS.victimizationRate.best, BOUNDS.victimizationRate.worst) : null;
    homicideScore = safety.homicide_rate_per_100k != null
      ? normalize(safety.homicide_rate_per_100k, BOUNDS.homicideRate.best, BOUNDS.homicideRate.worst) : null;
  }
  const safetyScore = (() => {
    const parts = []; const wts = [];
    if (victimizationScore != null) { parts.push(victimizationScore * 0.50); wts.push(0.50); }
    if (homicideScore      != null) { parts.push(homicideScore      * 0.50); wts.push(0.50); }
    if (!parts.length) return 50;
    const tw = wts.reduce((a,b)=>a+b,0);
    return Math.round(parts.reduce((a,b)=>a+b,0) / tw);
  })();

  // ─── EDUCATION (14%) ────────────────────────────────────────────────
  let pcapScore = null, tuitionScore = null, strScore = null;
  if (education) {
    const pcapAvg = (education.pcap_math_score != null && education.pcap_reading_score != null)
      ? (education.pcap_math_score + education.pcap_reading_score) / 2
      : education.pcap_math_score ?? education.pcap_reading_score ?? null;
    pcapScore    = pcapAvg    != null ? normalize(pcapAvg, BOUNDS.pcapScore.best, BOUNDS.pcapScore.worst) : null;
    tuitionScore = education.avg_university_tuition != null
      ? normalizeInverted(education.avg_university_tuition, BOUNDS.tuition.best, BOUNDS.tuition.worst) : null;
    strScore     = education.student_teacher_ratio  != null
      ? normalizeInverted(education.student_teacher_ratio, BOUNDS.studentTeacherRatio.best, BOUNDS.studentTeacherRatio.worst) : null;
  }
  const educationScore = (() => {
    const parts = []; const wts = [];
    if (pcapScore    != null) { parts.push(pcapScore    * 0.60); wts.push(0.60); }
    if (tuitionScore != null) { parts.push(tuitionScore * 0.30); wts.push(0.30); }
    if (strScore     != null) { parts.push(strScore     * 0.10); wts.push(0.10); }
    if (!parts.length) return 50;
    const tw = wts.reduce((a,b)=>a+b,0);
    return Math.round(parts.reduce((a,b)=>a+b,0) / tw);
  })();

  // ─── PURCHASING POWER INDEX (not in composite — informational) ───────────────
  // Measures how far take-home pay goes on day-to-day essentials.
  // Weights: rent-to-income 35%, groceries 25%, energy 20%, auto insurance 15%, childcare 5%
  let ppiRentScore = null, ppiGroceryScore = null, ppiEnergyScore = null, ppiInsuranceScore = null;
  if (costOfLiving) {
    ppiRentScore      = costOfLiving.rent_to_income_pct    != null ? normalizeInverted(costOfLiving.rent_to_income_pct,    BOUNDS.rentToIncomePct.best,     BOUNDS.rentToIncomePct.worst)     : null;
    ppiGroceryScore   = costOfLiving.grocery_index         != null ? normalizeInverted(costOfLiving.grocery_index,         BOUNDS.groceryIndex.best,         BOUNDS.groceryIndex.worst)        : null;
    ppiEnergyScore    = costOfLiving.annual_energy_cost    != null ? normalizeInverted(costOfLiving.annual_energy_cost,    BOUNDS.annualEnergyCost.best,     BOUNDS.annualEnergyCost.worst)    : null;
    ppiInsuranceScore = costOfLiving.auto_insurance_annual != null ? normalizeInverted(costOfLiving.auto_insurance_annual, BOUNDS.autoInsuranceAnnual.best,  BOUNDS.autoInsuranceAnnual.worst) : null;
  }
  // childcareScore already computed above — reused here

  const ppiScore = (() => {
    const parts = [], wts = [];
    if (ppiRentScore      != null) { parts.push(ppiRentScore      * 0.35); wts.push(0.35); }
    if (ppiGroceryScore   != null) { parts.push(ppiGroceryScore   * 0.25); wts.push(0.25); }
    if (ppiEnergyScore    != null) { parts.push(ppiEnergyScore    * 0.20); wts.push(0.20); }
    if (ppiInsuranceScore != null) { parts.push(ppiInsuranceScore * 0.15); wts.push(0.15); }
    if (childcareScore    != null) { parts.push(childcareScore    * 0.05); wts.push(0.05); }
    if (!parts.length) return null;
    const tw = wts.reduce((a, b) => a + b, 0);
    return Math.round(parts.reduce((a, b) => a + b, 0) / tw);
  })();

  // ─── COMPOSITE (7 categories, safety 10%) ────────────────────────
  const composite = Math.round(
    healthcareScore     * 0.20 +
    housingScore        * 0.15 +
    fiscalScore         * 0.15 +
    infrastructureScore * 0.11 +
    economyScore        * 0.15 +
    educationScore      * 0.14 +
    safetyScore         * 0.10
  );

  // ─── VALUE SCORE ────────────────────────────────────────────────────
  const taxBurdenIndex = taxes?.tax_burden_index ?? 100;
  const valueScore     = Math.round(composite * 100 / taxBurdenIndex);

  return {
    code:        meta.province_code,
    name:        meta.name,
    premierName: meta.premier_name,
    composite,
    grade:       toGrade(composite),
    valueScore,
    categories: {
      healthcare: {
        score: healthcareScore,
        grade: toGrade(healthcareScore),
        surgicalWaitWeeks:       healthcare?.surgical_wait_weeks ?? null,
        surgicalWaitScore:       surgicalScore,
        primaryCareAttachPct:    healthcare?.primary_care_attachment_pct ?? null,
        primaryCareScore,
        erBenchmarkMetPct:       healthcare?.er_benchmark_met_pct ?? null,
        erBenchmarkScore:        erScore,
        sourceNotes:             healthcare?.source_notes ?? null,
        dataDate:                healthcare?.data_date ?? null,
      },
      housing: {
        score: housingScore,
        grade: toGrade(housingScore),
        mlsHpiBenchmark:             housing?.mls_hpi_benchmark ?? null,
        mlsHpiYoyPct:                housing?.mls_hpi_yoy_pct ?? null,
        priceScore,
        housingStartsPer1000Growth:  housing?.housing_starts_per_1000_growth ?? null,
        startsScore,
        rentInflationPct:            housing?.rent_inflation_pct ?? null,
        rentScore,
        sourceNotes:                 housing?.source_notes ?? null,
        dataDate:                    housing?.data_date ?? null,
      },
      fiscal: {
        score: fiscalScore,
        grade: toGrade(fiscalScore),
        budgetBalancePctGdp:         fiscal?.budget_balance_pct_gdp ?? statscan?.budget_balance_pct_gdp ?? null,
        balanceScore,
        debtInterestCentsPerDollar:  fiscal?.debt_interest_cents_per_dollar ?? statscan?.debt_interest_cents_per_dollar ?? null,
        interestScore,
        netDebtPerCapita:            fiscal?.net_debt_per_capita ?? statscan?.net_debt_per_capita ?? null,
        debtScore,
        fiscalTrend:                 fiscal?.fiscal_trend ?? null,
        trendBonus,
      },
      infrastructure: {
        score: infrastructureScore,
        grade: toGrade(infrastructureScore),
        avgOverrunPct:    infraResult.avgOverrunPct,
        avgDelayMonths:   infraResult.avgDelayMonths,
        projects:         (infrastructure || []).map(p => ({
          name:               p.project_name,
          type:               p.project_type,
          originalBudget:     p.original_budget,
          currentBudget:      p.current_budget,
          overrunPct:         p.overrun_pct,
          originalCompletion: p.original_completion,
          currentCompletion:  p.current_completion,
          monthsDelayed:      p.months_delayed,
          status:             p.status,
        })),
      },
      economy: {
        score: economyScore,
        grade: toGrade(economyScore),
        employmentScore,
        unemploymentRate:              statscan?.unemployment_rate ?? null,
        unemploymentDeltaFromNational: statscan?.unemployment_delta_from_national ?? null,
        unemployScore,
        gdpGrowthPct:                  statscan?.gdp_growth_pct ?? null,
        gdpGrowthDeltaFromNational:    statscan?.gdp_growth_delta_from_national ?? null,
        gdpGrowthScore,
        creditScore,
        credit: credit ? {
          moodys: { rating: credit.moodys_rating, outlook: credit.moodys_outlook },
          dbrs:   { rating: credit.dbrs_rating,   outlook: credit.dbrs_outlook   },
          sp:     { rating: credit.sp_rating,      outlook: credit.sp_outlook     },
          fitch:  { rating: credit.fitch_rating,   outlook: credit.fitch_outlook  },
        } : null,
        agOpinion:    governance?.ag_opinion ?? null,
        agYear:       governance?.ag_year ?? null,
        agScore,
        premierApprovalPct:    polling?.premier_approval_pct ?? null,
        premierDisapprovalPct: polling?.premier_disapproval_pct ?? null,
        approvalScore,
        pollSourceNotes:      polling?.source_notes ?? null,
        childcareMonthlyAvg:  taxes?.childcare_monthly_avg ?? null,
        childcareScore,
      },
      education: {
        score: educationScore,
        grade: toGrade(educationScore),
        pcapMathScore:        education?.pcap_math_score ?? null,
        pcapReadingScore:     education?.pcap_reading_score ?? null,
        perPupilSpending:     education?.per_pupil_spending ?? null,
        studentTeacherRatio:  education?.student_teacher_ratio ?? null,
        avgUniversityTuition: education?.avg_university_tuition ?? null,
        tuitionScore,
        pcapScore,
        sourceNotes:          education?.source_notes ?? null,
      },
      safety: {
        score: safetyScore,
        grade: toGrade(safetyScore),
        victimizationRatePer1000: safety?.victimization_rate_per_1000 ?? null,
        victimizationScore,
        homicideRatePer100k:      safety?.homicide_rate_per_100k      ?? null,
        homicideScore,
        sourceNotes:              safety?.source_notes ?? null,
        dataDate:                 safety?.data_date    ?? null,
      },
    },
    taxes: taxes ? {
      salesTaxPct:                taxes.sales_tax_pct ?? null,
      hasHst:                     taxes.has_hst ?? false,
      incomeEffectiveRatePct:     taxes.income_effective_rate_pct ?? null,
      taxBurdenIndex:             taxes.tax_burden_index ?? null,
      childcareMonthlyAvg:        taxes.childcare_monthly_avg ?? null,
      legislatureCostPerCapita:   taxes.legislature_cost_per_capita ?? null,
      publicSectorPer1000:        taxes.public_sector_per_1000 ?? null,
      sourceNotes:                taxes.source_notes ?? null,
    } : null,
    purchasingPower: {
      score:              ppiScore,
      grade:              toGrade(ppiScore ?? 50),
      rentToIncomePct:    costOfLiving?.rent_to_income_pct    ?? null,
      rentScore:          ppiRentScore,
      groceryIndex:       costOfLiving?.grocery_index         ?? null,
      groceryScore:       ppiGroceryScore,
      annualEnergyCost:   costOfLiving?.annual_energy_cost    ?? null,
      energyScore:        ppiEnergyScore,
      autoInsuranceAnnual: costOfLiving?.auto_insurance_annual ?? null,
      insuranceScore:     ppiInsuranceScore,
      childcareMonthlyAvg: taxes?.childcare_monthly_avg       ?? null,
      childcareScore,
      sourceNotes:        costOfLiving?.source_notes          ?? null,
      dataDate:           costOfLiving?.data_date             ?? null,
    },
    lastUpdated: {
      healthcare:     meta.last_updated_healthcare ?? null,
      housing:        meta.last_updated_housing ?? null,
      credit:         meta.last_updated_credit ?? null,
      polling:        meta.last_updated_polling ?? null,
      infrastructure: meta.last_updated_infrastructure ?? null,
    },
  };
}

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

function buildNationalSummary(scoredProvinces) {
  const scores = scoredProvinces.map(p => p.composite);
  const avg = s => Math.round(s.reduce((a, b) => a + b, 0) / s.length);
  const sorted = [...scoredProvinces].sort((a, b) => b.composite - a.composite);
  return {
    avgComposite:    avg(scores),
    avgHealthcare:   avg(scoredProvinces.map(p => p.categories.healthcare.score)),
    avgHousing:      avg(scoredProvinces.map(p => p.categories.housing.score)),
    avgFiscal:       avg(scoredProvinces.map(p => p.categories.fiscal.score)),
    avgInfrastructure: avg(scoredProvinces.map(p => p.categories.infrastructure.score)),
    avgEconomy:      avg(scoredProvinces.map(p => p.categories.economy.score)),
    avgSafety:       avg(scoredProvinces.map(p => p.categories.safety.score)),
    topProvince:     sorted[0]?.code,
    bottomProvince:  sorted[sorted.length - 1]?.code,
    nationalAvgHealthcareSurgical: Math.round(
      scoredProvinces.reduce((a, p) => a + (p.categories.healthcare.surgicalWaitWeeks ?? 0), 0) /
      scoredProvinces.filter(p => p.categories.healthcare.surgicalWaitWeeks !== null).length
    ),
  };
}

module.exports = { scoreProvince, buildNationalSummary, toGrade };
