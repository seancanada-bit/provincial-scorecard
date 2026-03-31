#!/usr/bin/env node
/**
 * Scrape MP performance data from OpenParliament.ca API
 * Fetches: vote participation (ballots), speeches, bills, committees
 * Writes to: ridings_mp_performance table in Supabase
 *
 * Usage: node scrape-mp-performance.js
 */

const https = require('https');
const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:moctyh-kYtdin-tuzhy6@db.vwuglfvcitnkvwhpppov.supabase.co:5432/postgres';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : 'https://api.openparliament.ca' + url;
    const parsed = new URL(fullUrl);
    if (!parsed.searchParams.has('format')) parsed.searchParams.set('format', 'json');

    https.get(parsed.toString(), { headers: { 'Accept': 'application/json', 'User-Agent': 'BangForYourDuck/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Parse error on ' + fullUrl)); }
      });
    }).on('error', reject);
  });
}

async function countAll(baseUrl) {
  let count = 0;
  let url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'format=json&limit=500';
  while (url) {
    const d = await fetchJSON(url);
    count += (d.objects || []).length;
    url = d.pagination?.next_url || null;
  }
  return count;
}

// Get total votes in 45-1 session for participation rate calculation
async function getTotalSessionVotes() {
  let total = 0;
  let url = '/votes/?format=json&session=45-1&limit=500';
  while (url) {
    const d = await fetchJSON(url);
    total += d.objects.length;
    url = d.pagination?.next_url || null;
  }
  return total;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('[scrape] Starting MP performance scrape...');

  // Get all current MPs
  const mpList = await fetchJSON('/politicians/?format=json&limit=500');
  console.log(`[scrape] Found ${mpList.objects.length} current MPs`);

  // Get total session votes for participation calculation
  const totalVotes = await getTotalSessionVotes();
  console.log(`[scrape] Total 45-1 session votes: ${totalVotes}`);

  const results = [];
  let processed = 0;

  for (const mp of mpList.objects) {
    const slug = mp.url.replace(/^\/politicians\//, '').replace(/\/$/, '');
    const ridingName = mp.current_riding?.name?.en;
    const province = mp.current_riding?.province;

    if (!ridingName) {
      console.log(`  [skip] ${mp.name} — no riding`);
      continue;
    }

    try {
      // Fetch MP detail for related URLs
      const detail = await fetchJSON(mp.url + '?format=json');
      const related = detail.related || {};

      // Count ballots (votes this MP participated in)
      const ballots = related.ballots_url ? await countAll(related.ballots_url) : 0;

      // Count speeches in current session
      const speechUrl = related.speeches_url ? related.speeches_url + (related.speeches_url.includes('?') ? '&' : '?') + 'session=45-1' : null;
      const speeches = speechUrl ? await countAll(speechUrl) : 0;

      // Count sponsored bills
      const bills = related.sponsored_bills_url ? await countAll(related.sponsored_bills_url) : 0;

      // Committee count from memberships
      const committees = (detail.memberships || []).filter(m => {
        const label = m.label?.en || '';
        return label.toLowerCase().includes('committee') && !m.end_date;
      }).length;

      // Vote participation as percentage
      const voteParticipation = totalVotes > 0 ? Math.round((ballots / totalVotes) * 1000) / 10 : null;

      // Determine if opposition
      const party = mp.current_party?.short_name?.en || '';
      const isOpposition = party !== 'Liberal'; // Liberals are government

      results.push({
        ridingName,
        province,
        mpName: mp.name,
        voteParticipation,
        ballots,
        speeches,
        bills,
        committees,
        isOpposition,
      });

      processed++;
      if (processed % 20 === 0) {
        console.log(`  [${processed}/${mpList.objects.length}] ${mp.name}: votes=${voteParticipation}%, speeches=${speeches}, bills=${bills}`);
      }

      // Rate limiting — be respectful
      await sleep(200);

    } catch (err) {
      console.error(`  [error] ${mp.name}: ${err.message}`);
      results.push({ ridingName, province, mpName: mp.name, voteParticipation: null, ballots: 0, speeches: 0, bills: 0, committees: 0, isOpposition: true });
    }
  }

  console.log(`\n[scrape] Scraped ${results.length} MPs. Writing to database...`);

  // Connect to DB and insert
  const db = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();

  // Match by riding name + province to get riding_code
  let inserted = 0, skipped = 0;
  for (const r of results) {
    const match = await db.query(
      "SELECT riding_code FROM ridings_meta WHERE riding_name = $1 AND province_code = $2",
      [r.ridingName, r.province]
    );

    if (!match.rows.length) {
      // Try fuzzy match
      const fuzzy = await db.query(
        "SELECT riding_code, riding_name FROM ridings_meta WHERE province_code = $1 AND riding_name ILIKE $2",
        [r.province, '%' + r.ridingName.split('—')[0].split('–')[0].trim() + '%']
      );
      if (!fuzzy.rows.length) {
        console.log(`  [skip] No DB match for: ${r.ridingName} (${r.province})`);
        skipped++;
        continue;
      }
      match.rows = fuzzy.rows;
    }

    const code = match.rows[0].riding_code;
    await db.query(`
      INSERT INTO ridings_mp_performance
        (riding_code, vote_participation_pct, bills_introduced, bills_passed, committee_memberships, speeches_count, is_opposition, source_notes, data_date)
      VALUES ($1, $2, $3, null, $4, $5, $6, 'OpenParliament.ca API', '2026-03-31')
      ON CONFLICT (riding_code) DO UPDATE SET
        vote_participation_pct = EXCLUDED.vote_participation_pct,
        bills_introduced = EXCLUDED.bills_introduced,
        committee_memberships = EXCLUDED.committee_memberships,
        speeches_count = EXCLUDED.speeches_count,
        is_opposition = EXCLUDED.is_opposition,
        data_date = EXCLUDED.data_date
    `, [code, r.voteParticipation, r.bills, r.committees, r.speeches, r.isOpposition]);
    inserted++;
  }

  const count = await db.query('SELECT COUNT(*) AS n FROM ridings_mp_performance');
  console.log(`\n[scrape] Done. Inserted: ${inserted}, Skipped: ${skipped}, Total in DB: ${count.rows[0].n}`);

  await db.end();
}

main().catch(err => { console.error('[scrape] Fatal:', err.message); process.exit(1); });
