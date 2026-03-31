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

const { fetchAllSupabaseData, fetchAllCitiesData, fetchAllRidingsData, getSupabaseClient } = require('./supabase');
const { scoreProvince, normalizeCategoryScores, buildNationalSummary } = require('./scoring');
const { scoreCity, normalizeCityScores, buildCitiesSummary } = require('./scoring-cities');
const { scoreRiding, normalizeRidingScores, buildRidingsSummary } = require('./scoring-mps');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Allow any origin whose hostname is bangforyourduck.ca or a subdomain of it,
// regardless of protocol — covers http/https, www, and hosting-provider mirrors.
function isTrustedOrigin(origin) {
  if (!origin) return true; // curl, mobile apps, no-origin requests
  try {
    const host = new URL(origin).hostname;
    return host === 'bangforyourduck.ca' || host.endsWith('.bangforyourduck.ca');
  } catch { return false; }
}

app.use(cors({
  origin: (origin, cb) => {
    if (!allowedOrigins.length || isTrustedOrigin(origin) || allowedOrigins.includes(origin))
      return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

// ─── IN-MEMORY CACHE ─────────────────────────────────────────────────────────
let cache = null;        // provinces payload
let cacheTimestamp = 0;
let refreshRunning = false;

let citiesCache = null;  // cities payload
let citiesCacheTs = 0;
let citiesRefreshRunning = false;

let mpsCache = null;     // MPs/ridings payload
let mpsCacheTs = 0;
let mpsRefreshRunning = false;

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
        fiscal:         supa.fiscal[code]           ?? null,
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

// ─── CITIES REFRESH ──────────────────────────────────────────────────────────
async function refreshCities() {
  if (citiesRefreshRunning) return;
  citiesRefreshRunning = true;
  console.log('[cities] Starting refresh at', new Date().toISOString());

  try {
    const supa = await fetchAllCitiesData().catch(() => null);
    if (!supa) {
      console.warn('[cities] Fetch failed — serving stale cache');
      return;
    }

    const rawScored = supa.meta.map(meta => {
      const code = meta.cma_code;
      return scoreCity({
        meta,
        housing:        supa.housing[code]        ?? null,
        safety:         supa.safety[code]         ?? null,
        fiscal:         supa.fiscal[code]         ?? null,
        liveability:    supa.liveability[code]    ?? null,
        economic:       supa.economic[code]       ?? null,
        community:      supa.community[code]      ?? null,
        infrastructure: supa.infrastructure[code] ?? [],
      });
    });

    const scoredCities = normalizeCityScores(rawScored);
    const national     = buildCitiesSummary(scoredCities);

    citiesCache = { lastUpdated: new Date().toISOString(), national, cities: scoredCities };
    citiesCacheTs = Date.now();
    console.log(`[cities] Done. ${scoredCities.length} cities scored.`);
  } catch (err) {
    console.error('[cities] Unexpected error:', err.message);
  } finally {
    citiesRefreshRunning = false;
  }
}

// ─── MPS/RIDINGS REFRESH ─────────────────────────────────────────────────────
async function refreshMps() {
  if (mpsRefreshRunning) return;
  mpsRefreshRunning = true;
  console.log('[mps] Starting refresh at', new Date().toISOString());

  try {
    const supa = await fetchAllRidingsData().catch(() => null);
    if (!supa) {
      console.warn('[mps] Fetch failed — serving stale cache');
      return;
    }

    const rawScored = supa.meta.map(meta => {
      const code = meta.riding_code;
      return scoreRiding({
        meta,
        performance:  supa.performance[code]  ?? null,
        investment:   supa.investment[code]   ?? null,
        electoral:    supa.electoral[code]    ?? null,
        demographics: supa.demographics[code] ?? null,
        expenses:     supa.expenses[code]     ?? null,
        transfers:    supa.transfers[code]    ?? null,
      });
    });

    const scoredRidings = normalizeRidingScores(rawScored);
    const national      = buildRidingsSummary(scoredRidings);

    mpsCache = { lastUpdated: new Date().toISOString(), national, ridings: scoredRidings };
    mpsCacheTs = Date.now();
    console.log(`[mps] Done. ${scoredRidings.length} ridings scored.`);
  } catch (err) {
    console.error('[mps] Unexpected error:', err.message);
  } finally {
    mpsRefreshRunning = false;
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

app.get('/api/mps', async (req, res) => {
  if (!mpsCache || Date.now() - mpsCacheTs > CACHE_TTL_MS) {
    await refreshMps();
  }
  if (!mpsCache) return res.status(503).json({ error: 'MPs data not yet available.' });
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.json(mpsCache);
});

app.get('/api/cities', async (req, res) => {
  if (!citiesCache || Date.now() - citiesCacheTs > CACHE_TTL_MS) {
    await refreshCities();
  }
  if (!citiesCache) return res.status(503).json({ error: 'Cities data not yet available.' });
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.json(citiesCache);
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

  // Prime the caches on startup (non-blocking)
  refresh();
  refreshCities();
  refreshMps();

  // Schedule 24h refreshes
  setInterval(refresh, CACHE_TTL_MS);
  setInterval(refreshCities, CACHE_TTL_MS);
  setInterval(refreshMps, CACHE_TTL_MS);
});
