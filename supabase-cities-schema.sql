-- ─────────────────────────────────────────────────────────────────────────────
-- Bang for Your Duck: Cities
-- Supabase schema — run once in the SQL editor
-- All 41 Canadian Census Metropolitan Areas
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── CITIES META ─────────────────────────────────────────────────────────────
create table if not exists cities_meta (
  id                          serial primary key,
  cma_code                    text not null unique,   -- Stats Canada 3-digit CMA code
  city_name                   text not null,
  province                    text not null,
  province_abbr               text not null,          -- BC, AB, ON, etc.
  mayor_name                  text,
  population_2021             integer,
  lat                         numeric,                -- for map view
  lng                         numeric,
  last_updated_housing        date,
  last_updated_safety         date,
  last_updated_fiscal         date,
  last_updated_liveability    date,
  last_updated_economic       date,
  last_updated_community      date
);

-- ─── HOUSING AND AFFORDABILITY ───────────────────────────────────────────────
create table if not exists cities_housing (
  id                          serial primary key,
  cma_code                    text not null references cities_meta(cma_code),
  mls_hpi_benchmark           numeric,               -- CREA MLS HPI benchmark price ($)
  mls_hpi_yoy_pct             numeric,               -- year-over-year % change
  avg_rent_2br                numeric,               -- CMHC avg 2BR rent ($/month)
  rent_yoy_pct                numeric,               -- rent inflation year-over-year %
  rent_to_income_ratio        numeric,               -- rent as % of median income
  housing_starts_per_1000_pop numeric,               -- CMHC starts per 1,000 population
  avg_permit_approval_days    integer,               -- avg days to approve residential permit
  source_notes                text,
  data_date                   date
);

-- ─── SAFETY ──────────────────────────────────────────────────────────────────
-- Primary data fetched live from Stats Canada 35-10-0026-01
-- This table stores supplementary / manually curated data
create table if not exists cities_safety (
  id                          serial primary key,
  cma_code                    text not null references cities_meta(cma_code),
  crime_severity_index        numeric,               -- Stats Canada CSI (annual)
  violent_csi                 numeric,               -- violent crime severity index
  csi_yoy_change_pct          numeric,               -- year-over-year % change
  csi_10yr_trend              text,                  -- 'improving' | 'stable' | 'worsening'
  source_notes                text,
  data_date                   date
);

-- ─── FISCAL MANAGEMENT ───────────────────────────────────────────────────────
create table if not exists cities_fiscal (
  id                          serial primary key,
  cma_code                    text not null references cities_meta(cma_code),
  property_tax_residential_rate numeric,             -- mill rate or % of assessed value
  municipal_revenue_per_capita  numeric,             -- $ per resident
  municipal_spending_per_capita numeric,             -- $ per resident
  infrastructure_spending_pct   numeric,             -- % of total budget
  net_debt_per_capita           numeric,             -- $ per resident
  operating_surplus_deficit_per_capita numeric,      -- $ positive = surplus
  source_notes                  text,
  data_date                     date
);

-- ─── LIVEABILITY ─────────────────────────────────────────────────────────────
create table if not exists cities_liveability (
  id                              serial primary key,
  cma_code                        text not null references cities_meta(cma_code),
  transit_ridership_per_capita    numeric,           -- annual rides per resident
  transit_recovery_pct_prepandemic numeric,          -- % of 2019 ridership recovered
  avg_commute_time_mins           numeric,           -- one-way, minutes
  air_quality_index_annual_avg    numeric,           -- Environment Canada AQHI
  parks_rec_spending_per_capita   numeric,           -- $ per resident per year
  walkability_score               numeric,           -- Walk Score 0–100
  source_notes                    text,
  data_date                       date
);

-- ─── ECONOMIC VITALITY ───────────────────────────────────────────────────────
create table if not exists cities_economic (
  id                              serial primary key,
  cma_code                        text not null references cities_meta(cma_code),
  unemployment_rate               numeric,           -- % (Stats Canada LFS, live)
  unemployment_vs_national_avg    numeric,           -- delta from national rate
  median_household_income         numeric,           -- $ (Census)
  income_vs_national_avg_pct      numeric,           -- % above/below national median
  population_growth_rate_pct      numeric,           -- annual % growth
  source_notes                    text,
  data_date                       date
);

-- ─── COMMUNITY INVESTMENT ────────────────────────────────────────────────────
create table if not exists cities_community (
  id                              serial primary key,
  cma_code                        text not null references cities_meta(cma_code),
  homelessness_pit_count          integer,           -- point-in-time count (Infrastructure Canada)
  homelessness_per_10k_pop        numeric,           -- per 10,000 residents
  homelessness_yoy_trend          text,              -- 'improving' | 'stable' | 'worsening'
  library_spending_per_capita     numeric,           -- $ per resident
  affordable_housing_units_annual integer,           -- new affordable units built per year
  social_services_spending_per_capita numeric,       -- $ per resident
  source_notes                    text,
  data_date                       date
);

-- ─── INFRASTRUCTURE PROJECTS ─────────────────────────────────────────────────
create table if not exists cities_infrastructure_projects (
  id                  serial primary key,
  cma_code            text not null references cities_meta(cma_code),
  project_name        text,
  project_type        text,                          -- 'transit' | 'road' | 'water' | 'building' | 'other'
  original_budget     numeric,                       -- $ millions
  current_budget      numeric,                       -- $ millions
  overrun_pct         numeric,                       -- % over original budget
  original_completion date,
  current_completion  date,
  months_delayed      integer,
  status              text,                          -- 'on-track' | 'delayed' | 'over-budget' | 'complete'
  source_notes        text
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists cities_meta_province_idx on cities_meta (province_abbr);
create index if not exists cities_housing_cma_idx   on cities_housing (cma_code);
create index if not exists cities_safety_cma_idx    on cities_safety (cma_code);
create index if not exists cities_fiscal_cma_idx    on cities_fiscal (cma_code);
create index if not exists cities_liveability_cma_idx on cities_liveability (cma_code);
create index if not exists cities_economic_cma_idx  on cities_economic (cma_code);
create index if not exists cities_community_cma_idx on cities_community (cma_code);
create index if not exists cities_infra_cma_idx     on cities_infrastructure_projects (cma_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- DATA WILL BE POPULATED SEPARATELY ONCE RESEARCH IS COMPLETE
-- See: supabase-cities-seed.sql
-- ─────────────────────────────────────────────────────────────────────────────
