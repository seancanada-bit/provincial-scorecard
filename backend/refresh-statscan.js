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

// ─── MySQL upsert ───────────────────────────────────────────────────────────
async function upsertToMySQL(merged) {
  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({
    host:     process.env.MYSQL_HOST     || 'localhost',
    user:     process.env.MYSQL_USER     || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bangforyourduck',
    charset:  'utf8mb4',
    decimalNumbers: true,
  });

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

  await conn.end();
  return updated;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== StatsCan Data Refresh ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE (writing to MySQL)'}\n`);

  // Fetch all data in parallel
  const [unemployment, gdp, population] = await Promise.all([
    fetchUnemployment(),
    fetchGDP(),
    fetchPopulation(),
  ]);

  // Merge into per-province objects
  const merged = {};
  for (const code of PROVINCE_CODES) {
    merged[code] = {
      ...(unemployment[code] || {}),
      ...(gdp[code] || {}),
      ...(population[code] || {}),
    };
  }

  // Show summary
  console.log('\n--- Merged data ---');
  for (const code of PROVINCE_CODES) {
    const d = merged[code];
    const parts = [];
    if (d.unemployment_rate != null) parts.push(`unemp=${d.unemployment_rate}%`);
    if (d.gdp_growth_pct != null)    parts.push(`gdp=${d.gdp_growth_pct}%`);
    if (d.population != null)        parts.push(`pop=${(d.population / 1e6).toFixed(2)}M`);
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

  // Upsert to MySQL
  console.log('\nWriting to MySQL...');
  const updated = await upsertToMySQL(merged);
  console.log(`✓ Updated ${updated} province rows in provinces_statscan.`);
  console.log('=== Done ===');
}

main().catch(err => {
  console.error('refresh-statscan.js failed:', err.message || err);
  if (err.code) console.error('  Error code:', err.code);
  // Exit 0 so the pipeline doesn't break — stale data is better than no deploy
  process.exit(0);
});
