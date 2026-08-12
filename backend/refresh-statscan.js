#!/usr/bin/env node
/**
 * refresh-statscan.js — Fetch latest data from Statistics Canada WDS API
 * and upsert it into the MySQL database.
 *
 * Run by the daily GitHub Actions workflow BEFORE generate-all.js so the
 * scoring engine picks up the freshest numbers.
 *
 * Tables fetched:
 *   14-10-0287-01  Provincial unemployment rate (monthly, seasonally adjusted)
 *   36-10-0222-01  Provincial GDP at market prices (annual, chained 2017 $)
 *   17-10-0009-01  Provincial population estimates (quarterly)
 *   35-10-0026-01  Crime Severity Index (annual)
 *   35-10-0068-01  Homicide rate per 100,000 population (annual)
 *   18-10-0004-01  CPI — food index, used as a grocery cost-of-living proxy (monthly)
 *   10-10-0017-01  Provincial government finance (GFS) — revenue, expense, net worth (annual)
 *   34-10-0135-01  Housing starts (quarterly)
 *   18-10-0205-01  New Housing Price Index (monthly)
 *   18-10-0004-01  CPI — rent index (monthly)
 *
 * IMPORTANT: The WDS batch API does NOT guarantee response order matches
 * request order — responses are re-sorted by coordinate. Every fetch
 * function parses the coordinate from each response to identify the
 * province, never relies on array position.
 *
 * Gracefully degrades: if any StatsCan fetch fails, it logs a warning and
 * continues — the pipeline never breaks because StatsCan is down.
 *
 * Frequency:
 *   Daily:  unemployment, CPI food, rent CPI, housing starts (monthly releases)
 *   Monday: GDP, population, CSI, homicide, fiscal, NHPI (annual/quarterly)
 *
 * Usage:
 *   node refresh-statscan.js              # upsert into MySQL (daily tables only)
 *   node refresh-statscan.js --full       # upsert all tables (same as Monday)
 *   node refresh-statscan.js --dry-run    # print what would be written
 */

const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch {}

const axios = require('axios');

const DRY_RUN = process.argv.includes('--dry-run');
const FULL_RUN = process.argv.includes('--full') || new Date().getDay() === 1; // Mondays or --full flag

// ─── StatsCan WDS API ────────────────────────────────────────────────────────
const WDS_BASE = 'https://www150.statcan.gc.ca/t1/wds/rest';

// Geography member IDs → our province codes (same across all three tables)
const GEO_TO_PROV = {
  2: 'NL', 3: 'PE', 4: 'NS', 5: 'NB',
  6: 'QC', 7: 'ON', 8: 'MB', 9: 'SK', 10: 'AB', 11: 'BC',
};

const PROVINCE_CODES = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL'];

/**
 * Batch fetch from StatsCan WDS getDataFromCubePidCoordAndLatestNPeriods.
 * Returns the raw response array on success, null on failure.
 */
async function wdsBatchFetch(requests) {
  try {
    const resp = await axios.post(
      `${WDS_BASE}/getDataFromCubePidCoordAndLatestNPeriods`,
      requests,
      { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
    );
    return resp.data;
  } catch (err) {
    console.warn(`  WDS batch fetch failed: ${err.message}`);
    return null;
  }
}

/**
 * Parse the geography member ID from a WDS response coordinate string.
 * Coordinate format: "geo.dim2.dim3.0.0.0.0.0.0.0"
 */
function geoFromCoordinate(coord) {
  if (!coord) return null;
  const first = parseInt(coord.split('.')[0], 10);
  return isNaN(first) ? null : first;
}

// ─── Fetch unemployment (monthly, seasonally adjusted) ──────────────────────
async function fetchUnemployment() {
  console.log('  Fetching unemployment rates (14-10-0287-01)...');

  // Build batch: geo 1–11, characteristic=7 (unemployment rate),
  // gender=1 (total), age=1 (15+), stat=1 (estimate), type=1 (seasonally adjusted)
  const requests = [];
  for (let geo = 1; geo <= 11; geo++) {
    requests.push({
      productId: 14100287,
      coordinate: `${geo}.7.1.1.1.1.0.0.0.0`,
      latestN: 1,
    });
  }

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  let nationalRate = null;

  // First pass: find Canada's rate for delta calculation
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    if (geo !== 1) continue;
    const pts = item.object?.vectorDataPoint ?? [];
    if (pts.length) nationalRate = parseFloat(pts[0].value);
  }

  // Second pass: extract provincial rates
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = GEO_TO_PROV[geo];
    if (!code) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const rate = parseFloat(pts[0].value);
    if (isNaN(rate)) continue;

    results[code] = {
      unemployment_rate: rate,
      unemployment_delta_from_national: nationalRate != null
        ? Math.round((rate - nationalRate) * 10) / 10
        : null,
      unemployment_ref_per: pts[0].refPer,
    };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ Unemployment: ${count} provinces (e.g. ${sample[0]}: ${sample[1].unemployment_rate}%, ${sample[1].unemployment_ref_per})`);
  }
  return results;
}

// ─── Fetch GDP growth (annual, chained 2017 dollars) ────────────────────────
async function fetchGDP() {
  console.log('  Fetching GDP (36-10-0222-01)...');

  // GDP at market prices: prices=1 (chained 2017$), estimates=38
  // Need 2 periods to compute YoY growth
  const requests = [];
  for (let geo = 1; geo <= 11; geo++) {
    requests.push({
      productId: 36100222,
      coordinate: `${geo}.1.38.0.0.0.0.0.0.0`,
      latestN: 2,
    });
  }

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  let nationalGrowth = null;

  // First pass: compute Canada's GDP growth
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    if (geo !== 1) continue;
    const pts = item.object?.vectorDataPoint ?? [];
    nationalGrowth = computeGrowth(pts);
  }

  // Second pass: provincial GDP growth
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = GEO_TO_PROV[geo];
    if (!code) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    const growth = computeGrowth(pts);
    if (growth === null) continue;

    const latestGdp = parseFloat(pts[0]?.value);

    results[code] = {
      gdp_growth_pct: growth,
      gdp_growth_delta_from_national: nationalGrowth != null
        ? Math.round((growth - nationalGrowth) * 10) / 10
        : null,
      gdp_ref_per: pts[0]?.refPer,
      gdp_value: isNaN(latestGdp) ? null : latestGdp,
    };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ GDP: ${count} provinces (e.g. ${sample[0]}: ${sample[1].gdp_growth_pct}%, ${sample[1].gdp_ref_per})`);
  }
  return results;
}

