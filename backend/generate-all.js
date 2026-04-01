#!/usr/bin/env node
/**
 * Data generator — reads from MySQL, scores everything, outputs static JSON.
 *
 * Outputs:
 *   ../api/data.json   — provinces scorecard
 *   ../api/cities.json  — cities scorecard
 *   ../api/mps.json     — MPs/ridings scorecard
 *   ../frontend/src/data/fallback.json — provinces fallback for SSR
 *
 * Usage (local):   node generate-all.js
 * Usage (CI):      triggered by .github/workflows/refresh-data.yml
 *
 * Environment vars:
 *   MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 *   (or DATABASE_URL for backwards compat)
 */

const path = require('path');
const fs   = require('fs');

try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch {}

const { scoreProvince, normalizeCategoryScores, buildNationalSummary } = require('./scoring');
const { scoreCity, normalizeCityScores, buildCitiesSummary } = require('./scoring-cities');
const { scoreRiding, normalizeRidingScores, buildRidingsSummary } = require('./scoring-mps');

// ─── MySQL connection ────────────────────────────────────────────────────────
async function getDB() {
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({
    host:     process.env.MYSQL_HOST     || 'localhost',
    user:     process.env.MYSQL_USER     || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bangforyourduck',
    charset:  'utf8mb4',
    decimalNumbers: true,
  });
  return conn;
}

// Helper: fetch all rows from a table, indexed by a key column
async function fetchAll(db, table) {
  const [rows] = await db.query(`SELECT * FROM \`${table}\``);
  return rows;
}

function byCode(rows, key) {
  return rows.reduce((acc, row) => { acc[row[key]] = row; return acc; }, {});
}

function byCodeMulti(rows, key) {
  return rows.reduce((acc, row) => {
    if (!acc[row[key]]) acc[row[key]] = [];
    acc[row[key]].push(row);
    return acc;
  }, {});
}

// ─── Generate Provinces ──────────────────────────────────────────────────────
async function generateProvinces(db) {
  console.log('[provinces] Fetching data...');
  const [meta, healthcare, housing, credit, polling, governance, infrastructure,
         supporters, education, taxes, safety, statscan, costOfLiving,
         mentalHealth, ltcData, fiscalData] = await Promise.all([
    fetchAll(db, 'provinces_meta'),
    fetchAll(db, 'provinces_healthcare'),
    fetchAll(db, 'provinces_housing'),
    fetchAll(db, 'provinces_credit'),
    fetchAll(db, 'provinces_polling'),
    fetchAll(db, 'provinces_governance'),
    fetchAll(db, 'infrastructure_projects'),
    fetchAll(db, 'supporters'),
    fetchAll(db, 'provinces_education'),
    fetchAll(db, 'provinces_tax'),
    fetchAll(db, 'provinces_safety'),
    fetchAll(db, 'provinces_statscan'),
    fetchAll(db, 'provinces_cost_of_living'),
    fetchAll(db, 'provinces_mental_health'),
    fetchAll(db, 'provinces_ltc'),
    fetchAll(db, 'provinces_fiscal'),
  ]);

  const data = {
    meta,
    healthcare:     byCode(healthcare, 'province_code'),
    housing:        byCode(housing, 'province_code'),
    credit:         byCode(credit, 'province_code'),
    polling:        byCode(polling, 'province_code'),
    governance:     byCode(governance, 'province_code'),
    infrastructure: byCodeMulti(infrastructure, 'province_code'),
    supporters,
    education:      byCode(education, 'province_code'),
    taxes:          byCode(taxes, 'province_code'),
    safety:         byCode(safety, 'province_code'),
    statscan:       byCode(statscan, 'province_code'),
    costOfLiving:   byCode(costOfLiving, 'province_code'),
    mentalHealth:   byCode(mentalHealth, 'province_code'),
    ltc:            byCode(ltcData, 'province_code'),
    fiscal:         byCode(fiscalData, 'province_code'),
  };

  const rawScored = data.meta.map(meta => {
    const code = meta.province_code;
    return scoreProvince({
      meta,
      healthcare:     data.healthcare[code]     ?? null,
      housing:        data.housing[code]         ?? null,
      credit:         data.credit[code]          ?? null,
      polling:        data.polling[code]         ?? null,
      governance:     data.governance[code]      ?? null,
      infrastructure: data.infrastructure[code]  ?? [],
      education:      data.education[code]       ?? null,
      taxes:          data.taxes[code]           ?? null,
      safety:         data.safety[code]          ?? null,
      statscan:       data.statscan[code]         ?? null,
      costOfLiving:   data.costOfLiving[code]     ?? null,
      mentalHealth:   data.mentalHealth[code]     ?? null,
      ltc:            data.ltc[code]              ?? null,
      fiscal:         data.fiscal[code]           ?? null,
    });
  });

  const scoredProvinces = normalizeCategoryScores(rawScored);
  const payload = {
    lastUpdated: new Date().toISOString(),
    national:    buildNationalSummary(scoredProvinces),
    provinces:   scoredProvinces,
    supporters:  data.supporters ?? [],
  };

  console.log(`[provinces] ✓ ${scoredProvinces.length} provinces scored`);
  return payload;
}

