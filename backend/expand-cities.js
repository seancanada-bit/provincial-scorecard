#!/usr/bin/env node
/**
 * expand-cities.js — Expand city coverage from 42 to 160 CMAs/CAs.
 *
 * Fetches population for every Census Metropolitan Area (CMA) and Census
 * Agglomeration (CA) from StatsCan table 17-10-0135-01, plus Crime Severity
 * Index for the subset of geographies covered by table 35-10-0026-01, and
 * writes a SQL seed file for `cities_meta` / `cities_safety`.
 *
 * Does NOT touch generate-all.js or scoring-cities.js — the scoring pipeline
 * automatically picks up new cities_meta rows and scores whatever categories
 * have data. Cities missing categories simply show partial scores.
 *
 * IMPORTANT: The WDS batch API does NOT guarantee response order matches
 * request order — responses are re-sorted by coordinate. Every fetch here
 * parses the coordinate from each response to match it back to the CMA/CA,
 * exactly like refresh-statscan.js does for provinces.
 *
 * Usage:
 *   node expand-cities.js              # generate SQL file
 *   node expand-cities.js --dry-run    # just print summary, no file written
 */

const fs   = require('fs');
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch {}

const axios = require('axios');

const DRY_RUN = process.argv.includes('--dry-run');

// ─── StatsCan WDS API ────────────────────────────────────────────────────────
const WDS_BASE = 'https://www150.statcan.gc.ca/t1/wds/rest';

const RATE_LIMIT_MS = 250;
const BATCH_SIZE = 50; // stay well under WDS timeouts

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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
 * Batch fetch requests in chunks of BATCH_SIZE, rate-limited between chunks.
 * Returns a flat array of raw responses (order not guaranteed — callers must
 * parse the coordinate off each item to identify what it belongs to).
 */
async function wdsBatchFetchAll(requests) {
  const results = [];
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const chunk = requests.slice(i, i + BATCH_SIZE);
    const data = await wdsBatchFetch(chunk);
    if (data) results.push(...data);
    if (i + BATCH_SIZE < requests.length) await sleep(RATE_LIMIT_MS);
  }
  return results;
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

async function fetchCubeMetadata(productId) {
  try {
    const resp = await axios.post(
      `${WDS_BASE}/getCubeMetadata`,
      [{ productId }],
      { timeout: 30000, headers: { 'Content-Type': 'application/json' } }
    );
    return resp.data;
  } catch (err) {
    console.warn(`  Cube metadata fetch failed for ${productId}: ${err.message}`);
    return null;
  }
}

// ─── Province name → abbreviation ───────────────────────────────────────────
const PROV_MAP = {
  'Newfoundland and Labrador': 'NL', 'Prince Edward Island': 'PE',
  'Nova Scotia': 'NS', 'New Brunswick': 'NB', 'Quebec': 'QC',
  'Ontario': 'ON', 'Manitoba': 'MB', 'Saskatchewan': 'SK',
  'Alberta': 'AB', 'British Columbia': 'BC',
  'Yukon': 'YT', 'Northwest Territories': 'NT', 'Nunavut': 'NU',
};

/**
 * Parse "City Name (CMA), Province Name" / "City Name (CA), Province Name"
 * into { cityName, provinceFull, provinceAbbr }.
 *
 * Handles cross-province entries:
 *   "Ottawa - Gatineau (CMA), Ontario/Quebec"        → first province (Ontario)
 *   "Ottawa - Gatineau (CMA), Ontario part, Ontario"  → "Ontario part" stripped → Ontario
 *   "Campbellton (CA), Quebec part, Quebec"           → Quebec
 */
function parseGeoName(rawName) {
  const m = rawName.match(/^(.*?)\s*\((CMA|CA)\),\s*(.+)$/);
  if (!m) return null;

  const cityName = m[1].trim();
  const geoType = m[2];
  let provincePart = m[3].trim();

  // "Ontario part, Ontario" / "Quebec part, Quebec" → last segment is the
  // clean province name; the "X part" prefix is redundant once stripped.
  if (/ part,/.test(provincePart)) {
    const segments = provincePart.split(',').map(s => s.trim());
    provincePart = segments[segments.length - 1];
  }

  // "Ontario/Quebec" → use the first province.
  if (provincePart.includes('/')) {
    provincePart = provincePart.split('/')[0].trim();
  }

  // Strip a lingering " part" suffix, if any slipped through.
  provincePart = provincePart.replace(/\s*part$/i, '').trim();

  const provinceAbbr = PROV_MAP[provincePart];
  if (!provinceAbbr) return null;

  return { cityName, geoType, provinceFull: provincePart, provinceAbbr };
}