function computeGrowth(pts) {
  if (!pts || pts.length < 2) return null;
  const latest = parseFloat(pts[0]?.value);
  const prev = parseFloat(pts[1]?.value);
  if (isNaN(latest) || isNaN(prev) || prev === 0) return null;
  return Math.round(((latest - prev) / prev) * 1000) / 10;
}

/**
 * Compute year-over-year % change from a 13-period vectorDataPoint array
 * (WDS returns points newest-first: pts[0] = latest, pts[12] = 12 periods
 * ago — i.e. the same month/quarter one year earlier for monthly/quarterly
 * series). Compares the first and last points in the array.
 */
function computeYoY(pts) {
  if (!pts || pts.length < 2) return null;
  const latest = parseFloat(pts[0]?.value);
  const yearAgo = parseFloat(pts[pts.length - 1]?.value);
  if (isNaN(latest) || isNaN(yearAgo) || yearAgo === 0) return null;
  return Math.round(((latest - yearAgo) / yearAgo) * 1000) / 10;
}

// ─── Fetch population (quarterly) ───────────────────────────────────────────
async function fetchPopulation() {
  console.log('  Fetching population (17-10-0009-01)...');

  // 1 dimension (geography), padded to 10
  const requests = [];
  for (let geo = 1; geo <= 11; geo++) {
    requests.push({
      productId: 17100009,
      coordinate: `${geo}.0.0.0.0.0.0.0.0.0`,
      latestN: 1,
    });
  }

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};

  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = GEO_TO_PROV[geo];
    if (!code) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const pop = parseFloat(pts[0].value);
    if (isNaN(pop)) continue;

    results[code] = {
      population: Math.round(pop),
      population_ref_per: pts[0].refPer,
    };
  }

  const count = Object.keys(results).length;
  console.log(`  ✓ Population: ${count} provinces`);
  return results;
}

// ─── Fetch Crime Severity Index (annual) ────────────────────────────────────
// Table 35-10-0026-01: dims = Geography, Statistics. Geography member IDs
// differ from the unemployment/GDP/population tables above — mapped locally.
const CSI_GEO_TO_PROV = {
  1: 'CANADA', 2: 'NL', 4: 'PE', 5: 'NS', 7: 'NB',
  9: 'QC', 16: 'ON', 28: 'MB', 30: 'SK', 33: 'AB', 36: 'BC',
};

async function fetchCSI() {
  console.log('  Fetching Crime Severity Index (35-10-0026-01)...');

  // Statistics member 1 = "Crime severity index"
  const requests = Object.keys(CSI_GEO_TO_PROV).map(geo => ({
    productId: 35100026,
    coordinate: `${geo}.1.0.0.0.0.0.0.0.0`,
    latestN: 1,
  }));

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = CSI_GEO_TO_PROV[geo];
    if (!code || code === 'CANADA') continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const csi = parseFloat(pts[0].value);
    if (isNaN(csi)) continue;

    results[code] = { csi_value: csi, csi_ref_per: pts[0].refPer };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ CSI: ${count} provinces (e.g. ${sample[0]}: ${sample[1].csi_value}, ${sample[1].csi_ref_per})`);
  }
  return results;
}

// ─── Fetch homicide rate (annual) ───────────────────────────────────────────
// Table 35-10-0068-01: dims = Geography, Homicides. Geography member IDs
// match the unemployment/GDP/population tables (1=Canada, 2..11=provinces).
const HOMICIDE_GEO_TO_PROV = {
  1: 'CANADA', 2: 'NL', 3: 'PE', 4: 'NS', 5: 'NB',
  6: 'QC', 7: 'ON', 8: 'MB', 9: 'SK', 10: 'AB', 11: 'BC',
};

async function fetchHomicide() {
  console.log('  Fetching homicide rate (35-10-0068-01)...');

  // Homicides member 2 = "Homicide rates per 100,000 population"
  const requests = Object.keys(HOMICIDE_GEO_TO_PROV).map(geo => ({
    productId: 35100068,
    coordinate: `${geo}.2.0.0.0.0.0.0.0.0`,
    latestN: 1,
  }));

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = HOMICIDE_GEO_TO_PROV[geo];
    if (!code || code === 'CANADA') continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const rate = parseFloat(pts[0].value);
    if (isNaN(rate)) continue;

    results[code] = { homicide_rate_per_100k: rate, homicide_ref_per: pts[0].refPer };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ Homicide: ${count} provinces (e.g. ${sample[0]}: ${sample[1].homicide_rate_per_100k}/100k, ${sample[1].homicide_ref_per})`);
  }
  return results;
}

