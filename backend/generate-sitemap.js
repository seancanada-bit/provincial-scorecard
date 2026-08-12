#!/usr/bin/env node
/**
 * generate-sitemap.js — Build portal/sitemap.xml from the scored JSON data.
 *
 * Reads api/data.json, api/cities.json, and api/mps.json (already generated
 * by generate-all.js) and emits a sitemap covering the static pages plus a
 * deep-link entry for every scored province, city, and riding.
 *
 * Run after generate-all.js so the sitemap always reflects the current set
 * of scored entities.
 *
 * Usage:
 *   node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const BASE = 'https://nonpartisangovernance.ca';
const today = new Date().toISOString().split('T')[0];

const provinces = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'api', 'data.json'), 'utf8'));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'api', 'cities.json'), 'utf8'));
const mps = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'api', 'mps.json'), 'utf8'));

let urls = [];

// Static pages
urls.push({ loc: '/', priority: '1.0', changefreq: 'daily' });
urls.push({ loc: '/provinces/', priority: '0.9', changefreq: 'daily' });
urls.push({ loc: '/cities/', priority: '0.9', changefreq: 'daily' });
urls.push({ loc: '/mps/', priority: '0.9', changefreq: 'daily' });
urls.push({ loc: '/methodology/', priority: '0.7', changefreq: 'monthly' });

// Province pages (for future deep links)
for (const p of provinces.provinces || []) {
  urls.push({ loc: `/provinces/#${encodeURIComponent(p.code)}`, priority: '0.8', changefreq: 'daily' });
}

// City pages
for (const c of cities.cities || []) {
  const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  urls.push({ loc: `/cities/#${slug}`, priority: '0.7', changefreq: 'daily' });
}

// MP/riding pages
for (const r of mps.ridings || []) {
  const slug = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  urls.push({ loc: `/mps/#${slug}`, priority: '0.7', changefreq: 'daily' });
}

// Generate XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

const outPath = path.join(__dirname, '..', 'portal', 'sitemap.xml');
fs.writeFileSync(outPath, xml);
console.log(`✓ Sitemap generated: ${urls.length} URLs → ${outPath}`);