/**
 * Normalize a city name for cross-table / cross-source matching:
 * strip accents, lowercase, collapse all non-alphanumerics to single spaces.
 * "St. Catharines - Niagara" and "St.Catharines-Niagara" both → "st catharines niagara"
 */
function normalizeCityName(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// ─── The 42 cities already in cities_meta (mysql-seed.sql) ─────────────────
// Listed using their StatsCan-equivalent names so normalizeCityName() lines
// up cleanly against the CMA/CA list names (e.g. "Quebec City" → "Québec",
// "Sudbury" → "Greater Sudbury"). Matching is by normalized name only — the
// existing cma_code scheme (3-digit, e.g. 535) is unrelated to the WDS
// geography member IDs used here.
const EXISTING_CITY_NAMES = [
  'Toronto', 'Montréal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Gatineau',
  'Winnipeg', 'Québec', 'Hamilton', 'Kitchener - Cambridge - Waterloo', 'London',
  'Halifax', 'St. Catharines - Niagara', 'Oshawa', 'Victoria', 'Windsor',
  'Saskatoon', 'Regina', 'Sherbrooke', 'Barrie', 'Kelowna', 'Abbotsford - Mission',
  'Kingston', 'Saguenay', 'Trois-Rivières', 'Guelph', 'Moncton', 'Greater Sudbury',
  'Peterborough', 'Thunder Bay', 'Lethbridge', 'Kamloops', 'Brantford', 'Nanaimo',
  'Chilliwack', 'Belleville', 'Red Deer', 'Fredericton', 'Drummondville',
  'Saint John', "St. John's",
];

const EXISTING_CITY_SET = new Set(EXISTING_CITY_NAMES.map(normalizeCityName));

// ─── A) Load the CMA/CA list ────────────────────────────────────────────────
function loadGeoList() {
  const raw = fs.readFileSync(path.join(__dirname, 'data', 'cma-ca-list.json'), 'utf8');
  const { cmas, cas } = JSON.parse(raw);
  return [...cmas, ...cas];
}

// ─── B) Fetch population for every CMA/CA (17-10-0135-01) ──────────────────
// Coordinate: geo.1.1.0.0.0.0.0.0.0 (sex=1 both sexes, age=1 all ages)
async function fetchPopulations(geoIds) {
  console.log(`  Fetching population for ${geoIds.length} CMAs/CAs (17-10-0135-01)...`);

  const requests = geoIds.map(id => ({
    productId: 17100135,
    coordinate: `${id}.1.1.0.0.0.0.0.0.0`,
    latestN: 1,
  }));

  const data = await wdsBatchFetchAll(requests);

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const geo = geoFromCoordinate(item.object?.coordinate);
    if (geo == null) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const pop = parseFloat(pts[0].value);
    if (isNaN(pop)) continue;

    results[geo] = { population: Math.round(pop), population_ref_per: pts[0].refPer };
  }

  console.log(`  ✓ Population: ${Object.keys(results).length}/${geoIds.length} CMAs/CAs`);
  return results;
}

