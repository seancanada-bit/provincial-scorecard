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
  // ── Alberta ──
  AB: {
    'drumheller':      () => ['48002'],
    'stettler':        () => ['48002'],
    'wainwright':      () => ['48002'],
    'hanna':           () => ['48002'],
    'oyen':            () => ['48002'],
    'brooks':          () => ['48003'],
    'strathmore':      () => ['48003'],
    'vulcan':          () => ['48003'],
    'taber':           () => ['48003'],
    'cold lake':       () => ['48027'],
    'bonnyville':      () => ['48027'],
    'lac la biche':    () => ['48027'],
    'athabasca':       () => ['48027'],
    'slave lake':      () => ['48027'],
    'wood buffalo':    () => ['48027'],
    'fort mcmurray':   () => ['48027'],
    'strathcona county': () => ['48035'],
    'sherwood park':   () => ['48035'],
    'fort saskatchewan': () => ['48035'],
    'st. albert':      () => ['48036'],
    'rocky view county': () => ['48003'],
  },
  // ── Manitoba ──
  MB: {
    'winnipeg': (mps) => mps.filter(r => r.name.includes('Winnipeg') || r.name.includes('Elmwood') || r.name.includes('Kildonan') || r.name.includes('St. Boniface')).map(r => r.ridingCode),
    'steinbach':       () => ['46006'],
    'beausejour':      () => ['46006'],
    'niverville':      () => ['46006'],
    'thompson':        () => ['46008'],
    'the pas':         () => ['46008'],
    'flin flon':       () => ['46008'],
    'brandon':         () => ['46002'],
    'portage la prairie': () => ['46005'],
    'selkirk':         () => ['46007'],
    'dauphin':         () => ['46004'],
  },
  // ── New Brunswick ──
  // NB: 13001=Acadie-Bathurst, 13002=Beauséjour, 13003=Fredericton-Oromocto,
  //     13004=Fundy Royal, 13005=Madawaska-Restigouche, 13006=Miramichi-Grand Lake,
  //     13007=Moncton-Dieppe, 13008=Saint John-Kennebecasis, 13009=Saint John-St. Croix, 13010=Tobique-Mactaquac
  NB: {
    'saint john':    (mps) => mps.filter(r => r.name.includes('Saint John')).map(r => r.ridingCode),
    'shediac':       () => ['13002'],
    'bouctouche':    () => ['13002'],
    'richibucto':    () => ['13002'],
    'tracadie-sheila': () => ['13002'],
    'tracadie':      () => ['13002'],
    'sussex':        () => ['13004'],
    'hampton':       () => ['13004'],
    'st. stephen':   () => ['13009'],
    'st. george':    () => ['13009'],
    'st. andrews':   () => ['13009'],
    'mcadam':        () => ['13010'],
    'woodstock':     () => ['13010'],
    'grand falls':   () => ['13005'],
    'kedgwick':      () => ['13005'],
    'edmundston':    () => ['13005'],
    'oromocto':      () => ['13003'],
    'fredericton':   () => ['13003'],
  },
  // ── Newfoundland ──
  // NL: 10001=Avalon, 10002=Cape Spear, 10003=Central NF, 10004=Labrador,
  //     10005=Long Range Mtns, 10006=St. John's East, 10007=Terra Nova
  NL: {
    'corner brook':  () => ['10005'],
    'stephenville':  () => ['10005'],
    'deer lake':     () => ['10005'],
    'channel-port aux basques': () => ['10005'],
    'pasadena':      () => ['10005'],
    'grand falls-windsor': () => ['10003'],
    'gander':        () => ['10003'],
    'carbonear':     () => ['10001'],
    'harbour grace': () => ['10001'],
    'bay roberts':   () => ['10001'],
    'happy valley-goose bay': () => ['10004'],
    'labrador city': () => ['10004'],
    'wabush':        () => ['10004'],
    'marystown':     () => ['10001'],
    'grand bank':    () => ['10001'],
    'placentia':     () => ['10001'],
    'clarenville':   () => ['10007'],
    'bonavista':     () => ['10007'],
    'conception bay south': () => ['10001'],
    'paradise':      () => ['10002'],
    'mount pearl':   () => ['10002'],
    "portugal cove-st. philip's": () => ['10002'],
    'torbay':        () => ['10006'],
    'glovertown':    () => ['10007'],
    'gambo':         () => ['10007'],
    'trinity bay north': () => ['10007'],
    'new-wes-valley': () => ['10007'],
    'fogo island':   () => ['10007'],
    // Avalon Peninsula (10001)
    'ferryland':     () => ['10001'],
    'bay bulls':     () => ['10001'],
    'trepassey':     () => ['10001'],
    'witless bay':   () => ['10001'],
    'holyrood':      () => ['10001'],
    'harbour main-chapel\'s cove-lakeview': () => ['10001'],
    'harbour grace': () => ['10001'],
    'bay roberts':   () => ['10001'],
    'old perlican':  () => ['10001'],
    'whitbourne':    () => ['10001'],
    'heart\'s content': () => ['10001'],
    'dildo':         () => ['10001'],
    'south river':   () => ['10001'],
    'salmon cove':   () => ['10001'],
    'upper island cove': () => ['10001'],
    'spaniard\'s bay': () => ['10001'],
    'wabana':        () => ['10001'],
    'conception harbour': () => ['10001'],
    'brigus':        () => ['10001'],
    'clarke\'s beach': () => ['10001'],
    'colliers':      () => ['10001'],
    // Terra Nova (10007) — Clarenville/Bonavista area
    'port blandford': () => ['10007'],
    'arnold\'s cove': () => ['10007'],
    'st. alban\'s':  () => ['10007'],
    'lewisporte':    () => ['10007'],
    'bishop\'s falls': () => ['10003'],
    'botwood':       () => ['10003'],
    'springdale':    () => ['10003'],
  },
  // ── PEI ──
  // PE: 11001=Cardigan, 11002=Charlottetown, 11003=Egmont, 11004=Malpeque
  PE: {
    'charlottetown': () => ['11002'],
    'stratford':     () => ['11001'],
    'summerside':    () => ['11003'],
    'cornwall':      () => ['11004'],
    'kensington':    () => ['11004'],
    'montague':      () => ['11001'],
    'souris':        () => ['11001'],
    'alberton':      () => ['11003'],
    'tignish':       () => ['11003'],
    "o'leary":       () => ['11003'],
    'georgetown':    () => ['11001'],
    'wellington':    () => ['11003'],
    'north rustico': () => ['11004'],
    'hunter river':  () => ['11004'],
    'crapaud':       () => ['11003'],
    'borden-carleton': () => ['11004'],
    'slemon park':   () => ['11003'],
    'three rivers':  () => ['11001'],
  },
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
              'vimy','cote-saint-luc','dorval','saint-laurent'].some(w => n.includes(w));
    }).map(r => r.ridingCode),
    'montréal': null, // alias — resolved at runtime
    'montréal-ouest': null,
    'laval': (mps) => mps.filter(r => norm(r.name).includes('laval')).map(r => r.ridingCode),
    'longueuil': (mps) => mps.filter(r => norm(r.name).includes('longueuil')).map(r => r.ridingCode),
    'québec': () => ['24008','24016','24043','24044','24059'],
    'quebec': () => ['24008','24016','24043','24044','24059'],
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
    'saint-jean-sur-richelieu': () => ['24067'],
    'saint-eustache': () => ['24039'],
    "l'ancienne-lorette": () => ['24043'],
    'saint-laurent': () => ['24068'],
    'charlesbourg': () => ['24016','24044'],
    'haute-saint-charles': () => ['24016'],
    'beauport':     () => ['24008'],
    'limoilou':     () => ['24008'],
    'val-belair':   () => ['24044'],
    'loretteville': () => ['24044'],
    'saint-emile':  () => ['24044'],
    'neufchatel':   () => ['24016'],
    'lac-saint-charles': () => ['24044'],
    'alma':         () => ['24033'],
    'dolbeau-mistassini': () => ['24033'],
    'roberval':     () => ['24033'],
    'sainte-therese': () => ['24039'],
    'saint-sauveur': () => ['24039'],
    'sainte-adele':  () => ['24039'],
    'saint-jerome':  () => ['24039'],
    'terrebonne':    () => ['24004'],
    'lachenaie':     () => ['24004'],
    'mascouche':     () => ['24004'],
  },
  NS: {
    'cape breton': (mps) => mps.filter(r => r.name.toLowerCase().includes('sydney') || r.name.toLowerCase().includes('cape breton')).map(r => r.ridingCode),
    'pictou':      (mps) => mps.filter(r => r.name.includes('Central Nova') || r.name.includes('Pictou')).map(r => r.ridingCode),
    'lunenburg':   (mps) => mps.filter(r => r.name.includes('South Shore')).map(r => r.ridingCode),
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
