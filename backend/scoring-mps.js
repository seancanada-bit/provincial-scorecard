/**
 * Bang for Your Duck: MPs — Scoring Engine
 * Pure functions: input raw merged riding dataset, output fully scored riding objects.
 * Six categories, weighted composite, peer-normalized after all ridings are scored.
 * Mirrors the architecture of scoring-cities.js.
 */

// ─── BOUNDS ──────────────────────────────────────────────────────────────────
const BOUNDS = {
  // MP Performance
  voteParticipation:   { best: 95,   worst: 50   }, // % of House votes attended
  billsIntroduced:     { best: 10,   worst: 0    }, // count (higher = better)
  committeeMemberships:{ best: 4,    worst: 0    }, // count (higher = better)
  speechesCount:       { best: 200,  worst: 10   }, // Hansard interventions
  // Federal Investment
  grantsPerCapita:     { best: 500,  worst: 50   }, // $ per person (higher = better)
  contractsPerCapita:  { best: 300,  worst: 20   }, // $ per person (higher = better)
  facilitiesCount:     { best: 10,   worst: 0    }, // federal buildings/bases
  // Electoral Health
  voterTurnout:        { best: 80,   worst: 45   }, // % (higher = better)
  turnoutDelta:        { best: 15,   worst: -15  }, // pp vs national avg (higher = better)
  marginOfVictory:     { best: 5,    worst: 50   }, // % (lower = more competitive = better)
  candidatesCount:     { best: 8,    worst: 3    }, // more candidates = healthier democracy
  // Demographic Outcomes
  incomeVsNational:    { best: 30,   worst: -30  }, // % delta
  unemploymentDelta:   { best: -2,   worst: 4    }, // pp vs national (lower = better)
  postsecondaryRate:   { best: 75,   worst: 30   }, // % with credentials
  immigrationPct:      { best: 40,   worst: 5    }, // % immigrant (proxy for attractiveness)
  // MP Fiscal Responsibility
  totalExpenses:       { best: 400000, worst: 750000 }, // $ (lower = better)
  travelPerKm:         { best: 2,    worst: 8    }, // $ per km from Ottawa (lower = better)
  hospitalityExpenses: { best: 1000, worst: 20000 }, // $ (lower = better)
  // Federal Transfers
  totalTransfers:      { best: 4000, worst: 1500 }, // $ per capita (higher = better)
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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
  const valid = parts.filter(p => p.score != null);
  if (!valid.length) return null;
  const totalWeight = valid.reduce((a, p) => a + p.weight, 0);
  return Math.round(valid.reduce((a, p) => a + p.score * p.weight, 0) / totalWeight);
}