// ─── D) Fetch CSI geography metadata + values (35-10-0026-01) ──────────────
// This table only covers ~55 geographies (provinces + ~42 CMAs) — nowhere
// near all 160 CMAs/CAs. Fetch cube metadata to find which CMA-level members
// (geoLevel 35) exist, match them to our parsed city list by normalized
// name, then fetch the CSI value for whatever matches.
async function fetchCsiForCities(newCities) {
  console.log('  Fetching Crime Severity Index geography (35-10-0026-01)...');

  const meta = await fetchCubeMetadata(35100026);
  const geoDim = meta?.[0]?.object?.dimension?.find(d => d.dimensionNameEn === 'Geography');
  if (!geoDim) {
    console.warn('  Could not fetch CSI geography metadata — skipping CSI.');
    return {};
  }

  // CMA-level members only (geoLevel 35 in this table); province/Canada rows excluded.
  const cmaMembers = geoDim.member.filter(m => m.geoLevel === 35);

  // Parse "City Name, Province [code]" (occasionally "City, Province part [code]",
  // or "City, Ontario/Quebec [code1/code2]" for the handful of bi-provincial CMAs
  // like Ottawa-Gatineau). Derive a provinceAbbr the same way parseGeoName() does
  // so bi-provincial CSI members can be told apart from each other.
  const parsedMembers = cmaMembers.map(m => {
    const nameMatch = m.memberNameEn.match(/^(.*?),\s*([^[]+?)(?:\s*\[.*\])?$/);
    const cityPart = nameMatch ? nameMatch[1].trim() : m.memberNameEn;
    let provPart = nameMatch ? nameMatch[2].trim() : '';
    if (provPart.includes('/')) provPart = provPart.split('/')[0].trim();
    provPart = provPart.replace(/\s*part$/i, '').trim();
    return {
      memberId: m.memberId,
      cityName: cityPart,
      normalized: normalizeCityName(cityPart),
      provinceAbbr: PROV_MAP[provPart] || null,
    };
  });

  // Match new cities → CSI member ID by normalized name (and province, to
  // disambiguate the handful of bi-provincial CMAs that appear 2-3 times).
  // Each CSI member is consumed at most once so no two cities silently share
  // the same value.
  const consumed = new Set();
  const matched = []; // { memberId, geoId }
  for (const city of newCities) {
    const norm = normalizeCityName(city.cityName);
    const candidates = parsedMembers.filter(p => p.normalized === norm && !consumed.has(p.memberId));
    if (!candidates.length) continue;

    // Prefer an exact province match; fall back to the first remaining candidate.
    const hit = candidates.find(p => p.provinceAbbr === city.provinceAbbr) || candidates[0];
    consumed.add(hit.memberId);
    matched.push({ memberId: hit.memberId, geoId: city.id });
  }

  console.log(`  ✓ CSI coverage: ${matched.length}/${newCities.length} new cities have a CSI match`);
  if (!matched.length) return {};

  const requests = matched.map(m => ({
    productId: 35100026,
    coordinate: `${m.memberId}.1.0.0.0.0.0.0.0.0`,
    latestN: 1,
  }));

  const data = await wdsBatchFetchAll(requests);

  // Map CSI member ID back to our geo ID (WDS coordinate = memberId, not geoId).
  const memberToGeo = {};
  for (const m of matched) memberToGeo[m.memberId] = m.geoId;

  const results = {};
  for (const item of data) {
    if (item?.status !== 'SUCCESS') continue;
    const memberId = geoFromCoordinate(item.object?.coordinate);
    const geoId = memberToGeo[memberId];
    if (geoId == null) continue;

    const pts = item.object?.vectorDataPoint ?? [];
    if (!pts.length) continue;
    const csi = parseFloat(pts[0].value);
    if (isNaN(csi)) continue;

    results[geoId] = { csi_value: csi, csi_ref_per: pts[0].refPer };
  }

  console.log(`  ✓ CSI values fetched: ${Object.keys(results).length}`);
  return results;
}

// ─── SQL generation ──────────────────────────────────────────────────────────
function sqlEscape(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "''");
}