// ─── Fetch CPI food index (monthly, used as grocery cost-of-living proxy) ──
// Table 18-10-0004-01: dims = Geography, Products. Geography member IDs are
// table-specific — mapped locally. Products member 3 = "Food".
const CPI_GEO_TO_PROV = {
  2: 'CANADA', 3: 'NL', 5: 'PE', 7: 'NS', 9: 'NB',
  11: 'QC', 14: 'ON', 18: 'MB', 20: 'SK', 23: 'AB', 26: 'BC',
};

async function fetchCPI() {
  console.log('  Fetching CPI food index (18-10-0004-01)...');

  // latestN=2 so we can also report the period-over-period change alongside
  // the relative grocery index.
  const requests = Object.keys(CPI_GEO_TO_PROV).map(geo => ({
    productId: 18100004,
    coordinate: `${geo}.3.0.0.0.0.0.0.0.0`,
    latestN: 2,
  }));

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  // First pass: find Canada's food CPI so we can compute each province's
  // grocery index relative to the national figure.
  let nationalFoodCpi = null;
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    if (CPI_GEO_TO_PROV[geo] !== 'CANADA') continue;
    const pts = item.object?.vectorDataPoint ?? [];
    if (pts.length) nationalFoodCpi = parseFloat(pts[0].value);
  }

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = CPI_GEO_TO_PROV[geo];
    if (!code || code === 'CANADA') continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const foodCpi = parseFloat(pts[0].value);
    if (isNaN(foodCpi)) continue;
    const foodCpiPrev = pts.length > 1 ? parseFloat(pts[1].value) : null;

    const groceryIndex = (nationalFoodCpi != null && nationalFoodCpi !== 0)
      ? Math.round((foodCpi / nationalFoodCpi) * 1000) / 10
      : null;
    const foodCpiChangePct = (foodCpiPrev != null && !isNaN(foodCpiPrev) && foodCpiPrev !== 0)
      ? Math.round(((foodCpi - foodCpiPrev) / foodCpiPrev) * 1000) / 10
      : null;

    results[code] = {
      food_cpi: foodCpi,
      grocery_index: groceryIndex,
      food_cpi_change_pct: foodCpiChangePct,
      cpi_ref_per: pts[0].refPer,
    };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ CPI: ${count} provinces (e.g. ${sample[0]}: grocery_index=${sample[1].grocery_index}, ${sample[1].cpi_ref_per})`);
  }
  return results;
}

// ─── Fetch provincial government finance (annual, GFS) ──────────────────────
// Table 10-10-0017-01: dims = Geography, Public sector, Display value,
// Statement. Geography member IDs are UNIQUE to this table — no Canada row,
// and a different order than the other tables above.
const FISCAL_GEO = {
  1: 'NL', 2: 'PE', 3: 'NS', 4: 'NB', 5: 'QC',
  6: 'ON', 7: 'MB', 8: 'SK', 9: 'AB', 10: 'BC',
};

// Statement member IDs we need, keyed by our own field name.
// display 1 = Stocks, display 2 = Transactions.
const FISCAL_STATEMENTS = {
  revenue:               { display: 2, statement: 3 },
  expense:                { display: 2, statement: 51 },
  interest_expense:       { display: 2, statement: 55 },
  net_operating_balance:  { display: 2, statement: 2 },
  net_worth:              { display: 1, statement: 86 },
};

async function fetchFiscal() {
  console.log('  Fetching provincial government finance (10-10-0017-01)...');

  const requests = [];
  for (const geo of Object.keys(FISCAL_GEO)) {
    for (const { display, statement } of Object.values(FISCAL_STATEMENTS)) {
      requests.push({
        productId: 10100017,
        coordinate: `${geo}.1.${display}.${statement}.0.0.0.0.0.0`,
        latestN: 1,
      });
    }
  }

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const coord = item.object?.coordinate;
    const geo = geoFromCoordinate(coord);
    const code = FISCAL_GEO[geo];
    if (!code) continue;

    // Identify which statement this is by re-deriving display/statement from
    // the coordinate itself — never trust request order.
    const parts = (coord || '').split('.');
    const display = parseInt(parts[2], 10);
    const statement = parseInt(parts[3], 10);
    const field = Object.entries(FISCAL_STATEMENTS)
      .find(([, v]) => v.display === display && v.statement === statement)?.[0];
    if (!field) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const value = parseFloat(pts[0].value);
    if (isNaN(value)) continue;

    if (!results[code]) results[code] = {};
    results[code][field] = value;
    results[code].fiscal_ref_per = pts[0].refPer;
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ Fiscal: ${count} provinces (e.g. ${sample[0]}: revenue=$${sample[1].revenue}M, ${sample[1].fiscal_ref_per})`);
  }
  return results;
}

