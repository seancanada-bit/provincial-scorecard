#!/usr/bin/env node
/**
 * Generates frontend/public/og-image.png — 1200×630 Open Graph image.
 * Run: node backend/generate-og.js
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

const OUT = path.join(__dirname, '../frontend/public/og-image.png');

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; }

.top {
  background: #ffffff;
  padding: 52px 72px 44px;
  border-bottom: 5px solid #D52B1E;
}
.site-title {
  font-size: 70px;
  font-weight: 800;
  letter-spacing: -1.5px;
  color: #1A1A1A;
  line-height: 1;
  font-family: Georgia, 'Times New Roman', serif;
}
.site-title .red { color: #D52B1E; }
.subtitle {
  font-size: 24px;
  color: #666;
  margin-top: 14px;
  font-style: italic;
  font-family: Georgia, serif;
  letter-spacing: 0.01em;
}

.bottom {
  background: #1A1A1A;
  padding: 46px 72px 48px;
}
.national-headline {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  margin-bottom: 42px;
  font-family: Georgia, serif;
}
.stats {
  display: flex;
  gap: 60px;
}
.stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 10px;
  font-family: Arial, sans-serif;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  font-family: Arial, sans-serif;
  margin-bottom: 6px;
}
.stat-score {
  font-size: 18px;
  color: #aaa;
  font-family: Arial, sans-serif;
}
.stat-score .grade { color: #D52B1E; font-weight: 700; }
.stat-score .dot   { color: #555; margin: 0 5px; }

.url {
  position: absolute;
  bottom: 28px;
  right: 72px;
  font-size: 13px;
  color: #555;
  font-family: Arial, sans-serif;
  letter-spacing: 0.04em;
}
</style>
</head>
<body style="position:relative">
<div class="top">
  <div class="site-title">Bang for Your <span class="red">Duck</span></div>
  <div class="subtitle">Which province gives you the most for your loonie?</div>
</div>
<div class="bottom">
  <div class="national-headline">Canadian provinces average 66/100 —<br>Quebec leads, Manitoba needs help most.</div>
  <div class="stats">
    <div>
      <div class="stat-label">Best Overall</div>
      <div class="stat-value">Quebec</div>
      <div class="stat-score"><span class="grade">B</span><span class="dot">·</span>76/100</div>
    </div>
    <div>
      <div class="stat-label">Most Urgent</div>
      <div class="stat-value">Manitoba</div>
      <div class="stat-score"><span class="grade">D</span><span class="dot">·</span>55/100</div>
    </div>
    <div>
      <div class="stat-label">Biggest Healthcare Gap</div>
      <div class="stat-value">Ontario</div>
      <div class="stat-score"><span class="grade">D</span><span class="dot">·</span>49/100</div>
    </div>
  </div>
</div>
<div class="url">bangforyourduck.ca</div>
</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page    = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.setContent(HTML, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: OUT, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close();

  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`✓ og-image.png written → ${OUT} (${kb}kb)`);
})();