function buildSql(newCities, populations, csiData) {
  const lines = [];
  lines.push('-- seed-cities-expansion.sql');
  lines.push('-- Generated by backend/expand-cities.js from StatsCan table 17-10-0135-01');
  lines.push(`-- Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`-- ${newCities.length} new CMAs/CAs not already covered by the existing 42 cities`);
  lines.push('-- NOTE: ON DUPLICATE KEY UPDATE only takes effect if cma_code has a UNIQUE');
  lines.push('-- index — add one (ALTER TABLE cities_meta ADD UNIQUE KEY (cma_code);) before');
  lines.push('-- re-running this file, or re-runs will insert duplicate rows.');
  lines.push('');

  lines.push('-- ── cities_meta ──────────────────────────────────────────────────────────');
  for (const city of newCities) {
    const pop = populations[city.id]?.population;
    const cmaCode = `CA_${city.id}`;
    lines.push(
      `INSERT INTO cities_meta (cma_code, city_name, province, province_abbr, population_2021)\n` +
      `VALUES ('${sqlEscape(cmaCode)}', '${sqlEscape(city.cityName)}', '${sqlEscape(city.provinceFull)}', '${sqlEscape(city.provinceAbbr)}', ${pop != null ? pop : 'NULL'})\n` +
      `ON DUPLICATE KEY UPDATE population_2021 = VALUES(population_2021);`
    );
  }

  lines.push('');
  lines.push('-- ── cities_safety (only cities covered by table 35-10-0026-01) ─────────────');
  const today = new Date().toISOString().slice(0, 10);
  let safetyCount = 0;
  for (const city of newCities) {
    const csi = csiData[city.id];
    if (!csi || csi.csi_value == null) continue;
    safetyCount++;
    const cmaCode = `CA_${city.id}`;
    const sourceNotes = `StatsCan WDS 35-10-0026-01 (${csi.csi_ref_per || '?'})`;
    lines.push(
      `INSERT INTO cities_safety (cma_code, crime_severity_index, source_notes, data_date)\n` +
      `VALUES ('${sqlEscape(cmaCode)}', ${csi.csi_value}, '${sqlEscape(sourceNotes)}', '${today}')\n` +
      `ON DUPLICATE KEY UPDATE crime_severity_index = VALUES(crime_severity_index), source_notes = VALUES(source_notes), data_date = VALUES(data_date);`
    );
  }
  if (safetyCount === 0) lines.push('-- (no CSI matches found for the new cities)');

  lines.push('');
  return { sql: lines.join('\n') + '\n', safetyCount };
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== City Expansion: StatsCan CMA/CA Seed ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no file written)' : 'LIVE (writing SQL file)'}\n`);

  const geoList = loadGeoList();
  console.log(`Loaded ${geoList.length} CMAs/CAs from data/cma-ca-list.json`);

  // Parse every entry.
  const parsed = [];
  for (const geo of geoList) {
    const p = parseGeoName(geo.name);
    if (!p) {
      console.warn(`  ⚠ Could not parse: "${geo.name}"`);
      continue;
    }
    parsed.push({ id: geo.id, rawName: geo.name, ...p });
  }
  console.log(`Parsed ${parsed.length}/${geoList.length} entries successfully.`);

  // Split into already-covered vs. new.
  const newCities = parsed.filter(c => !EXISTING_CITY_SET.has(normalizeCityName(c.cityName)));
  const existingCount = parsed.length - newCities.length;
  console.log(`  Already in our 42 cities: ${existingCount}`);
  console.log(`  New CMAs/CAs to seed: ${newCities.length}\n`);

  // Fetch population + CSI in parallel-ish (CSI needs metadata first, so
  // sequence it — population is the expensive one, run it first).
  const populations = await fetchPopulations(newCities.map(c => c.id));
  const csiData = await fetchCsiForCities(newCities);

  // Summary
  console.log('\n--- Summary ---');
  console.log(`Total CMAs/CAs in StatsCan table:    ${parsed.length}`);
  console.log(`Already covered (existing 42):        ${existingCount}`);
  console.log(`New cities to seed:                   ${newCities.length}`);
  console.log(`New cities with population data:      ${Object.keys(populations).length}`);
  console.log(`New cities with CSI/safety data:       ${Object.keys(csiData).length}`);

  if (DRY_RUN) {
    console.log('\nSample of new cities:');
    for (const c of newCities.slice(0, 10)) {
      const pop = populations[c.id]?.population;
      const hasCsi = csiData[c.id] ? 'yes' : 'no';
      console.log(`  CA_${c.id}: ${c.cityName}, ${c.provinceAbbr} — pop=${pop ?? '?'} — csi=${hasCsi}`);
    }
    console.log('\n🏁 Dry run complete — no SQL file written.');
    return;
  }

  const { sql, safetyCount } = buildSql(newCities, populations, csiData);
  const outPath = path.join(__dirname, '..', 'seed-cities-expansion.sql');
  fs.writeFileSync(outPath, sql);
  console.log(`\n✓ Wrote ${newCities.length} cities_meta inserts + ${safetyCount} cities_safety inserts → ${outPath}`);
  console.log('=== Done ===');
}

main().catch(err => {
  console.error('expand-cities.js failed:', err.message || err);
  process.exit(1);
});