// ─── Fetch housing starts (quarterly) ───────────────────────────────────────
// Table 34-10-0135-01: dims = Geography, Housing estimates, Type of unit,
// Seasonal adjustment. Geography 2 (Atlantic) and 9 (Prairie) are region
// aggregates — skipped. Geography member IDs are table-specific.
const HOUSING_STARTS_GEO = {
  3: 'NL', 4: 'PE', 5: 'NS', 6: 'NB', 7: 'QC',
  8: 'ON', 10: 'MB', 11: 'SK', 12: 'AB', 13: 'BC',
};

async function fetchHousingStarts() {
  console.log('  Fetching housing starts (34-10-0135-01)...');

  // Housing estimates=1 (Housing starts), Type of unit=1 (All types),
  // Seasonal adjustment=1 (Unadjusted). latestN=2 so a QoQ figure is
  // available alongside the level we actually use.
  const requests = Object.keys(HOUSING_STARTS_GEO).map(geo => ({
    productId: 34100135,
    coordinate: `${geo}.1.1.1.0.0.0.0.0.0`,
    latestN: 2,
  }));

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = HOUSING_STARTS_GEO[geo];
    if (!code) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const starts = parseFloat(pts[0].value);
    if (isNaN(starts)) continue;

    results[code] = { housing_starts_quarterly: starts, housing_starts_ref_per: pts[0].refPer };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ Housing starts: ${count} provinces (e.g. ${sample[0]}: ${sample[1].housing_starts_quarterly} units/qtr, ${sample[1].housing_starts_ref_per})`);
  }
  return results;
}

// ─── Fetch New Housing Price Index (monthly) ────────────────────────────────
// Table 18-10-0205-01: dims = Geography, NHPI type. NHPI type 1 = "Total
// (house and land)". Geography member IDs are table-specific.
const NHPI_GEO = {
  1: null, 3: 'NL', 5: 'PE', 7: 'NS', 9: 'NB', 11: 'QC',
  17: 'ON', 29: 'MB', 31: 'SK', 34: 'AB', 37: 'BC',
};

async function fetchNHPI() {
  console.log('  Fetching New Housing Price Index (18-10-0205-01)...');

  // latestN=13 so we can compute YoY (compare latest vs. 12 months prior).
  const requests = Object.keys(NHPI_GEO).map(geo => ({
    productId: 18100205,
    coordinate: `${geo}.1.0.0.0.0.0.0.0.0`,
    latestN: 13,
  }));

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = NHPI_GEO[geo];
    if (!code) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    const yoy = computeYoY(pts);
    if (yoy === null) continue;

    results[code] = { nhpi_yoy_pct: yoy, nhpi_ref_per: pts[0]?.refPer };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ NHPI: ${count} provinces (e.g. ${sample[0]}: yoy=${sample[1].nhpi_yoy_pct}%, ${sample[1].nhpi_ref_per})`);
  }
  return results;
}

// ─── Fetch CPI rent index (monthly) ─────────────────────────────────────────
// Table 18-10-0004-01: same geography mapping as the food CPI fetch above.
// Products member 81 = "Rent".
async function fetchRentCPI() {
  console.log('  Fetching CPI rent index (18-10-0004-01)...');

  // latestN=13 so we can compute YoY.
  const requests = Object.keys(CPI_GEO_TO_PROV).map(geo => ({
    productId: 18100004,
    coordinate: `${geo}.81.0.0.0.0.0.0.0.0`,
    latestN: 13,
  }));

  const data = await wdsBatchFetch(requests);
  if (!data) return {};

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    const code = CPI_GEO_TO_PROV[geo];
    if (!code || code === 'CANADA') continue;

    const pts = item.object?.vectorDataPoint ?? [];
    const yoy = computeYoY(pts);
    if (yoy === null) continue;

    results[code] = { rent_cpi_yoy_pct: yoy, rent_cpi_ref_per: pts[0]?.refPer };
  }

  const count = Object.keys(results).length;
  const sample = Object.entries(results)[0];
  if (sample) {
    console.log(`  ✓ Rent CPI: ${count} provinces (e.g. ${sample[0]}: yoy=${sample[1].rent_cpi_yoy_pct}%, ${sample[1].rent_cpi_ref_per})`);
  }
  return results;
}