// ─── SCORE ONE RIDING ────────────────────────────────────────────────────────
function scoreRiding(raw) {
  const { meta, performance, investment, electoral, demographics, expenses, transfers } = raw;

  // ─── CATEGORY 1: MP PERFORMANCE (25%) ─────────────────────────────────
  let voteScore = null, billsScore = null, committeeScore = null, speechScore = null;
  const OPPOSITION_BONUS = 5; // structural fairness adjustment

  if (performance) {
    voteScore = performance.vote_participation_pct != null
      ? normalize(performance.vote_participation_pct, BOUNDS.voteParticipation.best, BOUNDS.voteParticipation.worst)
      : null;

    billsScore = performance.bills_introduced != null
      ? normalize(performance.bills_introduced, BOUNDS.billsIntroduced.best, BOUNDS.billsIntroduced.worst)
      : null;

    committeeScore = performance.committee_memberships != null
      ? normalize(performance.committee_memberships, BOUNDS.committeeMemberships.best, BOUNDS.committeeMemberships.worst)
      : null;

    speechScore = performance.speeches_count != null
      ? normalize(performance.speeches_count, BOUNDS.speechesCount.best, BOUNDS.speechesCount.worst)
      : null;
  }

  const basePerformance = weightedScore([
    { score: voteScore,      weight: 0.35 },
    { score: billsScore,     weight: 0.25 },
    { score: committeeScore, weight: 0.15 },
    { score: speechScore,    weight: 0.25 },
  ]);
  const isOpposition = performance?.is_opposition ?? false;
  const performanceScore = basePerformance == null
    ? null
    : Math.min(100, Math.max(0, basePerformance + (isOpposition ? OPPOSITION_BONUS : 0)));

  // ─── CATEGORY 2: FEDERAL INVESTMENT (20%) ─────────────────────────────
  let grantsScore = null, contractsScore = null, facilitiesScore = null;

  if (investment) {
    grantsScore = investment.infrastructure_grants_per_capita != null
      ? normalize(investment.infrastructure_grants_per_capita, BOUNDS.grantsPerCapita.best, BOUNDS.grantsPerCapita.worst)
      : null;

    contractsScore = investment.federal_contracts_per_capita != null
      ? normalize(investment.federal_contracts_per_capita, BOUNDS.contractsPerCapita.best, BOUNDS.contractsPerCapita.worst)
      : null;

    facilitiesScore = investment.federal_facilities_count != null
      ? normalize(investment.federal_facilities_count, BOUNDS.facilitiesCount.best, BOUNDS.facilitiesCount.worst)
      : null;
  }

  const investmentScore = weightedScore([
    { score: grantsScore,     weight: 0.45 },
    { score: contractsScore,  weight: 0.35 },
    { score: facilitiesScore, weight: 0.20 },
  ]);

  // ─── CATEGORY 3: ELECTORAL HEALTH (15%) ───────────────────────────────
  let turnoutScore = null, turnoutDeltaScore = null, marginScore = null, candidateScore = null;

  if (electoral) {
    turnoutScore = electoral.voter_turnout_pct != null
      ? normalize(electoral.voter_turnout_pct, BOUNDS.voterTurnout.best, BOUNDS.voterTurnout.worst)
      : null;

    turnoutDeltaScore = electoral.turnout_vs_national != null
      ? normalize(electoral.turnout_vs_national, BOUNDS.turnoutDelta.best, BOUNDS.turnoutDelta.worst)
      : null;

    marginScore = electoral.margin_of_victory_pct != null
      ? normalizeInverted(electoral.margin_of_victory_pct, BOUNDS.marginOfVictory.best, BOUNDS.marginOfVictory.worst)
      : null;

    candidateScore = electoral.candidates_count != null
      ? normalize(electoral.candidates_count, BOUNDS.candidatesCount.best, BOUNDS.candidatesCount.worst)
      : null;
  }

  const electoralScore = weightedScore([
    { score: turnoutScore,      weight: 0.35 },
    { score: turnoutDeltaScore, weight: 0.25 },
    { score: marginScore,       weight: 0.25 },
    { score: candidateScore,    weight: 0.15 },
  ]);

  // ─── CATEGORY 4: DEMOGRAPHIC OUTCOMES (15%) ───────────────────────────
  let incomeScore = null, unemployScore = null, educationScore = null, immigrationScore = null;

  if (demographics) {
    incomeScore = demographics.income_vs_national_pct != null
      ? normalize(demographics.income_vs_national_pct, BOUNDS.incomeVsNational.best, BOUNDS.incomeVsNational.worst)
      : null;

    unemployScore = demographics.unemployment_rate != null
      ? normalizeInverted(demographics.unemployment_rate - 6.3, BOUNDS.unemploymentDelta.best, BOUNDS.unemploymentDelta.worst) // 6.3% national avg
      : null;

    educationScore = demographics.postsecondary_rate != null
      ? normalize(demographics.postsecondary_rate, BOUNDS.postsecondaryRate.best, BOUNDS.postsecondaryRate.worst)
      : null;

    immigrationScore = demographics.immigration_pct != null
      ? normalize(demographics.immigration_pct, BOUNDS.immigrationPct.best, BOUNDS.immigrationPct.worst)
      : null;
  }

  const demographicScore = weightedScore([
    { score: incomeScore,      weight: 0.30 },
    { score: unemployScore,    weight: 0.30 },
    { score: educationScore,   weight: 0.25 },
    { score: immigrationScore, weight: 0.15 },
  ]);

  // ─── CATEGORY 5: MP FISCAL RESPONSIBILITY (15%) ───────────────────────
  let expenseScore = null, travelKmScore = null, hospitalityScore = null;

  if (expenses) {
    expenseScore = expenses.total_expenses != null
      ? normalizeInverted(expenses.total_expenses, BOUNDS.totalExpenses.best, BOUNDS.totalExpenses.worst)
      : null;

    travelKmScore = expenses.travel_per_km != null
      ? normalizeInverted(expenses.travel_per_km, BOUNDS.travelPerKm.best, BOUNDS.travelPerKm.worst)
      : null;

    hospitalityScore = expenses.hospitality_expenses != null
      ? normalizeInverted(expenses.hospitality_expenses, BOUNDS.hospitalityExpenses.best, BOUNDS.hospitalityExpenses.worst)
      : null;
  }

  const expensesScore = weightedScore([
    { score: expenseScore,     weight: 0.40 },
    { score: travelKmScore,    weight: 0.35 },
    { score: hospitalityScore, weight: 0.25 },
  ]);

  // ─── CATEGORY 6: FEDERAL TRANSFERS (10%) ──────────────────────────────
  let transfersNorm = null;

  if (transfers) {
    transfersNorm = transfers.total_transfers_per_capita != null
      ? normalize(transfers.total_transfers_per_capita, BOUNDS.totalTransfers.best, BOUNDS.totalTransfers.worst)
      : null;
  }

  const transfersScore = transfersNorm; // single metric, no weighting needed

  // ─── COMPOSITE ─────────────────────────────────────────────────────────
  // Value = dollars in. 75% of score is money flowing back to the riding.
  // Federal Investment 45% · Federal Transfers 30% · MP Expenses 10%
  // MP Performance 8% · Electoral Health 5% · Demographics 2% = 100%
  const composite = weightedScore([
    { score: investmentScore,   weight: 0.45 },
    { score: transfersScore,    weight: 0.30 },
    { score: expensesScore,     weight: 0.10 },
    { score: performanceScore,  weight: 0.08 },
    { score: electoralScore,    weight: 0.05 },
    { score: demographicScore,  weight: 0.02 },
  ]) ?? 50;

  // ─── DUCK SCORE ────────────────────────────────────────────────────────
  // "What does your riding get for the federal tax dollars it generates?"
  // taxIndex = sqrt(estimatedFederalTaxPerCapita / nationalMedianFederalTax) × 100
  // Ridings with higher incomes (= more federal tax) need higher composite to score well.
  const NATIONAL_MEDIAN_FEDERAL_TAX = 8500; // ~$8,500/person avg federal income tax
  const medianIncome = demographics?.median_household_income ?? null;
  // Rough estimate: effective federal tax ≈ 15% of household income, ÷ 2.5 people per household
  const estimatedFederalTaxPerCapita = medianIncome != null
    ? (medianIncome * 0.15) / 2.5
    : null;
  const taxIndex = estimatedFederalTaxPerCapita != null
    ? Math.sqrt(estimatedFederalTaxPerCapita / NATIONAL_MEDIAN_FEDERAL_TAX) * 100
    : 100;
  const duckScore = Math.min(100, Math.round(composite * 100 / taxIndex));

  return {
    ridingCode:    meta.riding_code,
    name:          meta.riding_name,
    province:      meta.province_code,
    mpName:        meta.mp_name,
    mpParty:       meta.mp_party,
    mpElectedDate: meta.mp_elected_date,
    population:    meta.population,
    lat:           meta.lat ?? null,
    lng:           meta.lng ?? null,
    composite,
    grade:       toGrade(composite),
    duckScore,
    duckGrade:   toGrade(duckScore),
    categories: {
      performance: {
        score: performanceScore,
        grade: toGrade(performanceScore),
        voteParticipationPct: performance?.vote_participation_pct ?? null,
        voteScore,
        billsIntroduced:      performance?.bills_introduced ?? null,
        billsPassed:          performance?.bills_passed ?? null,
        billsScore,
        committeeMemberships: performance?.committee_memberships ?? null,
        committeeScore,
        speechesCount:        performance?.speeches_count ?? null,
        speechScore,
        isOpposition,
        oppositionBonus:      isOpposition ? OPPOSITION_BONUS : 0,
        sourceNotes:          performance?.source_notes ?? null,
        dataDate:             performance?.data_date ?? null,
      },
      investment: {
        score: investmentScore,
        grade: toGrade(investmentScore),
        infrastructureGrantsPerCapita: investment?.infrastructure_grants_per_capita ?? null,
        grantsScore,
        federalContractsPerCapita:     investment?.federal_contracts_per_capita ?? null,
        contractsScore,
        federalFacilitiesCount:        investment?.federal_facilities_count ?? null,
        facilitiesScore,
        sourceNotes:                   investment?.source_notes ?? null,
        dataDate:                      investment?.data_date ?? null,
      },
      electoral: {
        score: electoralScore,
        grade: toGrade(electoralScore),
        voterTurnoutPct:     electoral?.voter_turnout_pct ?? null,
        turnoutScore,
        turnoutVsNational:   electoral?.turnout_vs_national ?? null,
        turnoutDeltaScore,
        marginOfVictoryPct:  electoral?.margin_of_victory_pct ?? null,
        marginScore,
        candidatesCount:     electoral?.candidates_count ?? null,
        candidateScore,
        sourceNotes:         electoral?.source_notes ?? null,
        dataDate:            electoral?.data_date ?? null,
      },
      demographics: {
        score: demographicScore,
        grade: toGrade(demographicScore),
        medianHouseholdIncome: demographics?.median_household_income ?? null,
        incomeVsNationalPct:   demographics?.income_vs_national_pct ?? null,
        incomeScore,
        unemploymentRate:      demographics?.unemployment_rate ?? null,
        unemployScore,
        postsecondaryRate:     demographics?.postsecondary_rate ?? null,
        educationScore,
        immigrationPct:        demographics?.immigration_pct ?? null,
        immigrationScore,
        sourceNotes:           demographics?.source_notes ?? null,
        dataDate:              demographics?.data_date ?? null,
      },
      expenses: {
        score: expensesScore,
        grade: toGrade(expensesScore),
        totalExpenses:        expenses?.total_expenses ?? null,
        expenseScore,
        travelExpenses:       expenses?.travel_expenses ?? null,
        travelPerKm:          expenses?.travel_per_km ?? null,
        travelKmScore,
        hospitalityExpenses:  expenses?.hospitality_expenses ?? null,
        hospitalityScore,
        officeExpenses:       expenses?.office_expenses ?? null,
        distanceFromOttawaKm: expenses?.distance_from_ottawa_km ?? null,
        sourceNotes:          expenses?.source_notes ?? null,
        dataDate:             expenses?.data_date ?? null,
      },
      transfers: {
        score: transfersScore,
        grade: toGrade(transfersScore),
        chtPerCapita:           transfers?.cht_per_capita ?? null,
        cstPerCapita:           transfers?.cst_per_capita ?? null,
        equalizationPerCapita:  transfers?.equalization_per_capita ?? null,
        gasTaxPerCapita:        transfers?.gas_tax_per_capita ?? null,
        totalTransfersPerCapita: transfers?.total_transfers_per_capita ?? null,
        sourceNotes:            transfers?.source_notes ?? null,
        dataDate:               transfers?.data_date ?? null,
      },
    },
  };
}

