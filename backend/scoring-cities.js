/**
 * Bang for Your Duck: Cities — Scoring Engine
 * Pure functions: input raw merged city dataset, output fully scored city objects.
 * Six categories, weighted composite, peer-normalized after all cities are scored.
 * Mirrors the architecture of scoring.js (Provinces).
 */

// ─── BOUNDS ──────────────────────────────────────────────────────────────────
const BOUNDS = {
  // Housing
  housingStartsPer1k:    { best: 10,   worst: 0.5  }, // starts per 1,000 pop
  rentToIncome:          { best: 25,   worst: 50   }, // % of median income (lower = better)
  permitDays:            { best: 60,   worst: 365  }, // days to approval (lower = better)
  // Safety — CSI (lower = better; national avg ≈ 73 in 2022)
  csi:                   { best: 35,   worst: 150  }, // lower is better
  violentCsi:            { best: 25,   worst: 120  }, // lower is better
  // Fiscal
  infraSpendingPct:      { best: 25,   worst: 5    }, // % of budget (higher = better)
  operatingSurplus:      { best: 200,  worst: -500 }, // $ per capita (higher = better)
  netDebtPerCapita:      { best: 1000, worst: 10000}, // $ (lower = better)
  // Liveability
  transitPerCapita:      { best: 150,  worst: 10   }, // annual rides (higher = better)
  commuteMins:           { best: 20,   worst: 40   }, // minutes (lower = better)
  parksSpending:         { best: 300,  worst: 50   }, // $ per capita (higher = better)
  aqhi:                  { best: 2,    worst: 7    }, // AQHI (lower = better)
  // Economic
  unemploymentDelta:     { best: -1,   worst: 3    }, // vs national (lower = better)
  popGrowthPct:          { best: 3,    worst: 0    }, // % annual (higher = better)
  incomeVsNational:      { best: 20,   worst: -20  }, // % above/below national median
  // Community
  homelessnessPer10k:    { best: 5,    worst: 80   }, // per 10k pop (lower = better)
  socialServicesSpend:   { best: 800,  worst: 100  }, // $ per capita (higher = better)
};

// ─── HELPERS (mirrors scoring.js) ────────────────────────────────────────────
function normalize(value, best, worst) {
  if (value === null || value === undefined) return null;
  const clamped = Math.max(Math.min(value, Math.max(best, worst)), Math.min(best, worst));
  if (best === worst) return 100;
  return Math.round(((clamped - worst) / (best - worst)) * 100);
}

function normalizeInverted(value, best, worst) {
  return normalize(value, worst, best);
}

