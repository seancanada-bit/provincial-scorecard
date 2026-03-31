#!/usr/bin/env node
/**
 * Migrate all data from Supabase (PostgreSQL) to MySQL-compatible SQL.
 *
 * Outputs:
 *   mysql-schema.sql  — CREATE TABLE statements (MySQL 8 syntax)
 *   mysql-seed.sql    — INSERT statements for all data
 *
 * Usage: cd backend && node migrate-to-mysql.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:moctyh-kYtdin-tuzhy6@db.vwuglfvcitnkvwhpppov.supabase.co:5432/postgres';

// PostgreSQL → MySQL type mapping
const TYPE_MAP = {
  'integer':                  'INT',
  'bigint':                   'BIGINT',
  'smallint':                 'SMALLINT',
  'serial':                   'INT AUTO_INCREMENT',
  'numeric':                  'DECIMAL(12,4)',
  'real':                     'FLOAT',
  'double precision':         'DOUBLE',
  'text':                     'TEXT',
  'character varying':        'VARCHAR(255)',
  'boolean':                  'TINYINT(1)',
  'date':                     'DATE',
  'timestamp without time zone': 'DATETIME',
  'timestamp with time zone':    'DATETIME',
  'jsonb':                    'JSON',
  'json':                     'JSON',
  'uuid':                     'CHAR(36)',
};

function pgTypeToMysql(pgType, columnName, isPK) {
  // Primary key TEXT columns → VARCHAR
  if (pgType === 'text' && isPK) return 'VARCHAR(100)';
  // Foreign key TEXT columns that reference other tables → VARCHAR
  if (pgType === 'text' && (columnName.endsWith('_code') || columnName === 'province_code' || columnName === 'riding_code' || columnName === 'cma_code'))
    return 'VARCHAR(20)';
  return TYPE_MAP[pgType] || 'TEXT';
}

function escapeMySQL(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString().split('T')[0]}'`;
  // Escape single quotes and backslashes
  return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

async function main() {
  console.log('[migrate] Connecting to Supabase PostgreSQL...');
  const pg = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  // Get all public tables
  const tablesRes = await pg.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const tableNames = tablesRes.rows.map(r => r.table_name);
  console.log(`[migrate] Found ${tableNames.length} tables`);

  let schemaSQL = '-- MySQL 8 Schema for Bang for Your Duck\n';
  schemaSQL += '-- Auto-generated from Supabase PostgreSQL\n';
  schemaSQL += `-- Generated: ${new Date().toISOString()}\n\n`;
  schemaSQL += 'SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n';

  let seedSQL = '-- MySQL Seed Data for Bang for Your Duck\n';
  seedSQL += `-- Generated: ${new Date().toISOString()}\n\n`;
  seedSQL += 'SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n';

  for (const table of tableNames) {
    console.log(`  Processing ${table}...`);

    // Get column info
    const colsRes = await pg.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    // Get primary key
    const pkRes = await pg.query(`
      SELECT a.attname
      FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass AND i.indisprimary
    `, [table]);
    const pkCols = pkRes.rows.map(r => r.attname);

    // Generate CREATE TABLE
    schemaSQL += `-- ${table}\n`;
    schemaSQL += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    schemaSQL += `CREATE TABLE \`${table}\` (\n`;

    const colDefs = colsRes.rows.map(col => {
      const isPK = pkCols.includes(col.column_name);
      let mysqlType = pgTypeToMysql(col.data_type, col.column_name, isPK);

      // Handle serial/auto_increment
      if (col.column_default && col.column_default.includes('nextval')) {
        mysqlType = 'INT AUTO_INCREMENT';
      }

      let def = `  \`${col.column_name}\` ${mysqlType}`;
      if (col.is_nullable === 'NO') def += ' NOT NULL';
      if (col.column_default === 'true') def += ' DEFAULT 1';
      else if (col.column_default === 'false') def += ' DEFAULT 0';
      else if (col.column_default === 'CURRENT_DATE' || col.column_default === 'current_date') def += ' DEFAULT (CURRENT_DATE)';
      return def;
    });

    if (pkCols.length) {
      colDefs.push(`  PRIMARY KEY (${pkCols.map(c => '`' + c + '`').join(', ')})`);
    }

    schemaSQL += colDefs.join(',\n');
    schemaSQL += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    // Get all data
    const dataRes = await pg.query(`SELECT * FROM ${table}`);
    if (dataRes.rows.length > 0) {
      const cols = colsRes.rows.map(c => c.column_name);

      // Batch inserts (100 rows per INSERT for performance)
      const BATCH = 100;
      for (let i = 0; i < dataRes.rows.length; i += BATCH) {
        const batch = dataRes.rows.slice(i, i + BATCH);
        seedSQL += `INSERT INTO \`${table}\` (${cols.map(c => '`' + c + '`').join(', ')}) VALUES\n`;
        const rows = batch.map(row => {
          const vals = cols.map(col => escapeMySQL(row[col]));
          return `  (${vals.join(', ')})`;
        });
        seedSQL += rows.join(',\n') + ';\n\n';
      }
    }
  }

  schemaSQL += 'SET FOREIGN_KEY_CHECKS = 1;\n';
  seedSQL += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  // Write files
  const schemaPath = path.join(__dirname, '..', 'mysql-schema.sql');
  const seedPath = path.join(__dirname, '..', 'mysql-seed.sql');
  fs.writeFileSync(schemaPath, schemaSQL);
  fs.writeFileSync(seedPath, seedSQL);

  console.log(`\n[migrate] Schema written to: ${schemaPath} (${(schemaSQL.length / 1024).toFixed(1)} KB)`);
  console.log(`[migrate] Seed data written to: ${seedPath} (${(seedSQL.length / 1024).toFixed(1)} KB)`);
  console.log(`[migrate] Total tables: ${tableNames.length}`);

  await pg.end();
}

main().catch(err => { console.error('[migrate] Fatal:', err.message); process.exit(1); });