// ─── PEER-RELATIVE NORMALIZATION ─────────────────────────────────────────────
const CATEGORY_CEILING  = 82;
const COMPOSITE_CATS    = ['performance', 'investment', 'electoral', 'demographics', 'expenses', 'transfers'];
const COMPOSITE_WEIGHTS = {
  investment:   0.45,
  transfers:    0.30,
  expenses:     0.10,
  performance:  0.08,
  electoral:    0.05,
  demographics: 0.02,
};

function normalizeRidingScores(scoredRidings) {
  const maxes = {};
  for (const cat of COMPOSITE_CATS) {
    maxes[cat] = Math.max(...scoredRidings.map(r => r.categories[cat]?.score ?? 0));
  }

  return scoredRidings.map(r => {
    const newCats = { ...r.categories };

    for (const cat of COMPOSITE_CATS) {
      const raw = r.categories[cat]?.score;
      if (raw == null) continue;
      const normalized = maxes[cat] > 0
        ? Math.round((raw / maxes[cat]) * CATEGORY_CEILING)
        : raw;
      newCats[cat] = { ...r.categories[cat], score: normalized, grade: toGrade(normalized) };
    }

    const composite = weightedScore([
      { score: newCats.investment.score,   weight: COMPOSITE_WEIGHTS.investment   },
      { score: newCats.transfers.score,    weight: COMPOSITE_WEIGHTS.transfers    },
      { score: newCats.expenses.score,     weight: COMPOSITE_WEIGHTS.expenses     },
      { score: newCats.performance.score,  weight: COMPOSITE_WEIGHTS.performance  },
      { score: newCats.electoral.score,    weight: COMPOSITE_WEIGHTS.electoral    },
      { score: newCats.demographics.score, weight: COMPOSITE_WEIGHTS.demographics },
    ]) ?? 50;

    // Recompute duck score with normalized composite
    const NATIONAL_MEDIAN_FEDERAL_TAX = 8500;
    const medianIncome = r.categories.demographics?.medianHouseholdIncome ?? null;
    const estimatedFederalTaxPerCapita = medianIncome != null
      ? (medianIncome * 0.15) / 2.5
      : null;
    const taxIndex = estimatedFederalTaxPerCapita != null
      ? Math.sqrt(estimatedFederalTaxPerCapita / NATIONAL_MEDIAN_FEDERAL_TAX) * 100
      : 100;
    const duckScore = Math.min(100, Math.round(composite * 100 / taxIndex));

    return { ...r, categories: newCats, composite, grade: toGrade(composite), duckScore, duckGrade: toGrade(duckScore) };
  });
}

