# Provincial Scorecard

Free, nonpartisan grades for all ten Canadian provinces on healthcare delivery, housing affordability, fiscal responsibility, infrastructure delivery, and economic/governance health.

---

## Quick overview

| Layer | Tech | Hosting |
|---|---|---|
| Frontend | React 18 + Vite | Shared web host (FTP upload of `dist/`) |
| Backend API | Node 20 + Express | Render.com free tier |
| Database | Supabase (PostgreSQL) | Supabase free tier |

The backend fetches Stats Canada and Supabase data **once every 24 hours**, caches in memory, and serves a single `/api/data` endpoint. The frontend is fully static — it fetches that one endpoint on page load and renders everything client-side.

---

## Table of contents

1. [Supabase setup and data entry](#1-supabase-setup-and-data-entry)
2. [Updating province data (primary workflow)](#2-updating-province-data-no-code-required)
3. [Local development](#3-local-development)
4. [Building and uploading the frontend](#4-building-and-uploading-the-frontend)
5. [Render.com deployment checklist](#5-rendercom-deployment-checklist)
6. [UptimeRobot monitor setup](#6-uptimerobot-monitor-setup)
7. [Ko-fi setup](#7-ko-fi-setup)
8. [EthicalAds activation](#8-ethicalads-activation)
9. [Recommended update schedule](#9-recommended-update-schedule)
10. [Scoring methodology summary](#10-scoring-methodology-summary)

---

## 1. Supabase setup and data entry

### One-time setup

1. Create a free Supabase account at supabase.com
2. Create a new project (pick a region close to Canada — US East or Toronto if available)
3. Go to **SQL Editor** in the Supabase dashboard
4. Open `supabase-schema.sql` from this repo and run it in the SQL editor
   - This creates all tables and seeds the initial data for all 10 provinces
5. Note your project URL and `anon` key from **Project Settings → API**
   - You'll need these as environment variables for the Render backend

---

## 2. Updating province data (no code required)

This is the **primary maintenance workflow**. Everything below is done in the Supabase Table Editor — no GitHub commits or Render redeploys required.

### How to open the Table Editor

1. Log in at supabase.com → select your project
2. Click **Table Editor** in the left sidebar
3. Select the table you want to update from the list

---

### Updating healthcare data (annually — Fraser Institute / CIHI release)

Table: `provinces_healthcare`

1. In Table Editor, click the table name
2. Find the row for the province you're updating (filter by `province_code`)
3. Click the row to edit it
4. Update these fields:
   - `surgical_wait_weeks` — median weeks from GP referral to treatment (from Fraser Institute "Waiting Your Turn" report)
   - `primary_care_attachment_pct` — % of adults with a regular health provider (from CIHI)
   - `er_benchmark_met_pct` — % of ED visits meeting time-to-physician benchmark (from CIHI NACRS)
   - `source_notes` — update to reflect the new report year
   - `data_date` — set to the report date (e.g., `2026-01-01`)
5. Click **Save**
6. Also update `last_updated_healthcare` in `provinces_meta` for that province

The backend will pick up the new data on its next 24h refresh automatically.

---

### Updating housing data (quarterly — CREA release)

Table: `provinces_housing`

Fields to update:
- `mls_hpi_benchmark` — composite benchmark home price in dollars (from CREA MLS HPI press release)
- `mls_hpi_yoy_pct` — year-over-year % change in benchmark price
- `housing_starts_per_1000_growth` — new starts per 1,000 population growth (from CMHC)
- `rent_inflation_pct` — CPI rent component YoY % (from Stats Canada)
- `data_date` — month of data (e.g., `2026-03-01`)

Also update `last_updated_housing` in `provinces_meta`.

---

### Updating credit ratings (semi-annually)

Table: `provinces_credit`

Fields: `moodys_rating`, `moodys_outlook`, `dbrs_rating`, `dbrs_outlook`, `sp_rating`, `sp_outlook`, `fitch_rating`, `fitch_outlook`

Valid rating values: `Aaa`, `Aa1`, `Aa2`, `Aa3`, `A1`, `A2`, `A3` (Moody's) / `AAA`, `AA+`, `AA`, `AA-`, `A+`, `A`, `A-` (DBRS/S&P/Fitch)

Valid outlook values: `positive`, `stable`, `negative`

Also update `last_updated_credit` in `provinces_meta`.

---

### Updating premier approval polling (quarterly — Angus Reid)

Table: `provinces_polling`

Fields:
- `premier_approval_pct` — % who approve
- `premier_disapproval_pct` — % who disapprove
- `source_notes` — pollster and date (e.g., "Angus Reid May 2026")
- `data_date` — date of polling release

Also update `last_updated_polling` in `provinces_meta`.

---

### Updating infrastructure projects

Table: `infrastructure_projects`

To add a new project: click **Insert row** and fill in all fields.

To update an existing project: find the row, click to edit.

Key fields:
- `overrun_pct` — calculate as `((current_budget - original_budget) / original_budget) * 100`
- `months_delayed` — count from original completion date to current expected completion
- `status` — use: `In Construction`, `Delayed Opening`, `Complete`, `Complete (over budget)`, `In Planning`

To add a completely new project: use the **Insert** button in Table Editor. You don't need to touch any code — the scoring engine reads all rows for a province and averages them automatically.

Also update `last_updated_infrastructure` in `provinces_meta`.

---

### Updating Auditor General opinions (annually)

Table: `provinces_governance`

Fields:
- `ag_opinion` — must be one of: `clean`, `qualified`, `adverse`
- `ag_year` — year of the AG report
- `data_date` — date you entered the data

---

### Adding supporters

Table: `supporters`

When someone supports via Ko-fi, add them here if they opt in to the supporters wall:
- `display_name` — name to display publicly
- `tier` — `coffee`, `lunch`, or `monthly`
- `active` — `true` to show on site, `false` to hide
- `added_date` — auto-fills with today's date

---

## 3. Local development

```bash
# Backend
cd backend
npm install
# Create .env file:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# CORS_ORIGIN=http://localhost:5173
node server.js

# Frontend (separate terminal)
cd frontend
npm install
# Create .env.local:
# VITE_API_URL=http://localhost:3001
npm run dev
```

The frontend dev server runs at http://localhost:5173 and proxies API calls to the backend at port 3001.

---

## 4. Building and uploading the frontend

### Build

```bash
cd frontend
# Make sure .env.production has the correct Render URL:
# VITE_API_URL=https://your-app-name.onrender.com
npm run build
```

This produces `frontend/dist/`.

### Upload via FTP

1. Connect to your shared web host via FTP (FileZilla or your host's file manager)
2. Navigate to the target subdirectory (e.g., `public_html/`)
3. Upload **all contents** of `frontend/dist/` — including the hidden `.htaccess` file
4. Verify `.htaccess` uploaded (some FTP clients hide dotfiles — check "show hidden files" in FileZilla settings)

The `.htaccess` file ensures React Router works correctly and all paths serve `index.html`.

### Verify deployment

1. Visit your domain and check that the app loads
2. Open DevTools → Network → confirm `/api/data` returns 200 with province data
3. Test on mobile at 375px width

---

## 5. Render.com deployment checklist

### First-time setup

1. Sign up at render.com
2. Connect your GitHub account
3. Click **New → Web Service**
4. Select your repository
5. Configure:
   - **Name**: `provincial-scorecard-api` (or your choice)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
6. Add environment variables (Settings → Environment):
   ```
   SUPABASE_URL        = https://your-project.supabase.co
   SUPABASE_ANON_KEY   = your-anon-key
   CORS_ORIGIN         = https://yourdomain.com
   ```
   (PORT is set automatically by Render — do not set it manually)
7. Click **Create Web Service**
8. Wait for the first deploy to complete (2–3 minutes)
9. Note your service URL: `https://your-app-name.onrender.com`

### Update frontend .env.production

Open `frontend/.env.production` and set:
```
VITE_API_URL=https://your-app-name.onrender.com
```

Then rebuild and re-upload the frontend (see step 4).

### Verify

- Visit `https://your-app-name.onrender.com/health` — should return `{"ok":true}`
- Visit `https://your-app-name.onrender.com/api/data` — should return the full JSON payload

### Auto-deploy

Render automatically redeploys the backend on every push to `main`. The frontend is uploaded manually via FTP.

---

## 6. UptimeRobot monitor setup

The Render free tier spins down after 15 minutes of inactivity. UptimeRobot pings the `/health` endpoint every 14 minutes to prevent cold starts.

1. Sign up free at uptimerobot.com
2. Click **Add New Monitor**
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Provincial Scorecard API`
   - **URL**: `https://your-app-name.onrender.com/health`
   - **Monitoring Interval**: 14 minutes
4. Click **Create Monitor**

This uses ~3,150 checks/month — well within UptimeRobot's free 50 monitors × 5-minute limit.

---

## 7. Ko-fi setup

1. Create a Ko-fi account at ko-fi.com
2. Set up your page with a name, description, and goal if desired
3. Find your Ko-fi URL: `https://ko-fi.com/YOUR_USERNAME`
4. Open `frontend/src/components/SupportSection.jsx`
5. Replace the three URL constants at the top:
   ```js
   const KOFI_COFFEE  = 'https://ko-fi.com/YOUR_USERNAME';
   const KOFI_LUNCH   = 'https://ko-fi.com/YOUR_USERNAME';
   const KOFI_MONTHLY = 'https://ko-fi.com/YOUR_USERNAME/tiers';
   ```
6. Rebuild and re-upload the frontend

---

## 8. EthicalAds activation

EthicalAds is a privacy-respecting ad network for developer-focused sites.

When ready to activate:
1. Apply at ethicalads.io
2. Once approved, add their script to `frontend/index.html` (see their docs for the exact snippet)
3. Set `data-ea-publisher` on the `#ethical-ad-unit` div in `App.jsx`
4. The ad unit is already positioned in the desktop right column

---

## 9. Recommended update schedule

| Data category | Source | Frequency | Effort |
|---|---|---|---|
| Stats Canada fiscal, GDP, unemployment, population | Auto via API | Every 24h | None |
| Surgical wait times | Fraser Institute "Waiting Your Turn" | Annually (Jan–Feb) | 30 min |
| Primary care & ER wait benchmarks | CIHI data tables | Annually (fall) | 30 min |
| MLS Home Price Index | CREA monthly release | Quarterly | 15 min |
| Housing starts per 1,000 | CMHC | Annually | 15 min |
| Rent inflation | Auto via Stats Canada API | Every 24h | None |
| Credit ratings | Moody's / DBRS / S&P / Fitch websites | Semi-annually | 20 min |
| Premier approval | Angus Reid releases | Quarterly | 15 min |
| Auditor General opinions | Provincial AG annual reports | Annually (varies by province) | 20 min |
| Infrastructure projects | Provincial budget documents / news | Annually or as reported | 1–2 hrs |

**Minimal annual maintenance** (if doing one pass per year): ~4–5 hours total across all provinces and categories.

---

## 10. Scoring methodology summary

| Category | Weight | Sub-metrics |
|---|---|---|
| Healthcare | 25% | Surgical wait weeks, primary care attachment %, ER benchmark met % |
| Housing | 20% | Housing starts per 1,000 growth, MLS HPI YoY %, rent inflation % |
| Fiscal | 20% | Budget balance % GDP, debt interest cents per dollar, net debt per capita, 3-yr trend (±5) |
| Infrastructure | 15% | Avg cost overrun % (60%), avg delay months (40%) |
| Economy & Governance | 20% | Employment score, GDP growth, credit ratings, AG opinion, premier net approval |

Composite = weighted sum of all five category scores.

Grade thresholds: A+ ≥93 · A ≥87 · A- ≥80 · B+ ≥77 · B ≥73 · B- ≥70 · C+ ≥67 · C ≥60 · C- ≥57 · D ≥40 · F <40
