#!/usr/bin/env node
/**
 * Save a score snapshot for all ridings, cities, and provinces.
 * Run after generate-all.js to capture today's scores.
 * Over time, builds historical trend data.
 *
 * Usage: node save-snapshot.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch {}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bangforyourduck',
    charset: 'utf8mb4',
    decimalNumbers: true,
  });

  const today = new Date().toISOString().split('T')[0];
  const apiDir = path.join(__dirname, '..', 'api');

  // Ridings
  const mps = JSON.parse(fs.readFileSync(path.join(apiDir, 'mps.json'), 'utf8'));
  for (const r of mps.ridings) {
    const c = r.categories;
    await db.query(
      `INSERT INTO score_snapshots_ridings (snapshot_date, riding_code, composite, duck_score, investment_score, transfers_score, expenses_score, performance_score, electoral_score, demographics_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE composite=VALUES(composite), duck_score=VALUES(duck_score),
         investment_score=VALUES(investment_score), transfers_score=VALUES(transfers_score),
         expenses_score=VALUES(expenses_score), performance_score=VALUES(performance_score)`,
      [today, r.ridingCode, r.composite, r.duckScore, c.investment?.score, c.transfers?.score, c.expenses?.score, c.performance?.score, c.electoral?.score, c.demographics?.score]
    );
  }

  // Cities
  const cities = JSON.parse(fs.readFileSync(path.join(apiDir, 'cities.json'), 'utf8'));
  for (const c of cities.cities) {
    const cats = c.categories;
    await db.query(
      `INSERT INTO score_snapshots_cities (snapshot_date, cma_code, composite, duck_score, housing_score, safety_score, fiscal_score, liveability_score, economic_score, community_score, infrastructure_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE composite=VALUES(composite), duck_score=VALUES(duck_score)`,
      [today, c.cmaCode, c.composite, c.duckScore, cats.housing?.score, cats.safety?.score, cats.fiscal?.score, cats.liveability?.score, cats.economic?.score, cats.community?.score, cats.infrastructure?.score]
    );
  }

  // Provinces
  const provs = JSON.parse(fs.readFileSync(path.join(apiDir, 'data.json'), 'utf8'));
  for (const p of provs.provinces) {
    await db.query(
      `INSERT INTO score_snapshots_provinces (snapshot_date, province_code, composite, duck_score)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE composite=VALUES(composite), duck_score=VALUES(duck_score)`,
      [today, p.code || p.provinceCode, p.composite, p.duckScore || p.valueScore]
    );
  }

  console.log(`[snapshot] Saved ${mps.ridings.length} ridings + ${cities.cities.length} cities + ${provs.provinces.length} provinces for ${today}`);
  await db.end();
}

main().catch(err => { console.error('[snapshot] Error:', err.message); process.exit(1); });
