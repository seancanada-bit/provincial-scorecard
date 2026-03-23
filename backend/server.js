/**
 * Provincial Scorecard - Backend API
 * Two endpoints: GET /api/data and GET /health
 * All heavy lifting is done in the 24h background refresh cycle.
 * Target: under 250 lines.
 */

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');

const { fetchAllSupabaseData }  = require('./supabase');
const { fetchStatsCanadaData }  = require('./statscanada');
const { scoreProvince, buildNationalSummary } = require('./scoring');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps) and configured origins
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

// ─── IN-MEMORY CACHE ─────────────────────────────────────────────────────────
let cache = null;        // The full scored JSON payload
let cacheTimestamp = 0;  // Unix ms of last successful refresh
let refreshRunning = false;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_PATH = path.join(__dirname, 'data', 'fallback-cache.json');

function loadFallback() {
  try {
    const raw = fs.readFileSync(FALLBACK_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── REFRESH LOGIC ───────────────────────────────────────────────────────────
async function refresh() {
  if (refreshRunning) return;
  refreshRunning = true;
  console.log('[refresh] Starting data refresh at', new Date().toISOString());

  try {
    // 1. Fetch from both sources in parallel
    const [supaData, statscanData] = await Promise.allSettled([
      fetchAllSupabaseData(),
      fetchStatsCanadaData(),
    ]);

    const supa   = supaData.status   === 'fulfilled' ? supaData.value   : null;
    const sc     = statscanData.status === 'fulfilled' ? statscanData.value : null;

    if (!supa) {
      console.warn('[refresh] Supabase fetch failed, using fallback');
      cache = loadFallback();
      return;
    }

    // 2. Assemble per-province raw objects and score them
    const scoredProvinces = supa.meta.map(meta => {
      const code = meta.province_code;
      const rawProvince = {
        meta,
        healthcare:     supa.healthcare[code]     ?? null,
        housing:        supa.housing[code]         ?? null,
        credit:         supa.credit[code]          ?? null,
        polling:        supa.polling[code]         ?? null,
        governance:     supa.governance[code]      ?? null,
        infrastructure: supa.infrastructure[code]  ?? [],
        statscan:       sc?.[code]                 ?? null,
      };
      return scoreProvince(rawProvince);
    });

    const national = buildNationalSummary(scoredProvinces);

    cache = {
      lastUpdated: new Date().toISOString(),
      national,
      provinces: scoredProvinces,
      supporters: supa.supporters ?? [],
    };

    cacheTimestamp = Date.now();
    console.log(`[refresh] Done. ${scoredProvinces.length} provinces scored.`);

  } catch (err) {
    console.error('[refresh] Unexpected error:', err.message);
    if (!cache) cache = loadFallback();
  } finally {
    refreshRunning = false;
  }
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/api/data', async (req, res) => {
  // Trigger refresh if cache is stale or empty
  if (!cache || Date.now() - cacheTimestamp > CACHE_TTL_MS) {
    await refresh();
  }

  const payload = cache || loadFallback();
  if (!payload) return res.status(503).json({ error: 'Data not yet available. Try again shortly.' });

  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(payload);
});

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Provincial Scorecard API listening on port ${PORT}`);

  // Prime the cache on startup (non-blocking)
  refresh();

  // Schedule 24h refresh
  setInterval(refresh, CACHE_TTL_MS);
});
