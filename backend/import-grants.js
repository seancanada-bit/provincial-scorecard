#!/usr/bin/env node
/**
 * import-grants.js
 *
 * Processes the Open Canada Grants & Contributions CSV to extract
 * regional development agency funding and merge it into riding-spending.json.
 *
 * Agencies: ACOA, CED, FedDev Ontario, PrairiesCan, PacifiCan, CanNor, FedNor, WD
 *
 * Usage: node import-grants.js [--download]
 *   --download  Fetch fresh 621MB CSV from open.canada.ca (slow!)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createReadStream } = require('fs');
const { parse } = require('csv-parse');

const DATA_DIR = path.join(__dirname, 'data');
const API_DIR  = path.join(__dirname, '..', 'api');
const CSV_PATH = '/tmp/grants-sample.csv';  // 621MB — keep in /tmp, not in repo
const MPS_JSON = path.join(API_DIR, 'mps.json');
const SPENDING = path.join(API_DIR, 'riding-spending.json');

const GRANTS_URL = 'https://open.canada.ca/data/dataset/432527ab-7aac-45b5-81d6-7597107a7013/resource/1d15a62f-5656-49ad-8c88-f40ce689d831/download/grants.csv';

// Regional development agencies
const RDA_ORGS = new Set([
  'acoa-apeca', 'ced-dec', 'feddevontario', 'prairiescan',
  'wd-deo', 'pacifican', 'cannor', 'fednor'
]);

const RDA_LABELS = {
  'acoa-apeca': 'ACOA', 'ced-dec': 'CED (Quebec)', 'feddevontario': 'FedDev Ontario',
  'prairiescan': 'PrairiesCan', 'wd-deo': 'Western Diversification', 'pacifican': 'PacifiCan',
  'cannor': 'CanNor', 'fednor': 'FedNor',
};

// Province code normalization
const PROV_NORM = {
  AB:'AB', BC:'BC', MB:'MB', NB:'NB', NL:'NL', NS:'NS',
  NT:'NT', NU:'NU', ON:'ON', PE:'PE', QC:'QC', SK:'SK', YT:'YT',
};

function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, "'").replace(/[—–]/g, '-').trim().toLowerCase();
}

function downloadCSV() {
  return new Promise((resolve, reject) => {
    console.log('[grants] Downloading 621MB CSV from open.canada.ca (this takes a while)...');
    const file = fs.createWriteStream(CSV_PATH);
    https.get(GRANTS_URL, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, r => { r.pipe(file); file.on('finish', () => { file.close(); resolve(); }); }).on('error', reject);
      } else {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

// Build city→riding lookup from our existing crosswalk (reuse import-infrastructure logic)
function buildCityLookup() {
  const mpsData = JSON.parse(fs.readFileSync(MPS_JSON, 'utf8'));
  const byProvCity = {}; // { "AB|calgary": ["48004","48005",...] }

  for (const r of mpsData.ridings) {
    // Extract city-like words from riding name
    const words = r.name.split(/[—–\-\/\s,]+/).filter(w => w.length > 2);
    for (const word of words) {
      const key = r.province + '|' + norm(word);
      if (!byProvCity[key]) byProvCity[key] = new Set();
      byProvCity[key].add(r.ridingCode);
    }
  }

  // Convert sets to arrays
  for (const k of Object.keys(byProvCity)) {
    byProvCity[k] = [...byProvCity[k]];
  }
  return byProvCity;
}

function matchCityToRiding(city, province, lookup) {
  if (!city || !province) return null;

  // Clean city name (some have pipe-delimited duplicates like "Moncton|Moncton")
  const cleanCity = city.split('|')[0].trim();
  const prov = PROV_NORM[province.trim().toUpperCase()];
  if (!prov) return null;

  // Territories — single riding
  if (prov === 'NT') return ['61001'];
  if (prov === 'NU') return ['62001'];
  if (prov === 'YT') return ['60001'];

  const key = prov + '|' + norm(cleanCity);
  if (lookup[key]) return lookup[key];

  // Try first word
  const firstWord = cleanCity.split(/[\s,;-]+/)[0];
  if (firstWord.length > 3) {
    const fkey = prov + '|' + norm(firstWord);
    if (lookup[fkey]?.length <= 5) return lookup[fkey];
  }

  return null;
}

async function main() {
  if (process.argv.includes('--download') || !fs.existsSync(CSV_PATH)) {
    await downloadCSV();
  }

  if (!fs.existsSync(CSV_PATH)) {
    console.error('[grants] CSV not found. Run with --download first, or place at ' + CSV_PATH);
    process.exit(1);
  }

  console.log('[grants] Loading riding data and spending...');
  const spending = JSON.parse(fs.readFileSync(SPENDING, 'utf8'));
  const cityLookup = buildCityLookup();

  // Track new grants per riding
  const grantsByRiding = {}; // { ridingCode: { totalValue, count, byAgency, projects[] } }

  console.log('[grants] Streaming CSV (this takes 1-2 minutes)...');

  return new Promise((resolve, reject) => {
    const parser = createReadStream(CSV_PATH).pipe(parse({
      columns: true, bom: true, relax_quotes: true, relax_column_count: true
    }));

    let processed = 0, matched = 0, rdaCount = 0, totalVal = 0;

    parser.on('data', (row) => {
      const org = (row.owner_org || '').trim().toLowerCase();
      if (!RDA_ORGS.has(org)) return;
      rdaCount++;

      const value = parseFloat(row.agreement_value) || 0;
      if (value <= 0) return; // skip negative amendments and zero-value

      const city = (row.recipient_city || '').trim();
      const province = (row.recipient_province || '').trim();
      const recipient = (row.recipient_legal_name || '').trim();
      const title = (row.agreement_title_en || '').trim();
      const program = (row.prog_name_en || '').trim();
      const ridingNum = (row.federal_riding_number || '').trim();

      // Try riding number first (5-digit format)
      let ridings = null;
      if (ridingNum && ridingNum.length === 5 && spending[ridingNum]) {
        ridings = [ridingNum];
      }

      // Fall back to city matching
      if (!ridings) {
        ridings = matchCityToRiding(city, province, cityLookup);
      }

      if (!ridings || ridings.length === 0) return;

      matched++;
      totalVal += value;
      const share = value / ridings.length;

      for (const code of ridings) {
        if (!grantsByRiding[code]) {
          grantsByRiding[code] = { totalValue: 0, count: 0, byAgency: {}, projects: [] };
        }
        const gr = grantsByRiding[code];
        gr.totalValue += share;
        gr.count++;

        const label = RDA_LABELS[org] || org;
        gr.byAgency[label] = (gr.byAgency[label] || 0) + share;

        // Keep top grants
        if (gr.projects.length < 15 || share > 50000) {
          gr.projects.push({
            title: (title || recipient).substring(0, 120),
            federal: Math.round(share),
            program: label + ': ' + (program || '').substring(0, 60),
            category: 'Regional Development',
            recipient: recipient.substring(0, 80),
          });
        }
      }
    });

    parser.on('end', () => {
      console.log(`[grants] Processed ${rdaCount} RDA records, matched ${matched}`);
      console.log(`[grants] Total value matched: $${(totalVal/1e9).toFixed(1)}B`);
      console.log(`[grants] Ridings with grant data: ${Object.keys(grantsByRiding).length}`);

      // Merge into spending
      let mergedCount = 0;
      for (const [code, gr] of Object.entries(grantsByRiding)) {
        if (!spending[code]) continue;
        mergedCount++;

        // Add to total federal
        spending[code].totalFederal += Math.round(gr.totalValue);

        // Add "Regional Development" category
        spending[code].byCategory['Regional Development'] =
          (spending[code].byCategory['Regional Development'] || 0) + Math.round(gr.totalValue);

        // Add top grant projects (sort by value, keep top 5)
        const topGrants = gr.projects.sort((a, b) => b.federal - a.federal).slice(0, 5);
        spending[code].projects = [...spending[code].projects, ...topGrants]
          .sort((a, b) => b.federal - a.federal)
          .slice(0, 10);

        spending[code].projectCount += gr.count;
      }

      // Write updated spending
      fs.writeFileSync(SPENDING, JSON.stringify(spending, null, 0));
      console.log(`[grants] Merged into ${mergedCount} ridings`);
      console.log(`[grants] Written to ${SPENDING}`);

      // Province breakdown
      const ps = {};
      for (const [code, gr] of Object.entries(grantsByRiding)) {
        const prov = spending[code]?.province;
        if (!prov) continue;
        if (!ps[prov]) ps[prov] = { count: 0, value: 0 };
        ps[prov].count += gr.count;
        ps[prov].value += gr.totalValue;
      }
      console.log('\nGrants by province:');
      console.log('Prov  Grants    Value');
      for (const [p, s] of Object.entries(ps).sort()) {
        console.log(`${p.padEnd(4)} ${String(s.count).padStart(7)}   $${(s.value/1e6).toFixed(0).padStart(6)}M`);
      }

      resolve();
    });

    parser.on('error', reject);
  });
}

main().catch(err => { console.error('[grants] Fatal:', err); process.exit(1); });