function toGrade(score) {
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

function weightedScore(parts) {
  // parts: [{ score, weight }] — nulls skipped, weights re-normalized
  const valid = parts.filter(p => p.score != null);
  if (!valid.length) return 50; // fallback
  const totalWeight = valid.reduce((a, p) => a + p.weight, 0);
  return Math.round(valid.reduce((a, p) => a + p.score * p.weight, 0) / totalWeight);
}

// ─── SCORE ONE CITY ───────────────────────────────────────────────────────────
function scoreCity(raw) {
  const { meta, housing, safety, fiscal, liveability, economic, community, infrastructure } = raw;

  // ─── CATEGORY 1: HOUSING & AFFORDABILITY (25%) ──────────────────────────
  let startsScore = null, rentToIncomeScore = null, permitScore = null, hpiTrendScore = null;

  if (housing) {
    startsScore = housing.housing_starts_per_1000_pop != null
      ? normalize(housing.housing_starts_per_1000_pop, BOUNDS.housingStartsPer1k.best, BOUNDS.housingStartsPer1k.worst)
      : null;

    rentToIncomeScore = housing.rent_to_income_ratio != null
      ? normalizeInverted(housing.rent_to_income_ratio, BOUNDS.rentToIncome.best, BOUNDS.rentToIncome.worst)
      : null;

    permitScore = housing.avg_permit_approval_days != null
      ? normalizeInverted(housing.avg_permit_approval_days, BOUNDS.permitDays.best, BOUNDS.permitDays.worst)
      : null;

    // HPI trend: falling prices = better in expensive markets; rising = worse
    if (housing.mls_hpi_yoy_pct != null) {
      // Clamp: -10% (good: prices cooling) to +15% (bad: runaway prices)
      hpiTrendScore = normalize(housing.mls_hpi_yoy_pct, -10, 15);
    }
  }

  const housingScore = weightedScore([
    { score: startsScore,       weight: 0.35 },
    { score: rentToIncomeScore, weight: 0.35 },
    { score: hpiTrendScore,     weight: 0.15 },
    { score: permitScore,       weight: 0.15 },
  ]);

  // ─── CATEGORY 2: SAFETY (20%) ────────────────────────────────────────────
  let csiScore = null, violentCsiScore = null, trendBonus = 0;

  if (safety) {
    csiScore = safety.crime_severity_index != null
      ? normalizeInverted(safety.crime_severity_index, BOUNDS.csi.best, BOUNDS.csi.worst)
      : null;

    violentCsiScore = safety.violent_csi != null
      ? normalizeInverted(safety.violent_csi, BOUNDS.violentCsi.best, BOUNDS.violentCsi.worst)
      : null;

    if (safety.csi_10yr_trend) {
      trendBonus = safety.csi_10yr_trend === 'improving' ? 8
        : safety.csi_10yr_trend === 'worsening' ? -8 : 0;
    }
  }

  const baseSafetyScore = weightedScore([
    { score: csiScore,        weight: 0.60 },
    { score: violentCsiScore, weight: 0.40 },
  ]);
  const safetyScore = baseSafetyScore === 50 && csiScore == null
    ? 50
    : Math.min(100, Math.max(0, baseSafetyScore + trendBonus));

  // ─── CATEGORY 3: FISCAL MANAGEMENT (20%) ────────────────────────────────
  let infraPctScore = null, operatingScore = null, debtScore = null;

  if (fiscal) {
    infraPctScore = fiscal.infrastructure_spending_pct != null
      ? normalize(fiscal.infrastructure_spending_pct, BOUNDS.infraSpendingPct.best, BOUNDS.infraSpendingPct.worst)
      : null;

    operatingScore = fiscal.operating_surplus_deficit_per_capita != null
      ? normalize(fiscal.operating_surplus_deficit_per_capita, BOUNDS.operatingSurplus.best, BOUNDS.operatingSurplus.worst)
      : null;

    debtScore = fiscal.net_debt_per_capita != null
      ? normalizeInverted(fiscal.net_debt_per_capita, BOUNDS.netDebtPerCapita.best, BOUNDS.netDebtPerCapita.worst)
      : null;
  }

  const fiscalScore = weightedScore([
    { score: infraPctScore,  weight: 0.35 },
    { score: operatingScore, weight: 0.35 },
    { score: debtScore,      weight: 0.30 },
  ]);

  // ─── CATEGORY 4: LIVEABILITY (15%) ──────────────────────────────────────
  let transitScore = null, commuteScore = null, parksScore = null, aqhiScore = null;

  if (liveability) {
    transitScore = liveability.transit_ridership_per_capita != null
      ? normalize(liveability.transit_ridership_per_capita, BOUNDS.transitPerCapita.best, BOUNDS.transitPerCapita.worst)
      : null;

    commuteScore = liveability.avg_commute_time_mins != null
      ? normalizeInverted(liveability.avg_commute_time_mins, BOUNDS.commuteMins.best, BOUNDS.commuteMins.worst)
      : null;

    parksScore = liveability.parks_rec_spending_per_capita != null
      ? normalize(liveability.parks_rec_spending_per_capita, BOUNDS.parksSpending.best, BOUNDS.parksSpending.worst)
      : null;

    aqhiScore = liveability.air_quality_index_annual_avg != null
      ? normalizeInverted(liveability.air_quality_index_annual_avg, BOUNDS.aqhi.best, BOUNDS.aqhi.worst)
      : null;
  }

  const liveabilityScore = weightedScore([
    { score: transitScore, weight: 0.30 },
    { score: commuteScore, weight: 0.30 },
    { score: parksScore,   weight: 0.20 },
    { score: aqhiScore,    weight: 0.20 },
  ]);

  // ─── CATEGORY 5: ECONOMIC VITALITY (10%) ────────────────────────────────
  let unemployScore = null, popGrowthScore = null, incomeScore = null;

  if (economic) {
    unemployScore = economic.unemployment_vs_national_avg != null
      ? normalizeInverted(economic.unemployment_vs_national_avg, BOUNDS.unemploymentDelta.best, BOUNDS.unemploymentDelta.worst)
      : null;

    popGrowthScore = economic.population_growth_rate_pct != null
      ? normalize(economic.population_growth_rate_pct, BOUNDS.popGrowthPct.best, BOUNDS.popGrowthPct.worst)
      : null;

    incomeScore = economic.income_vs_national_avg_pct != null
      ? normalize(economic.income_vs_national_avg_pct, BOUNDS.incomeVsNational.best, BOUNDS.incomeVsNational.worst)
      : null;
  }

  const economicScore = weightedScore([
    { score: unemployScore,  weight: 0.40 },
    { score: popGrowthScore, weight: 0.30 },
    { score: incomeScore,    weight: 0.30 },
  ]);

  // ─── CATEGORY 6: COMMUNITY INVESTMENT (10%) ─────────────────────────────
  let homelessScore = null, homelessTrendBonus = 0, socialScore = null;

  if (community) {
    homelessScore = community.homelessness_per_10k_pop != null
      ? normalizeInverted(community.homelessness_per_10k_pop, BOUNDS.homelessnessPer10k.best, BOUNDS.homelessnessPer10k.worst)
      : null;

    if (community.homelessness_yoy_trend) {
      homelessTrendBonus = community.homelessness_yoy_trend === 'improving' ? 8
        : community.homelessness_yoy_trend === 'worsening' ? -8 : 0;
    }

    socialScore = community.social_services_spending_per_capita != null
      ? normalize(community.social_services_spending_per_capita, BOUNDS.socialServicesSpend.best, BOUNDS.socialServicesSpend.worst)
      : null;
  }

  const baseCommunityScore = weightedScore([
    { score: homelessScore, weight: 0.60 },
    { score: socialScore,   weight: 0.40 },
  ]);
  const communityScore = baseCommunityScore === 50 && homelessScore == null
    ? 50
    : Math.min(100, Math.max(0, baseCommunityScore + homelessTrendBonus));

  // ─── INFRASTRUCTURE PROJECTS (context only, no composite impact) ─────────
  const infraProjects = (infrastructure || []).map(p => ({
    name:               p.project_name,
    type:               p.project_type,
    originalBudget:     p.original_budget,
    currentBudget:      p.current_budget,
    overrunPct:         p.overrun_pct,
    originalCompletion: p.original_completion,
    currentCompletion:  p.current_completion,
    monthsDelayed:      p.months_delayed,
    status:             p.status,
  }));

  // ─── COMPOSITE ───────────────────────────────────────────────────────────
  // Housing 25% + Safety 20% + Fiscal 20% + Liveability 15% + Economic 10% + Community 10% = 100%
  const composite = Math.round(
    housingScore   * 0.25 +
    safetyScore    * 0.20 +
    fiscalScore    * 0.20 +
    liveabilityScore * 0.15 +
    economicScore  * 0.10 +
    communityScore * 0.10
  );

  // ─── DUCK SCORE ──────────────────────────────────────────────────────────
  // Uses absolute annual property tax on a benchmark home, not just the rate %.
  // A low rate on a $1.2M home (Vancouver) is a real tax bill, not free money.
  // Formula: annualTax = (taxRate/100) × benchmarkPrice
  //          taxIndex  = sqrt(annualTax / NATIONAL_MEDIAN_TAX) × 100
  //          duckScore = composite × 100 / taxIndex
  // City at national median annual tax (~$4,500) → duckScore = composite exactly.
  const NATIONAL_MEDIAN_ANNUAL_TAX = 4500;
  const taxRate       = fiscal?.property_tax_residential_rate ?? null;
  const benchmarkPrice = housing?.mls_hpi_benchmark ?? null;
  const annualTax     = (taxRate != null && benchmarkPrice != null)
    ? (taxRate / 100) * benchmarkPrice
    : null;
  const taxIndex  = annualTax != null
    ? Math.sqrt(annualTax / NATIONAL_MEDIAN_ANNUAL_TAX) * 100
    : 100;
  const duckScore = Math.round(composite * 100 / taxIndex);

  return {
    cmaCode:     meta.cma_code,
    name:        meta.city_name,
    province:    meta.province,
    provinceAbbr: meta.province_abbr,
    mayorName:   meta.mayor_name,
    population:  meta.population_2021,
    lat:         meta.lat ?? null,
    lng:         meta.lng ?? null,
    composite,
    grade:       toGrade(composite),
    duckScore,
    duckGrade:   toGrade(duckScore),
    categories: {
      housing: {
        score: housingScore,
        grade: toGrade(housingScore),
        mlsHpiBenchmark:        housing?.mls_hpi_benchmark ?? null,
        mlsHpiYoyPct:           housing?.mls_hpi_yoy_pct ?? null,
        hpiTrendScore,
        avgRent2br:             housing?.avg_rent_2br ?? null,
        rentToIncomeRatio:      housing?.rent_to_income_ratio ?? null,
        rentToIncomeScore,
        housingStartsPer1000:   housing?.housing_starts_per_1000_pop ?? null,
        startsScore,
        avgPermitApprovalDays:  housing?.avg_permit_approval_days ?? null,
        permitScore,
        sourceNotes:            housing?.source_notes ?? null,
        dataDate:               housing?.data_date ?? null,
      },
      safety: {
        score: safetyScore,
        grade: toGrade(safetyScore),
        crimeSeverityIndex:     safety?.crime_severity_index ?? null,
        csiScore,
        violentCsi:             safety?.violent_csi ?? null,
        violentCsiScore,
        csiYoyChangePct:        safety?.csi_yoy_change_pct ?? null,
        csi10yrTrend:           safety?.csi_10yr_trend ?? null,
        trendBonus,
        sourceNotes:            safety?.source_notes ?? null,
        dataDate:               safety?.data_date ?? null,
      },
      fiscal: {
        score: fiscalScore,
        grade: toGrade(fiscalScore),
        propertyTaxRate:        fiscal?.property_tax_residential_rate ?? null,
        revenuePerCapita:       fiscal?.municipal_revenue_per_capita ?? null,
        spendingPerCapita:      fiscal?.municipal_spending_per_capita ?? null,
        infraSpendingPct:       fiscal?.infrastructure_spending_pct ?? null,
        infraPctScore,
        netDebtPerCapita:       fiscal?.net_debt_per_capita ?? null,
        debtScore,
        operatingSurplusDeficit: fiscal?.operating_surplus_deficit_per_capita ?? null,
        operatingScore,
        sourceNotes:            fiscal?.source_notes ?? null,
        dataDate:               fiscal?.data_date ?? null,
      },
      liveability: {
        score: liveabilityScore,
        grade: toGrade(liveabilityScore),
        transitRidershipPerCapita: liveability?.transit_ridership_per_capita ?? null,
        transitScore,
        transitRecoveryPct:     liveability?.transit_recovery_pct_prepandemic ?? null,
        avgCommuteMins:         liveability?.avg_commute_time_mins ?? null,
        commuteScore,
        aqhiAnnualAvg:          liveability?.air_quality_index_annual_avg ?? null,
        aqhiScore,
        parksRecSpendingPerCapita: liveability?.parks_rec_spending_per_capita ?? null,
        parksScore,
        walkabilityScore:       liveability?.walkability_score ?? null,
        sourceNotes:            liveability?.source_notes ?? null,
        dataDate:               liveability?.data_date ?? null,
      },
      economic: {
        score: economicScore,
        grade: toGrade(economicScore),
        unemploymentRate:       economic?.unemployment_rate ?? null,
        unemploymentVsNational: economic?.unemployment_vs_national_avg ?? null,
        unemployScore,
        medianHouseholdIncome:  economic?.median_household_income ?? null,
        incomeVsNationalPct:    economic?.income_vs_national_avg_pct ?? null,
        incomeScore,
        populationGrowthPct:    economic?.population_growth_rate_pct ?? null,
        popGrowthScore,
        sourceNotes:            economic?.source_notes ?? null,
        dataDate:               economic?.data_date ?? null,
      },
      community: {
        score: communityScore,
        grade: toGrade(communityScore),
        homelessnessPitCount:   community?.homelessness_pit_count ?? null,
        homelessnessPer10k:     community?.homelessness_per_10k_pop ?? null,
        homelessScore,
        homelessnessTrend:      community?.homelessness_yoy_trend ?? null,
        homelessTrendBonus,
        socialServicesSpend:    community?.social_services_spending_per_capita ?? null,
        socialScore,
        sourceNotes:            community?.source_notes ?? null,
        dataDate:               community?.data_date ?? null,
      },
    },
    infrastructure: infraProjects,
  };
}

// ─── PEER-RELATIVE NORMALIZATION ─────────────────────────────────────────────
// After all cities are scored in isolation, rescale each category so the
// top Canadian city maps to CATEGORY_CEILING (87 = B). Same pattern as Provinces.

const CATEGORY_CEILING = 87;
const COMPOSITE_CATS    = ['housing', 'safety', 'fiscal', 'liveability', 'economic', 'community'];
const COMPOSITE_WEIGHTS = { housing: 0.25, safety: 0.20, fiscal: 0.20, liveability: 0.15, economic: 0.10, community: 0.10 };

function normalizeCityScores(scoredCities) {
  const maxes = {};
  for (const cat of COMPOSITE_CATS) {
    maxes[cat] = Math.max(...scoredCities.map(c => c.categories[cat]?.score ?? 0));
  }

  return scoredCities.map(c => {
    const newCats = { ...c.categories };

    for (const cat of COMPOSITE_CATS) {
      const raw = c.categories[cat]?.score;
      if (raw == null) continue;
      const normalized = maxes[cat] > 0
        ? Math.round((raw / maxes[cat]) * CATEGORY_CEILING)
        : raw;
      newCats[cat] = { ...c.categories[cat], score: normalized, grade: toGrade(normalized) };
    }

    const composite = Math.round(
      newCats.housing.score    * COMPOSITE_WEIGHTS.housing    +
      newCats.safety.score     * COMPOSITE_WEIGHTS.safety     +
      newCats.fiscal.score     * COMPOSITE_WEIGHTS.fiscal     +
      newCats.liveability.score * COMPOSITE_WEIGHTS.liveability +
      newCats.economic.score   * COMPOSITE_WEIGHTS.economic   +
      newCats.community.score  * COMPOSITE_WEIGHTS.community
    );

    // Recompute duck score: absolute annual tax on benchmark home, sqrt-curved
    const NATIONAL_MEDIAN_ANNUAL_TAX = 4500;
    const taxRate      = c.categories.fiscal?.propertyTaxRate ?? null;
    const benchmarkPrice = c.categories.housing?.mlsHpiBenchmark ?? null;
    const annualTax    = (taxRate != null && benchmarkPrice != null)
      ? (taxRate / 100) * benchmarkPrice
      : null;
    const taxIndex  = annualTax != null
      ? Math.sqrt(annualTax / NATIONAL_MEDIAN_ANNUAL_TAX) * 100
      : 100;
    const duckScore = Math.round(composite * 100 / taxIndex);

    return { ...c, categories: newCats, composite, grade: toGrade(composite), duckScore, duckGrade: toGrade(duckScore) };
  });
}

// ─── NATIONAL SUMMARY ─────────────────────────────────────────────────────────
function buildCitiesSummary(scoredCities) {
  const avg = arr => {
    const valid = arr.filter(v => v != null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
  };

  const sorted = [...scoredCities].sort((a, b) => b.composite - a.composite);
  const safest = [...scoredCities].sort((a, b) =>
    (a.categories.safety.crimeSeverityIndex ?? 999) - (b.categories.safety.crimeSeverityIndex ?? 999)
  );
  const mostHousing = [...scoredCities].sort((a, b) =>
    (b.categories.housing.housingStartsPer1000 ?? 0) - (a.categories.housing.housingStartsPer1000 ?? 0)
  );

  return {
    totalCities:     scoredCities.length,
    avgComposite:    avg(scoredCities.map(c => c.composite)),
    avgHousing:      avg(scoredCities.map(c => c.categories.housing.score)),
    avgSafety:       avg(scoredCities.map(c => c.categories.safety.score)),
    avgFiscal:       avg(scoredCities.map(c => c.categories.fiscal.score)),
    avgLiveability:  avg(scoredCities.map(c => c.categories.liveability.score)),
    avgEconomic:     avg(scoredCities.map(c => c.categories.economic.score)),
    avgCommunity:    avg(scoredCities.map(c => c.categories.community.score)),
    topCity:         sorted[0]?.cmaCode ?? null,
    bottomCity:      sorted[sorted.length - 1]?.cmaCode ?? null,
    safestCity:      safest[0]?.cmaCode ?? null,
    mostHousingCity: mostHousing[0]?.cmaCode ?? null,
    // For "did you know?" rotating stats
    csiGap: (() => {
      const csis = scoredCities.map(c => c.categories.safety.crimeSeverityIndex).filter(Boolean);
      return csis.length >= 2
        ? Math.round((Math.max(...csis) / Math.min(...csis)) * 10) / 10
        : null;
    })(),
    housingStartsGap: (() => {
      const starts = scoredCities.map(c => c.categories.housing.housingStartsPer1000).filter(Boolean);
      return starts.length >= 2
        ? Math.round((Math.max(...starts) / Math.min(...starts)) * 10) / 10
        : null;
    })(),
    surplusCityCount: scoredCities.filter(c =>
      (c.categories.fiscal.operatingSurplusDeficit ?? -1) > 0
    ).length,
  };
}

module.exports = { scoreCity, normalizeCityScores, buildCitiesSummary, toGrade };
