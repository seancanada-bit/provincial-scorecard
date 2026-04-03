#!/usr/bin/env node
/**
 * import-infrastructure.js
 *
 * Downloads Infrastructure Canada project CSV, matches projects to federal
 * ridings via a dynamically-built municipality-to-riding crosswalk, and
 * outputs api/riding-spending.json.
 *
 * The crosswalk is built in three layers:
 *   1. Riding name decomposition: "Calgary Centre" → Calgary maps to 48004
 *   2. Explicit extra mappings: Toronto suburbs (Etobicoke, Scarborough, etc.)
 *   3. Territory fallback: NT/NU/YT → single riding each
 *
 * Usage: node import-infrastructure.js [--download]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { parse } = require('csv-parse/sync');

const DATA_DIR = path.join(__dirname, 'data');
const API_DIR  = path.join(__dirname, '..', 'api');
const CSV_PATH = path.join(DATA_DIR, 'infrastructure-projects.csv');
const MPS_JSON = path.join(API_DIR, 'mps.json');
const OUTPUT   = path.join(API_DIR, 'riding-spending.json');
const CSV_URL  = 'https://www.infrastructure.gc.ca/alt-format/opendata/project-list-liste-de-projets-bil.csv';

const PROV_MAP = { ab:'AB', bc:'BC', mb:'MB', nb:'NB', nl:'NL', ns:'NS', nt:'NT', nu:'NU', on:'ON', pe:'PE', qc:'QC', sk:'SK', yt:'YT' };

// ─── Normalize for matching ──────────────────────────────────────────────────
function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, "'").replace(/[—–]/g, '-').trim().toLowerCase();
}

// ─── Download CSV ────────────────────────────────────────────────────────────
function downloadCSV() {
  return new Promise((resolve, reject) => {
    console.log('[infra] Downloading CSV...');
    const file = fs.createWriteStream(CSV_PATH);
    https.get(CSV_URL, res => {
      const target = (res.statusCode === 301 || res.statusCode === 302) ? res.headers.location : null;
      const stream = target ? https.get(target, r => r) : res;
      (target ? https.get(target, r => { r.pipe(file); file.on('finish', () => { file.close(); resolve(); }); }) : (() => { res.pipe(file); file.on('finish', () => { file.close(); resolve(); }); })());
    }).on('error', reject);
  });
}

// ─── Explicit mappings for locations that DON'T match any riding name ─────────
// Key = normalized location name, Value = array of riding codes
// Only needed when the location name doesn't appear as a word in any riding name
const EXTRA_MAPPINGS = {
  // ── Ontario: Toronto-area ridings without "Toronto" in name ──
  ON: {
    'toronto': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['toronto','etobicoke','scarborough','york','don valley','eglinton','willowdale',
              'davenport','beaches','spadina','parkdale','humber','danforth','st. paul'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'etobicoke': (mps) => mps.filter(r => r.name.toLowerCase().includes('etobicoke')).map(r => r.ridingCode),
    'scarborough': (mps) => mps.filter(r => r.name.toLowerCase().includes('scarborough')).map(r => r.ridingCode),
    'north york': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['don valley','willowdale','york centre','eglinton'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'greater sudbury': (mps) => mps.filter(r => r.name.toLowerCase().includes('sudbury')).map(r => r.ridingCode),
    'cape breton': (mps) => mps.filter(r => r.name.toLowerCase().includes('sydney') || r.name.toLowerCase().includes('cape breton')).map(r => r.ridingCode),
    'york': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return n.includes('york') && r.province === 'ON';
    }).map(r => r.ridingCode),
    'peel': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['mississauga','brampton'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'durham': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['oshawa','whitby','ajax','pickering','bowmanville','york-durham'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'halton': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['oakville','burlington','milton','halton'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'niagara': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['niagara','st. catharines','welland'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'simcoe': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['barrie','simcoe','innisfil','springwater','oro-medonte'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'muskoka': (mps) => mps.filter(r => r.name.toLowerCase().includes('parry sound') || r.name.toLowerCase().includes('muskoka')).map(r => r.ridingCode),
    'waterloo region': (mps) => mps.filter(r => {
      const n = r.name.toLowerCase();
      return ['kitchener','waterloo','cambridge'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    // Cities whose names don't appear in their riding name
    'north bay':     (mps) => mps.filter(r => r.name.includes('Nipissing')).map(r => r.ridingCode),
    'cornwall':      (mps) => mps.filter(r => r.name.includes('Stormont')).map(r => r.ridingCode),
    'belleville':    (mps) => mps.filter(r => r.name.includes('Quinte')).map(r => r.ridingCode),
    'cobourg':       (mps) => mps.filter(r => r.name.includes('Northumberland')).map(r => r.ridingCode),
    'brockville':    (mps) => mps.filter(r => r.name.includes('Leeds')).map(r => r.ridingCode),
    'fort frances':  (mps) => mps.filter(r => r.name.includes('Kenora')).map(r => r.ridingCode),
    'welland':       (mps) => mps.filter(r => r.name.includes('Niagara') || r.name.includes('Welland')).map(r => r.ridingCode),
    'clarington':    (mps) => mps.filter(r => r.name.includes('Bowmanville')).map(r => r.ridingCode),
    'stratford':     (mps) => mps.filter(r => r.name.includes('Perth')).map(r => r.ridingCode),
    'port colborne': (mps) => mps.filter(r => r.name.includes('Niagara')).map(r => r.ridingCode),
    'thorold':       (mps) => mps.filter(r => r.name.includes('Niagara')).map(r => r.ridingCode),
    'grimsby':       (mps) => mps.filter(r => r.name.includes('Niagara')).map(r => r.ridingCode),
    'pelham':        (mps) => mps.filter(r => r.name.includes('Niagara')).map(r => r.ridingCode),
    'hearst':        (mps) => mps.filter(r => r.name.includes('Kapuskasing')).map(r => r.ridingCode),
    'kirkland lake': (mps) => mps.filter(r => r.name.includes('Timiskaming') || r.name.includes('Nipissing')).map(r => r.ridingCode),
  },
  QC: {
    'montreal': (mps) => mps.filter(r => {
      const n = norm(r.name);
      return ['montreal','mount royal','outremont','notre-dame-de-grace','westmount','ville-marie',
              'pointe-de-l\'ile','pierrefonds','dollard','papineau','lac-saint-louis','ahuntsic',
              'rosemont','hochelaga','bourassa','saint-leonard','lasalle','lachine','verdun',
              'vimy','cote-saint-luc','dorval'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'montréal': null, // alias — resolved at runtime
    'montréal-ouest': null,
    'laval': (mps) => mps.filter(r => norm(r.name).includes('laval')).map(r => r.ridingCode),
    'longueuil': (mps) => mps.filter(r => norm(r.name).includes('longueuil')).map(r => r.ridingCode),
    'québec': (mps) => mps.filter(r => norm(r.name).includes('quebec') && r.province === 'QC').map(r => r.ridingCode),
    'quebec': null, // alias
    'gatineau': (mps) => mps.filter(r => norm(r.name).includes('gatineau') || norm(r.name).includes('hull')).map(r => r.ridingCode),
    'shawinigan': (mps) => mps.filter(r => norm(r.name).includes('saint-maurice') || norm(r.name).includes('shawinigan')).map(r => r.ridingCode),
    'saguenay':   (mps) => mps.filter(r => norm(r.name).includes('jonquiere') || norm(r.name).includes('chicoutimi') || norm(r.name).includes('saguenay')).map(r => r.ridingCode),
    'drummondville': (mps) => mps.filter(r => norm(r.name).includes('drummond')).map(r => r.ridingCode),
    'victoriaville': (mps) => mps.filter(r => norm(r.name).includes('arthabaska') || norm(r.name).includes('victoriaville')).map(r => r.ridingCode),
    'sherbrooke': (mps) => mps.filter(r => norm(r.name).includes('sherbrooke')).map(r => r.ridingCode),
    'trois-rivières': (mps) => mps.filter(r => norm(r.name).includes('trois-rivieres')).map(r => r.ridingCode),
    'trois-rivieres': null, // alias
    'saint-hyacinthe': (mps) => mps.filter(r => norm(r.name).includes('saint-hyacinthe')).map(r => r.ridingCode),
    'joliette':   (mps) => mps.filter(r => norm(r.name).includes('joliette')).map(r => r.ridingCode),
    'rimouski':   (mps) => mps.filter(r => norm(r.name).includes('rimouski')).map(r => r.ridingCode),
    'repentigny': (mps) => mps.filter(r => norm(r.name).includes('repentigny')).map(r => r.ridingCode),
    'mirabel':    (mps) => mps.filter(r => norm(r.name).includes('mirabel')).map(r => r.ridingCode),
  },
  NB: {
    'saint john':    (mps) => mps.filter(r => r.name.includes('Saint John')).map(r => r.ridingCode),
  },
  NL: {
    'corner brook':  () => ['10006'],
    'stephenville':  () => ['10006'],
    'deer lake':     () => ['10006'],
    'channel-port aux basques': () => ['10006'],
    'grand falls-windsor': () => ['10006'],
    'gander':        () => ['10002'],
    'carbonear':     () => ['10003'],
  },
  NS: {
    'cape breton': (mps) => mps.filter(r => r.name.toLowerCase().includes('sydney') || r.name.toLowerCase().includes('cape breton')).map(r => r.ridingCode),
    'pictou':      (mps) => mps.filter(r => r.name.includes('Central Nova') || r.name.includes('Pictou')).map(r => r.ridingCode),
    'lunenburg':   (mps) => mps.filter(r => r.name.includes('South Shore')).map(r => r.ridingCode),
  },
  PE: {
    'summerside':  () => ['11002'],
    'stratford':   () => ['11001'],
    'charlottetown': () => ['11001'],
  },
  BC: {
    'north vancouver': (mps) => mps.filter(r => norm(r.name).includes('north vancouver')).map(r => r.ridingCode),
    'squamish':    (mps) => mps.filter(r => r.name.includes('West Vancouver') || r.name.includes('Sea to Sky')).map(r => r.ridingCode),
  },
};

// ─── Build crosswalk from riding names ───────────────────────────────────────
function buildCrosswalk(ridings) {
  // Province → { normalizedWord → [ridingCodes] }
  const crosswalk = {};
  const byCode = {};

  for (const r of ridings) {
    byCode[r.ridingCode] = { name: r.name, province: r.province, population: r.population };
    if (!crosswalk[r.province]) crosswalk[r.province] = {};
    const prov = crosswalk[r.province];

    // Extract meaningful words from riding name (skip common connectors)
    const skip = new Set(['and','the','of','north','south','east','west','centre','des','du','de','la','le','les','saint','sainte','st']);
    const words = r.name.split(/[—–\-\/\s,]+/).filter(w => w.length > 2 && !skip.has(w.toLowerCase()));

    for (const word of words) {
      const nw = norm(word);
      if (nw.length < 3) continue;
      if (!prov[nw]) prov[nw] = new Set();
      prov[nw].add(r.ridingCode);
    }

    // Also index the full normalized name
    const fullNorm = norm(r.name);
    if (!prov[fullNorm]) prov[fullNorm] = new Set();
    prov[fullNorm].add(r.ridingCode);
  }

  // Resolve EXTRA_MAPPINGS
  const provRidings = {};
  for (const r of ridings) {
    if (!provRidings[r.province]) provRidings[r.province] = [];
    provRidings[r.province].push(r);
  }

  for (const [prov, mappings] of Object.entries(EXTRA_MAPPINGS)) {
    if (!crosswalk[prov]) crosswalk[prov] = {};
    const mps = provRidings[prov] || [];
    for (const [locName, resolver] of Object.entries(mappings)) {
      if (resolver === null) continue; // alias, handled by primary entry
      const codes = resolver(mps);
      if (codes.length > 0) {
        crosswalk[prov][norm(locName)] = new Set(codes);
      }
    }
    // Handle aliases
    for (const [locName, resolver] of Object.entries(mappings)) {
      if (resolver !== null) continue;
      // Find the primary (e.g., 'montréal' → 'montreal')
      const primary = norm(locName);
      // Check if a similar key exists
      for (const [key, codes] of Object.entries(crosswalk[prov])) {
        if (key.startsWith(primary.substring(0, 5)) && codes.size > 3) {
          crosswalk[prov][primary] = codes;
          break;
        }
      }
    }
  }

  // Convert Sets to arrays
  for (const prov of Object.keys(crosswalk)) {
    for (const key of Object.keys(crosswalk[prov])) {
      crosswalk[prov][key] = [...crosswalk[prov][key]];
    }
  }

  return { crosswalk, byCode };
}

// ─── Match location to riding(s) ────────────────────────────────────────────
function matchLocation(location, province, crosswalk) {
  const provMap = crosswalk[province];
  if (!provMap) return null;

  // Territories — single riding
  if (['NT','NU','YT'].includes(province)) {
    const codes = { NT:'61001', NU:'62001', YT:'60001' };
    return [codes[province]];
  }

  // Clean up common suffixes
  const cleaned = location
    .replace(/,?\s*(City|Town|Village|Township|Municipality|County|District|Region|Regional Municipality|Parish) of\s*/gi, '')
    .replace(/^(City|Town|Village|Township|Municipality|County|District) of\s*/i, '')
    .replace(/\s*\(Regional Municiaplity\)/i, '')
    .replace(/\s*\(Regional Municipality\)/i, '')
    .replace(/\s*No\.\s*\d+/g, '')
    .trim();

  const normLoc = norm(cleaned);
  const normFull = norm(location);

  // 1. Exact match on full location
  if (provMap[normFull]?.length) return provMap[normFull];
  if (provMap[normLoc]?.length) return provMap[normLoc];

  // 2. Try significant words from the location
  const locWords = cleaned.split(/[\s,;-]+/).filter(w => w.length > 3);
  for (const word of locWords) {
    const nw = norm(word);
    // Only use if this word maps to a small number of ridings (avoid "north", "south" etc.)
    if (provMap[nw]?.length === 1) return provMap[nw];
  }

  // 3. Try the first word (most specific)
  if (locWords.length > 0) {
    const first = norm(locWords[0]);
    if (provMap[first]?.length && provMap[first].length <= 5) return provMap[first];
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (process.argv.includes('--download') || !fs.existsSync(CSV_PATH)) {
    await downloadCSV();
  }

  console.log('[infra] Reading CSV (latin1)...');
  const csvContent = fs.readFileSync(CSV_PATH, 'latin1');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, bom: true });
  console.log(`[infra] Parsed ${records.length} projects`);

  const mpsData = JSON.parse(fs.readFileSync(MPS_JSON, 'utf8'));
  const { crosswalk, byCode } = buildCrosswalk(mpsData.ridings);

  // Initialize output
  const ridingData = {};
  for (const [code, info] of Object.entries(byCode)) {
    ridingData[code] = { riding: info.name, province: info.province, projects: [], totalFederal: 0, projectCount: 0, byCategory: {} };
  }

  const unmatched = {};
  let matchedCount = 0, unmatchedCount = 0, totalFed = 0;

  for (const row of records) {
    const locRaw = row.LOCATION?.trim();
    const province = PROV_MAP[row.REGION_CD?.trim().toLowerCase()];
    const federal = parseFloat(row.FEDERAL_CONTRIBUTION) || 0;
    const title = row.PROJECT_TITLE?.trim() || '';
    const category = row.STANDARD_CATEGORY?.trim() || 'Other';
    const program = row.PROGRAM_EN?.trim() || '';
    const recipient = row.ULTIMATE_RECIPIENT_EN?.trim() || '';

    if (!locRaw || !province) { unmatchedCount++; continue; }

    // Split multi-location entries
    const locations = locRaw.includes(';') ? locRaw.split(';').map(s => s.trim()).filter(Boolean) : [locRaw];

    const allRidings = new Set();
    for (const loc of locations) {
      const ridings = matchLocation(loc, province, crosswalk);
      if (ridings) ridings.forEach(r => allRidings.add(r));
    }

    // Fallback: try full string
    if (allRidings.size === 0) {
      const ridings = matchLocation(locRaw, province, crosswalk);
      if (ridings) ridings.forEach(r => allRidings.add(r));
    }

    if (allRidings.size > 0) {
      matchedCount++;
      totalFed += federal;
      const share = federal / allRidings.size;

      for (const code of allRidings) {
        if (!ridingData[code]) continue;
        ridingData[code].totalFederal += share;
        ridingData[code].projectCount++;
        ridingData[code].byCategory[category] = (ridingData[code].byCategory[category] || 0) + share;

        if (ridingData[code].projects.length < 20 || share > 100000) {
          ridingData[code].projects.push({ title: title.substring(0, 120), federal: Math.round(share), program, category, recipient: recipient.substring(0, 80) });
        }
      }
    } else {
      unmatchedCount++;
      const key = `${province}|${locRaw.substring(0, 60)}`;
      unmatched[key] = (unmatched[key] || 0) + 1;
    }
  }

  // Finalize: sort projects, round values
  for (const code of Object.keys(ridingData)) {
    ridingData[code].projects.sort((a, b) => b.federal - a.federal);
    ridingData[code].projects = ridingData[code].projects.slice(0, 10);
    ridingData[code].totalFederal = Math.round(ridingData[code].totalFederal);
    for (const cat of Object.keys(ridingData[code].byCategory)) {
      ridingData[code].byCategory[cat] = Math.round(ridingData[code].byCategory[cat]);
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(ridingData, null, 0));
  console.log(`\n[infra] Written to ${OUTPUT}`);

  // Stats
  const withData = Object.values(ridingData).filter(r => r.projectCount > 0).length;
  const total = Object.keys(ridingData).length;
  console.log(`\n═══ MATCH RESULTS ═══`);
  console.log(`Projects matched:   ${matchedCount} / ${records.length} (${(matchedCount/records.length*100).toFixed(1)}%)`);
  console.log(`Projects unmatched: ${unmatchedCount}`);
  console.log(`Federal $ matched:  $${(totalFed/1e9).toFixed(1)}B`);
  console.log(`Ridings with data:  ${withData} / ${total} (${(withData/total*100).toFixed(0)}%)`);
  console.log(`Ridings with 0:     ${total - withData}`);

  // Province breakdown
  const ps = {};
  for (const [code, d] of Object.entries(ridingData)) {
    if (!ps[d.province]) ps[d.province] = { t: 0, w: 0, f: 0 };
    ps[d.province].t++;
    if (d.projectCount > 0) ps[d.province].w++;
    ps[d.province].f += d.totalFederal;
  }
  console.log(`\nProv  Ridings  Matched  %     Federal $`);
  for (const [p, s] of Object.entries(ps).sort()) {
    console.log(`${p.padEnd(4)} ${String(s.t).padEnd(8)} ${String(s.w).padEnd(8)} ${(s.w/s.t*100).toFixed(0).padStart(3)}%   $${(s.f/1e6).toFixed(0)}M`);
  }

  // Top unmatched
  const topUnmatched = Object.entries(unmatched).sort((a,b) => b[1]-a[1]).slice(0, 25);
  if (topUnmatched.length) {
    console.log(`\n═══ TOP UNMATCHED ═══`);
    for (const [k, c] of topUnmatched) console.log(`  ${String(c).padStart(4)}x  ${k}`);
  }
}

main().catch(err => { console.error('[infra] Fatal:', err); process.exit(1); });
