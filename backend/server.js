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

const { fetchAllSupabaseData, getSupabaseClient } = require('./supabase');
const { scoreProvince, normalizeCategoryScores, buildNationalSummary } = require('./scoring');

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

// Stats cache (5-minute TTL — light queries, no need to hit DB every request)
let statsCache = null;
let statsCacheTs = 0;
const STATS_TTL = 5 * 60 * 1000;

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
    // 1. Fetch all data from Supabase
    const supa = await fetchAllSupabaseData().catch(() => null);

    if (!supa) {
      console.warn('[refresh] Supabase fetch failed, using fallback');
      cache = loadFallback();
      return;
    }

    // 2. Assemble per-province raw objects and score them
    const rawScored = supa.meta.map(meta => {
      const code = meta.province_code;
      const rawProvince = {
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
        costOfLiving:   supa.costOfLiving[code]     ?? null,
        mentalHealth:   supa.mentalHealth[code]     ?? null,
        ltc:            supa.ltc[code]              ?? null,
      };
      return scoreProvince(rawProvince);
    });

    // 3. Peer-normalize so the top Canadian province per category scores 87 (B)
    const scoredProvinces = normalizeCategoryScores(rawScored);

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

// ─── EVENT TRACKING ──────────────────────────────────────────────────────────
const VALID_EVENTS = new Set([
  'province_expanded', 'tab_viewed', 'sort_changed', 'methodology_opened',
]);

app.post('/api/event', express.json({ limit: '2kb' }), async (req, res) => {
  // Always respond immediately — never block the browser
  res.json({ ok: true });

  try {
    const { event, province, detail, referrer, device } = req.body ?? {};
    if (!event || !VALID_EVENTS.has(event)) return;

    const sb = getSupabaseClient();
    await sb.from('events').insert({
      event,
      province:  province  ?? null,
      detail:    detail    ?? null,
      referrer:  referrer  ?? null,
      device:    device    ?? null,
    });
  } catch {
    // Silently ignore — tracking must never surface errors
  }
});

// ─── STATS (what people are clicking) ────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    if (statsCache && Date.now() - statsCacheTs < STATS_TTL) {
      return res.setHeader('Cache-Control', 'public, max-age=300').json(statsCache);
    }

    const sb  = getSupabaseClient();
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: provRows }, { data: tabRows }] = await Promise.all([
      sb.from('events').select('province').eq('event', 'province_expanded').gte('ts', since).not('province', 'is', null),
      sb.from('events').select('detail').eq('event', 'tab_viewed').gte('ts', since).not('detail', 'is', null),
    ]);

    const countBy = (rows, key) => {
      const counts = {};
      (rows ?? []).forEach(r => { if (r[key]) counts[r[key]] = (counts[r[key]] ?? 0) + 1; });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, count]) => ({ name, count }));
    };

    statsCache = {
      topProvinces: countBy(provRows, 'province'),
      topTabs:      countBy(tabRows,  'detail'),
      total:        (provRows?.length ?? 0) + (tabRows?.length ?? 0),
    };
    statsCacheTs = Date.now();

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(statsCache);
  } catch (err) {
    console.error('[stats]', err.message);
    res.json({ topProvinces: [], topTabs: [], total: 0 });
  }
});

app.get('/api/data', async (req, res) => {
  // Trigger refresh if cache is stale or empty
  if (!cache || Date.now() - cacheTimestamp > CACHE_TTL_MS) {
    await refresh();
  }

  const payload = cache || loadFallback();
  if (!payload) return res.status(503).json({ error: 'Data not yet available. Try again shortly.' });

  res.setHeader('Cache-Control', 'private, max-age=3600');
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