// ─── MySQL upsert ───────────────────────────────────────────────────────────
async function upsertToMySQL(conn, merged) {
  let updated = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const code of PROVINCE_CODES) {
    const d = merged[code];
    if (!d) continue;

    const sourceNotes = [
      d.unemployment_rate != null ? `Unemployment ${d.unemployment_rate}% (${d.unemployment_ref_per || '?'})` : null,
      d.gdp_growth_pct != null ? `GDP growth ${d.gdp_growth_pct}% (${d.gdp_ref_per || '?'})` : null,
    ].filter(Boolean).join('; ');

    // Check if row exists
    const [rows] = await conn.query(
      'SELECT id FROM provinces_statscan WHERE province_code = ?',
      [code]
    );

    if (rows.length > 0) {
      // Update existing row — only overwrite fields we have fresh data for
      const sets = [];
      const vals = [];

      if (d.unemployment_rate != null) {
        sets.push('unemployment_rate = ?', 'unemployment_delta_from_national = ?');
        vals.push(d.unemployment_rate, d.unemployment_delta_from_national);
      }
      if (d.gdp_growth_pct != null) {
        sets.push('gdp_growth_pct = ?', 'gdp_growth_delta_from_national = ?');
        vals.push(d.gdp_growth_pct, d.gdp_growth_delta_from_national);
      }

      if (sets.length > 0) {
        sets.push('source_notes = ?', 'data_date = ?');
        vals.push(`StatsCan WDS auto-refresh ${today}. ${sourceNotes}`, today);
        vals.push(rows[0].id);

        await conn.query(
          `UPDATE provinces_statscan SET ${sets.join(', ')} WHERE id = ?`,
          vals
        );
        updated++;
      }
    } else {
      // Insert new row
      await conn.query(
        `INSERT INTO provinces_statscan
          (province_code, unemployment_rate, unemployment_delta_from_national,
           gdp_growth_pct, gdp_growth_delta_from_national,
           source_notes, data_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          d.unemployment_rate,
          d.unemployment_delta_from_national,
          d.gdp_growth_pct,
          d.gdp_growth_delta_from_national,
          `StatsCan WDS auto-refresh ${today}. ${sourceNotes}`,
          today,
        ]
      );
      updated++;
    }
  }

  return updated;
}

// ─── MySQL upsert: provinces_safety ─────────────────────────────────────────
// safetyData[code] = { csi_value, csi_ref_per, homicide_rate_per_100k, homicide_ref_per }
// CSI doesn't map directly to victimization_rate_per_1000, but it's the best
// available annual proxy — the scoring BOUNDS (best: 55, worst: 175) align
// with the CSI's typical range.
async function upsertSafety(conn, safetyData) {
  let updated = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const code of PROVINCE_CODES) {
    const d = safetyData[code];
    if (!d) continue;

    const sourceNotes = [
      d.csi_value != null ? `Crime Severity Index ${d.csi_value} (${d.csi_ref_per || '?'})` : null,
      d.homicide_rate_per_100k != null ? `Homicide rate ${d.homicide_rate_per_100k}/100k (${d.homicide_ref_per || '?'})` : null,
    ].filter(Boolean).join('; ');
    if (!sourceNotes) continue;

    const [rows] = await conn.query(
      'SELECT id FROM provinces_safety WHERE province_code = ?',
      [code]
    );

    if (rows.length > 0) {
      const sets = [];
      const vals = [];

      if (d.csi_value != null) {
        sets.push('victimization_rate_per_1000 = ?');
        vals.push(d.csi_value);
      }
      if (d.homicide_rate_per_100k != null) {
        sets.push('homicide_rate_per_100k = ?');
        vals.push(d.homicide_rate_per_100k);
      }

      if (sets.length > 0) {
        sets.push('source_notes = ?', 'data_date = ?');
        vals.push(`StatsCan WDS auto-refresh ${today}. ${sourceNotes}`, today);
        vals.push(rows[0].id);

        await conn.query(
          `UPDATE provinces_safety SET ${sets.join(', ')} WHERE id = ?`,
          vals
        );
        updated++;
      }
    } else {
      await conn.query(
        `INSERT INTO provinces_safety
          (province_code, victimization_rate_per_1000, homicide_rate_per_100k, source_notes, data_date)
         VALUES (?, ?, ?, ?, ?)`,
        [
          code,
          d.csi_value ?? null,
          d.homicide_rate_per_100k ?? null,
          `StatsCan WDS auto-refresh ${today}. ${sourceNotes}`,
          today,
        ]
      );
      updated++;
    }
  }

  return updated;
}

// ─── MySQL upsert: provinces_cost_of_living ─────────────────────────────────
// cpiData[code] = { food_cpi, grocery_index, food_cpi_change_pct, cpi_ref_per }
async function upsertCostOfLiving(conn, cpiData) {
  let updated = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const code of PROVINCE_CODES) {
    const d = cpiData[code];
    if (!d || d.grocery_index == null) continue;

    const sourceNotes = [
      `Grocery index ${d.grocery_index} (relative food CPI, ${d.cpi_ref_per || '?'})`,
      d.food_cpi_change_pct != null ? `Food CPI change ${d.food_cpi_change_pct}%` : null,
    ].filter(Boolean).join('; ');

    const [rows] = await conn.query(
      'SELECT id FROM provinces_cost_of_living WHERE province_code = ?',
      [code]
    );

    if (rows.length > 0) {
      await conn.query(
        `UPDATE provinces_cost_of_living SET grocery_index = ?, source_notes = ?, data_date = ? WHERE id = ?`,
        [d.grocery_index, `StatsCan WDS auto-refresh ${today}. ${sourceNotes}`, today, rows[0].id]
      );
      updated++;
    } else {
      await conn.query(
        `INSERT INTO provinces_cost_of_living
          (province_code, grocery_index, source_notes, data_date)
         VALUES (?, ?, ?, ?)`,
        [code, d.grocery_index, `StatsCan WDS auto-refresh ${today}. ${sourceNotes}`, today]
      );
      updated++;
    }
  }

  return updated;
}

// ─── MySQL upsert: provinces_fiscal ─────────────────────────────────────────
// fiscalData[code] = { revenue, expense, interest_expense, net_operating_balance, net_worth, fiscal_ref_per }
// (all in millions CAD, from the GFS fiscal table)
// gdpData[code].gdp_value = latest annual GDP, also in millions CAD
// populationData[code].population = latest quarterly population estimate
async function upsertFiscal(conn, fiscalData, gdpData, populationData) {
  let updated = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const code of PROVINCE_CODES) {
    const f = fiscalData[code];
    if (!f) continue;

    const gdpValue = gdpData[code]?.gdp_value;
    const population = populationData[code]?.population;

    const budgetBalancePctGdp = (f.net_operating_balance != null && gdpValue != null && gdpValue !== 0)
      ? Math.round((f.net_operating_balance / gdpValue) * 1000) / 10
      : null;
    const debtInterestCentsPerDollar = (f.interest_expense != null && f.revenue != null && f.revenue !== 0)
      ? Math.round((f.interest_expense / f.revenue) * 1000) / 10
      : null;
    // Net worth is negative when liabilities exceed assets — that magnitude
    // is net debt, stored as a positive per-capita figure. A handful of
    // provinces (e.g. AB, thanks to the Heritage Fund) carry a POSITIVE net
    // worth — a net asset position, not debt — so those map to zero net
    // debt rather than inflating into a huge phantom "debt" via abs().
    const netDebtPerCapita = (f.net_worth != null && population != null && population !== 0)
      ? Math.round((Math.max(0, -f.net_worth) * 1000000 / population) * 100) / 100
      : null;

    const sourceNotes = [
      f.revenue != null ? `Revenue $${f.revenue}M` : null,
      f.expense != null ? `Expense $${f.expense}M` : null,
      f.net_worth != null ? `Net worth $${f.net_worth}M` : null,
      f.fiscal_ref_per ? `(${f.fiscal_ref_per})` : null,
    ].filter(Boolean).join('; ');
    if (!sourceNotes) continue;

    const [rows] = await conn.query(
      'SELECT id FROM provinces_fiscal WHERE province_code = ?',
      [code]
    );

    if (rows.length > 0) {
      const sets = [];
      const vals = [];

      if (budgetBalancePctGdp != null) {
        sets.push('budget_balance_pct_gdp = ?');
        vals.push(budgetBalancePctGdp);
      }
      if (debtInterestCentsPerDollar != null) {
        sets.push('debt_interest_cents_per_dollar = ?');
        vals.push(debtInterestCentsPerDollar);
      }
      if (netDebtPerCapita != null) {
        sets.push('net_debt_per_capita = ?');
        vals.push(netDebtPerCapita);
      }

      if (sets.length > 0) {
        sets.push('source_notes = ?', 'data_date = ?');
        vals.push(`StatsCan WDS auto-refresh ${today}. ${sourceNotes}`, today);
        vals.push(rows[0].id);

        await conn.query(
          `UPDATE provinces_fiscal SET ${sets.join(', ')} WHERE id = ?`,
          vals
        );
        updated++;
      }
    } else {
      await conn.query(
        `INSERT INTO provinces_fiscal
          (province_code, budget_balance_pct_gdp, debt_interest_cents_per_dollar, net_debt_per_capita, source_notes, data_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          code,
          budgetBalancePctGdp,
          debtInterestCentsPerDollar,
          netDebtPerCapita,
          `StatsCan WDS auto-refresh ${today}. ${sourceNotes}`,
          today,
        ]
      );
      updated++;
    }
  }

  return updated;
}

