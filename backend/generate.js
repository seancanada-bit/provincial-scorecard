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
const { fetchStatsCanadaData } = require('./statscanada');
const { scoreProvince, buildNationalSummary } = require('./scoring');

const OUT_PATH = path.join(__dirname, '../frontend/src/data/fallback.json');

async function generate() {
  console.log('[generate] Fetching data…');

  const [supaResult, statsResult] = await Promise.allSettled([
    fetchAllSupabaseData(),
    fetchStatsCanadaData(),
  ]);

  const supa = supaResult.status  === 'fulfilled' ? supaResult.value  : null;
  const sc   = statsResult.status === 'fulfilled' ? statsResult.value : null;

  if (!supa) {
    throw new Error(`Supabase fetch failed: ${supaResult.reason?.message ?? 'unknown error'}`);
  }
  if (!sc) {
    console.warn('[generate] Stats Canada unavailable — economy scores will use cached values');
  }

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
      statscan:       sc?.[code]                 ?? null,
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
