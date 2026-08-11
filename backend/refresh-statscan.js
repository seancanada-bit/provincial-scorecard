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
 *
 * IMPORTANT: The WDS batch API does NOT guarantee response order matches
 * request order — responses are re-sorted by coordinate. Every fetch
 * function parses the coordinate from each response to identify the
 * province, never relies on array position.
 *
 * Gracefully degrades: if any StatsCan fetch fails, it logs a warning and
 * continues — the pipeline never breaks because StatsCan is down.
 *
 * Usage:
 *   node refresh-statscan.js              # upsert into MySQL
 *   node refresh-statscan.js --dry-run    # print what would be written
 */

const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch {}

const axios = require('axios');

const DRY_RUN = process.argv.includes('--dry-run');

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

    results[code] = {
      gdp_growth_pct: growth,
      gdp_growth_delta_from_national: nationalGrowth != null
        ? Math.round((growth - nationalGrowth) * 10) / 10
        : null,
      gdp_ref_per: pts[0]?.refPer,
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
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE (writing to MySQL)'}\n`);

  // Fetch all data in parallel
  const [unemployment, gdp, population, csi, homicide, cpi] = await Promise.all([
    fetchUnemployment(),
    fetchGDP(),
    fetchPopulation(),
    safeFetch('CSI', fetchCSI),
    safeFetch('Homicide', fetchHomicide),
    safeFetch('CPI', fetchCPI),
  ]);

  // Merge into per-province objects
  const merged = {};
  const safetyData = {};
  const cpiData = {};
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
  }

  // Show summary
  console.log('\n--- Merged data ---');
  for (const code of PROVINCE_CODES) {
    const d = merged[code];
    const s = safetyData[code];
    const c = cpiData[code];
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