// ─── Generate Cities ─────────────────────────────────────────────────────────
async function generateCities(db) {
  console.log('[cities] Fetching data...');
  const [meta, housing, safety, fiscal, liveability, economic, community, infrastructure] = await Promise.all([
    fetchAll(db, 'cities_meta'),
    fetchAll(db, 'cities_housing'),
    fetchAll(db, 'cities_safety'),
    fetchAll(db, 'cities_fiscal'),
    fetchAll(db, 'cities_liveability'),
    fetchAll(db, 'cities_economic'),
    fetchAll(db, 'cities_community'),
    fetchAll(db, 'cities_infrastructure_projects'),
  ]);

  const data = {
    meta,
    housing:        byCode(housing, 'cma_code'),
    safety:         byCode(safety, 'cma_code'),
    fiscal:         byCode(fiscal, 'cma_code'),
    liveability:    byCode(liveability, 'cma_code'),
    economic:       byCode(economic, 'cma_code'),
    community:      byCode(community, 'cma_code'),
    infrastructure: byCodeMulti(infrastructure, 'cma_code'),
  };

  const rawScored = data.meta.map(meta => {
    const code = meta.cma_code;
    return scoreCity({
      meta,
      housing:        data.housing[code]        ?? null,
      safety:         data.safety[code]         ?? null,
      fiscal:         data.fiscal[code]         ?? null,
      liveability:    data.liveability[code]    ?? null,
      economic:       data.economic[code]       ?? null,
      community:      data.community[code]      ?? null,
      infrastructure: data.infrastructure[code] ?? [],
    });
  });

  const scoredCities = normalizeCityScores(rawScored);
  const payload = {
    lastUpdated: new Date().toISOString(),
    national:    buildCitiesSummary(scoredCities),
    cities:      scoredCities,
  };

  console.log(`[cities] ✓ ${scoredCities.length} cities scored`);
  return payload;
}

// ─── Generate MPs ────────────────────────────────────────────────────────────
async function generateMPs(db) {
  console.log('[mps] Fetching data...');
  const [meta, performance, investment, electoral, demographics, expenses, transfers] = await Promise.all([
    fetchAll(db, 'ridings_meta'),
    fetchAll(db, 'ridings_mp_performance'),
    fetchAll(db, 'ridings_federal_investment'),
    fetchAll(db, 'ridings_electoral'),
    fetchAll(db, 'ridings_demographics'),
    fetchAll(db, 'ridings_mp_expenses'),
    fetchAll(db, 'ridings_federal_transfers'),
  ]);

  const data = {
    meta,
    performance:  byCode(performance, 'riding_code'),
    investment:   byCode(investment, 'riding_code'),
    electoral:    byCode(electoral, 'riding_code'),
    demographics: byCode(demographics, 'riding_code'),
    expenses:     byCode(expenses, 'riding_code'),
    transfers:    byCode(transfers, 'riding_code'),
  };

  const rawScored = data.meta.map(meta => {
    const code = meta.riding_code;
    return scoreRiding({
      meta,
      performance:  data.performance[code]  ?? null,
      investment:   data.investment[code]   ?? null,
      electoral:    data.electoral[code]    ?? null,
      demographics: data.demographics[code] ?? null,
      expenses:     data.expenses[code]     ?? null,
      transfers:    data.transfers[code]    ?? null,
    });
  });

  const scoredRidings = normalizeRidingScores(rawScored);
  const payload = {
    lastUpdated: new Date().toISOString(),
    national:    buildRidingsSummary(scoredRidings),
    ridings:     scoredRidings,
  };

  console.log(`[mps] ✓ ${scoredRidings.length} ridings scored`);
  return payload;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const db = await getDB();
  console.log('[generate-all] Connected to MySQL\n');

  const [provinces, cities, mps] = await Promise.all([
    generateProvinces(db),
    generateCities(db),
    generateMPs(db),
  ]);

  // Write API JSON files
  const apiDir = path.join(__dirname, '..', 'api');
  fs.mkdirSync(apiDir, { recursive: true });

  fs.writeFileSync(path.join(apiDir, 'data.json'), JSON.stringify(provinces));
  fs.writeFileSync(path.join(apiDir, 'cities.json'), JSON.stringify(cities));
  fs.writeFileSync(path.join(apiDir, 'mps.json'), JSON.stringify(mps));

  // Also write provinces fallback for SSR
  const fallbackDir = path.join(__dirname, '..', 'frontend', 'src', 'data');
  fs.mkdirSync(fallbackDir, { recursive: true });
  fs.writeFileSync(path.join(fallbackDir, 'fallback.json'), JSON.stringify(provinces, null, 2));

  console.log('\n[generate-all] ✓ api/data.json    (' + (JSON.stringify(provinces).length / 1024).toFixed(0) + ' KB)');
  console.log('[generate-all] ✓ api/cities.json  (' + (JSON.stringify(cities).length / 1024).toFixed(0) + ' KB)');
  console.log('[generate-all] ✓ api/mps.json     (' + (JSON.stringify(mps).length / 1024).toFixed(0) + ' KB)');
  console.log('[generate-all] ✓ fallback.json    (provinces)');

  await db.end();
}

main().catch(err => {
  console.error('[generate-all] Fatal:', err.message);
  process.exit(1);
});
