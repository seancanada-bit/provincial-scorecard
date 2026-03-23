#!/usr/bin/env node
/**
 * Data generator — run this to refresh the bundled dataset.
 *
 * Usage (local):   node generate.js
 * Usage (CI):      triggered by .github/workflows/refresh-data.yml
 *
 * Reads from: Supabase + Stats Canada
 * Writes to:  ../frontend/src/data/fallback.json
 */

const path = require('path');
const fs   = require('fs');

// Load .env when running locally
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { fetchAllSupabaseData } = require('./supabase');
const { scoreProvince, buildNationalSummary } = require('./scoring');

const OUT_PATH = path.join(__dirname, '../frontend/src/data/fallback.json');

async function generate() {
  console.log('[generate] Fetching data…');

  const supa = await fetchAllSupabaseData();

  const scoredProvinces = supa.meta.map(meta => {
    const code = meta.province_code;
    return scoreProvince({
      meta,
      healthcare:     supa.healthcare[code]     ?? null,
      housing:        supa.housing[code]         ?? null,
      credit:         supa.credit[code]          ?? null,
      polling:        supa.polling[code]         ?? null,
      governance:     supa.governance[code]      ?? null,
      infrastructure: supa.infrastructure[code]  ?? [],
      education:      supa.education[code]       ?? null,
      taxes:          supa.taxes[code]           ?? null,
      safety:         supa.safety[code]          ?? null,
      statscan:       supa.statscan[code]         ?? null,
    });
  });

  const payload = {
    lastUpdated: new Date().toISOString(),
    national:   buildNationalSummary(scoredProvinces),
    provinces:  scoredProvinces,
    supporters: supa.supporters ?? [],
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));

  console.log(`[generate] ✓ ${scoredProvinces.length} provinces scored`);
  console.log(`[generate] ✓ Written → ${OUT_PATH}`);
  console.log(`[generate] lastUpdated: ${payload.lastUpdated}`);
}

generate().catch(err => {
  console.error('[generate] Fatal:', err.message);
  process.exit(1);
});