// ─── NATIONAL SUMMARY ────────────────────────────────────────────────────────
function buildRidingsSummary(scoredRidings) {
  const avg = arr => {
    const valid = arr.filter(v => v != null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
  };

  const sorted = [...scoredRidings].sort((a, b) => b.composite - a.composite);

  // Party breakdown
  const partyStats = {};
  for (const r of scoredRidings) {
    const party = r.mpParty || 'Unknown';
    if (!partyStats[party]) partyStats[party] = { count: 0, composites: [] };
    partyStats[party].count++;
    partyStats[party].composites.push(r.composite);
  }
  for (const p of Object.keys(partyStats)) {
    partyStats[p].avgComposite = avg(partyStats[p].composites);
    delete partyStats[p].composites;
  }

  return {
    totalRidings:     scoredRidings.length,
    avgComposite:     avg(scoredRidings.map(r => r.composite)),
    avgPerformance:   avg(scoredRidings.map(r => r.categories.performance.score)),
    avgInvestment:    avg(scoredRidings.map(r => r.categories.investment.score)),
    avgElectoral:     avg(scoredRidings.map(r => r.categories.electoral.score)),
    avgDemographics:  avg(scoredRidings.map(r => r.categories.demographics.score)),
    avgExpenses:      avg(scoredRidings.map(r => r.categories.expenses.score)),
    avgTransfers:     avg(scoredRidings.map(r => r.categories.transfers.score)),
    topRiding:        sorted[0]?.ridingCode ?? null,
    bottomRiding:     sorted[sorted.length - 1]?.ridingCode ?? null,
    partyStats,
    avgTurnout: avg(scoredRidings.map(r => r.categories.electoral.voterTurnoutPct)),
  };
}

module.exports = { scoreRiding, normalizeRidingScores, buildRidingsSummary, toGrade };