// ─── MySQL upsert: provinces_housing ────────────────────────────────────────
// housingData[code] = { mls_hpi_yoy_pct, housing_starts_per_1000_growth,
//   rent_inflation_pct, ...raw fields/ref periods used only for source notes }
// Only touches the three auto-refreshed columns — leaves mls_hpi_benchmark
// and core_housing_need_pct (manual sources) untouched.
async function upsertHousing(conn, housingData) {
  let updated = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const code of PROVINCE_CODES) {
    const d = housingData[code];
    if (!d) continue;

    const sourceNotes = [
      d.housing_starts_quarterly != null ? `Housing starts ${d.housing_starts_quarterly} units/qtr (${d.housing_starts_ref_per || '?'})` : null,
      d.mls_hpi_yoy_pct != null ? `NHPI YoY ${d.mls_hpi_yoy_pct}% (${d.nhpi_ref_per || '?'})` : null,
      d.rent_inflation_pct != null ? `Rent CPI YoY ${d.rent_inflation_pct}% (${d.rent_cpi_ref_per || '?'})` : null,
    ].filter(Boolean).join('; ');
    if (!sourceNotes) continue;

    const [rows] = await conn.query(
      'SELECT id FROM provinces_housing WHERE province_code = ?',
      [code]
    );

    if (rows.length > 0) {
      const sets = [];
      const vals = [];

      if (d.mls_hpi_yoy_pct != null) {
        sets.push('mls_hpi_yoy_pct = ?');
        vals.push(d.mls_hpi_yoy_pct);
      }
      if (d.housing_starts_per_1000_growth != null) {
        sets.push('housing_starts_per_1000_growth = ?');
        vals.push(d.housing_starts_per_1000_growth);
      }
      if (d.rent_inflation_pct != null) {
        sets.push('rent_inflation_pct = ?');
        vals.push(d.rent_inflation_pct);
      }

      if (sets.length > 0) {
        sets.push('source_notes = ?', 'data_date = ?');
        vals.push(`StatsCan WDS auto-refresh ${today}. ${sourceNotes}`, today);
        vals.push(rows[0].id);

        await conn.query(
          `UPDATE provinces_housing SET ${sets.join(', ')} WHERE id = ?`,
          vals
        );
        updated++;
      }
    } else {
      await conn.query(
        `INSERT INTO provinces_housing
          (province_code, mls_hpi_yoy_pct, housing_starts_per_1000_growth, rent_inflation_pct, source_notes, data_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          code,
          d.mls_hpi_yoy_pct ?? null,
          d.housing_starts_per_1000_growth ?? null,
          d.rent_inflation_pct ?? null,
          `StatsCan WDS auto-refresh ${today}. ${sourceNotes}`,
          today,
        ]
      );
      updated++;
    }
  }

  return updated;
}

// Wrapper so a failure in one of the new fetches can never take down the
// whole refresh — logs a warning and degrades to "no data" for that source.
async function safeFetch(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn(`  ${label} fetch failed: ${err.message}`);
    return {};
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== StatsCan Data Refresh ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE (writing to MySQL)'}`);
  console.log(`Scope: ${FULL_RUN ? 'FULL (all tables — Monday or --full)' : 'DAILY (monthly-release tables only)'}\n`);

  // Daily fetches: tables with monthly releases (change frequently)
  const dailyFetches = [
    fetchUnemployment(),
    safeFetch('CPI', fetchCPI),
    safeFetch('Rent CPI', fetchRentCPI),
    safeFetch('Housing starts', fetchHousingStarts),
  ];

  // Weekly fetches: tables with annual/quarterly releases (Mondays or --full)
  const weeklyFetches = FULL_RUN ? [
    fetchGDP(),
    fetchPopulation(),
    safeFetch('CSI', fetchCSI),
    safeFetch('Homicide', fetchHomicide),
    safeFetch('Fiscal', fetchFiscal),
    safeFetch('NHPI', fetchNHPI),
  ] : [
    // Return empty objects so the merge still works
    Promise.resolve({}), Promise.resolve({}), Promise.resolve({}),
    Promise.resolve({}), Promise.resolve({}), Promise.resolve({}),
  ];

  const [
    unemployment, cpi, rentCpi, housingStarts,
    gdp, population, csi, homicide, fiscal, nhpi,
  ] = await Promise.all([...dailyFetches, ...weeklyFetches]);

  // Merge into per-province objects
  const merged = {};
  const safetyData = {};
  const cpiData = {};
  const fiscalData = {};
  const housingData = {};
  for (const code of PROVINCE_CODES) {
    merged[code] = {
      ...(unemployment[code] || {}),
      ...(gdp[code] || {}),
      ...(population[code] || {}),
    };
    safetyData[code] = {
      ...(csi[code] || {}),
      ...(homicide[code] || {}),
    };
    cpiData[code] = { ...(cpi[code] || {}) };
    fiscalData[code] = { ...(fiscal[code] || {}) };

    // Housing: merge the three raw sub-fetches, then compute the derived
    // rates the DB columns actually store.
    const hs = housingStarts[code] || {};
    const nh = nhpi[code] || {};
    const rc = rentCpi[code] || {};
    const pop = population[code]?.population;

    const housingStartsPer1000Growth = (hs.housing_starts_quarterly != null && pop != null && pop !== 0)
      ? Math.round(((hs.housing_starts_quarterly * 4) / (pop / 1000)) * 100) / 100
      : null;

    housingData[code] = {
      ...hs,
      ...nh,
      ...rc,
      mls_hpi_yoy_pct: nh.nhpi_yoy_pct ?? null,
      housing_starts_per_1000_growth: housingStartsPer1000Growth,
      rent_inflation_pct: rc.rent_cpi_yoy_pct ?? null,
    };
  }

  // Show summary
  console.log('\n--- Merged data ---');
  for (const code of PROVINCE_CODES) {
    const d = merged[code];
    const s = safetyData[code];
    const c = cpiData[code];
    const f = fiscalData[code];
    const h = housingData[code];
    const parts = [];
    if (d.unemployment_rate != null) parts.push(`unemp=${d.unemployment_rate}%`);
    if (d.gdp_growth_pct != null)    parts.push(`gdp=${d.gdp_growth_pct}%`);
    if (d.population != null)        parts.push(`pop=${(d.population / 1e6).toFixed(2)}M`);
    if (s.csi_value != null)                parts.push(`csi=${s.csi_value}`);
    if (s.homicide_rate_per_100k != null)   parts.push(`homicide=${s.homicide_rate_per_100k}/100k`);
    if (c.grocery_index != null)            parts.push(`grocery_index=${c.grocery_index}`);
    if (parts.length) {
      console.log(`  ${code}: ${parts.join(', ')}`);
    } else {
      console.log(`  ${code}: (no data)`);
    }

    // Fiscal / housing printed on a second line since they depend on
    // cross-fetch derived metrics (GDP, population) rather than raw values.
    const fParts = [];
    if (f.net_operating_balance != null && d.gdp_value != null && d.gdp_value !== 0) {
      const balPct = Math.round((f.net_operating_balance / d.gdp_value) * 1000) / 10;
      fParts.push(`budget_balance=${balPct}%GDP`);
    }
    if (f.interest_expense != null && f.revenue != null && f.revenue !== 0) {
      const centsPerDollar = Math.round((f.interest_expense / f.revenue) * 1000) / 10;
      fParts.push(`debt_interest=${centsPerDollar}c/$`);
    }
    if (f.net_worth != null && d.population != null && d.population !== 0) {
      const netDebtPerCapita = Math.round((Math.max(0, -f.net_worth) * 1000000 / d.population) * 100) / 100;
      fParts.push(`net_debt_per_capita=$${netDebtPerCapita}`);
    }
    if (h.mls_hpi_yoy_pct != null) fParts.push(`nhpi_yoy=${h.mls_hpi_yoy_pct}%`);
    if (h.housing_starts_per_1000_growth != null) fParts.push(`starts_per_1k=${h.housing_starts_per_1000_growth}`);
    if (h.rent_inflation_pct != null) fParts.push(`rent_yoy=${h.rent_inflation_pct}%`);
    if (fParts.length) {
      console.log(`    ${code} (fiscal/housing): ${fParts.join(', ')}`);
    }
  }

  // Check if we got anything useful
  const hasData = PROVINCE_CODES.some(c =>
    merged[c].unemployment_rate != null || merged[c].gdp_growth_pct != null
  );
  if (!hasData) {
    console.log('\n⚠ No data fetched from StatsCan — skipping DB update.');
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log('\n🏁 Dry run complete — no database changes made.');
    process.exit(0);
  }

  // Upsert to MySQL — share one connection across all three tables
  console.log('\nWriting to MySQL...');
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({
    host:     process.env.MYSQL_HOST     || 'localhost',
    user:     process.env.MYSQL_USER     || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bangforyourduck',
    charset:  'utf8mb4',
    decimalNumbers: true,
  });

  try {
    const updated = await upsertToMySQL(conn, merged);
    console.log(`✓ Updated ${updated} province rows in provinces_statscan.`);

    try {
      const safetyUpdated = await upsertSafety(conn, safetyData);
      console.log(`✓ Updated ${safetyUpdated} province rows in provinces_safety.`);
    } catch (err) {
      console.warn(`  provinces_safety upsert failed: ${err.message}`);
    }

    try {
      const cpiUpdated = await upsertCostOfLiving(conn, cpiData);
      console.log(`✓ Updated ${cpiUpdated} province rows in provinces_cost_of_living.`);
    } catch (err) {
      console.warn(`  provinces_cost_of_living upsert failed: ${err.message}`);
    }

    try {
      const fiscalUpdated = await upsertFiscal(conn, fiscalData, gdp, population);
      console.log(`✓ Updated ${fiscalUpdated} province rows in provinces_fiscal.`);
    } catch (err) {
      console.warn(`  provinces_fiscal upsert failed: ${err.message}`);
    }

    try {
      const housingUpdated = await upsertHousing(conn, housingData);
      console.log(`✓ Updated ${housingUpdated} province rows in provinces_housing.`);
    } catch (err) {
      console.warn(`  provinces_housing upsert failed: ${err.message}`);
    }
  } finally {
    await conn.end();
  }

  console.log('=== Done ===');
}

main().catch(err => {
  console.error('refresh-statscan.js failed:', err.message || err);
  if (err.code) console.error('  Error code:', err.code);
  // Exit 0 so the pipeline doesn't break — stale data is better than no deploy
  process.exit(0);
});
