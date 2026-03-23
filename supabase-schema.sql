-- Provincial Scorecard — Supabase Schema
-- Run this in the Supabase SQL editor to create all tables.
-- Then use the Table Editor UI to enter/update data (no code required).

-- ─── PROVINCE META ──────────────────────────────────────────────────────────
create table if not exists provinces_meta (
  id                          serial primary key,
  province_code               text not null unique,  -- BC, AB, SK, MB, ON, QC, NB, NS, PE, NL
  name                        text not null,
  premier_name                text,
  last_updated_healthcare     date,
  last_updated_housing        date,
  last_updated_credit         date,
  last_updated_polling        date,
  last_updated_infrastructure date
);

-- ─── HEALTHCARE ─────────────────────────────────────────────────────────────
create table if not exists provinces_healthcare (
  id                          serial primary key,
  province_code               text not null references provinces_meta(province_code),
  surgical_wait_weeks         numeric,   -- median weeks GP referral → treatment
  primary_care_attachment_pct numeric,   -- % adults with family doc/primary care
  er_benchmark_met_pct        numeric,   -- % ED visits meeting time-to-physician benchmark
  source_notes                text,
  data_date                   date
);

-- ─── HOUSING ────────────────────────────────────────────────────────────────
create table if not exists provinces_housing (
  id                              serial primary key,
  province_code                   text not null references provinces_meta(province_code),
  mls_hpi_benchmark               numeric,   -- MLS HPI composite benchmark price ($)
  mls_hpi_yoy_pct                 numeric,   -- Year-over-year % change in benchmark
  housing_starts_per_1000_growth  numeric,   -- New starts per 1,000 population growth
  rent_inflation_pct              numeric,   -- CPI rent component YoY %
  source_notes                    text,
  data_date                       date
);

-- ─── CREDIT RATINGS ─────────────────────────────────────────────────────────
create table if not exists provinces_credit (
  id             serial primary key,
  province_code  text not null references provinces_meta(province_code),
  moodys_rating  text,   -- e.g. Aa1, Aa2, A1
  moodys_outlook text,   -- positive, stable, negative
  dbrs_rating    text,   -- e.g. AA+, AA, A+
  dbrs_outlook   text,
  sp_rating      text,
  sp_outlook     text,
  fitch_rating   text,
  fitch_outlook  text,
  data_date      date
);

-- ─── POLLING ────────────────────────────────────────────────────────────────
create table if not exists provinces_polling (
  id                     serial primary key,
  province_code          text not null references provinces_meta(province_code),
  premier_approval_pct   numeric,
  premier_disapproval_pct numeric,
  vote_intention_delta   numeric,  -- ruling party vs. last election
  source_notes           text,
  data_date              date
);

-- ─── GOVERNANCE ─────────────────────────────────────────────────────────────
create table if not exists provinces_governance (
  id                 serial primary key,
  province_code      text not null references provinces_meta(province_code),
  ag_opinion         text,   -- clean, qualified, adverse
  ag_year            integer,
  infrastructure_grade text,
  data_date          date
);

-- ─── INFRASTRUCTURE PROJECTS ────────────────────────────────────────────────
create table if not exists infrastructure_projects (
  id                   serial primary key,
  province_code        text not null references provinces_meta(province_code),
  project_name         text not null,
  project_type         text,   -- Transit, Hospital, Highway, Bridge, Utility
  original_budget      bigint,
  current_budget       bigint,
  overrun_pct          numeric,  -- ((current - original) / original) * 100
  original_completion  text,     -- YYYY-MM
  current_completion   text,     -- YYYY-MM
  months_delayed       integer,
  status               text,     -- In Construction, Delayed Opening, Complete, etc.
  source_notes         text
);

-- ─── SUPPORTERS ─────────────────────────────────────────────────────────────
create table if not exists supporters (
  id           serial primary key,
  display_name text not null,
  tier         text,    -- coffee, lunch, monthly
  active       boolean default true,
  added_date   date default current_date
);

-- ─── SEED: Province meta (run once) ─────────────────────────────────────────
insert into provinces_meta (province_code, name, premier_name, last_updated_healthcare, last_updated_housing, last_updated_credit, last_updated_polling, last_updated_infrastructure)
values
  ('BC', 'British Columbia',          'David Eby',       '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('AB', 'Alberta',                   'Danielle Smith',  '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('SK', 'Saskatchewan',              'Scott Moe',       '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('MB', 'Manitoba',                  'Wab Kinew',       '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('ON', 'Ontario',                   'Doug Ford',       '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('QC', 'Quebec',                    'François Legault','2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('NB', 'New Brunswick',             'Susan Holt',      '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('NS', 'Nova Scotia',               'Tim Houston',     '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('PE', 'Prince Edward Island',      'Dennis King',     '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01'),
  ('NL', 'Newfoundland and Labrador', 'Andrew Furey',    '2025-01-01', '2026-02-01', '2025-10-01', '2026-02-01', '2026-01-01')
on conflict (province_code) do nothing;

-- ─── SEED: Healthcare ────────────────────────────────────────────────────────
insert into provinces_healthcare (province_code, surgical_wait_weeks, primary_care_attachment_pct, er_benchmark_met_pct, source_notes, data_date)
values
  ('BC', 28, 83, 57, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('AB', 34, 79, 62, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('SK', 26, 77, 72, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('MB', 34, 80, 58, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('ON', 25, 82, 60, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('QC', 54, 73, 68, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('NB', 40, 70, 74, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('NS', 43, 71, 70, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('PE', 35, 76, 82, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01'),
  ('NL', 43, 72, 68, 'Fraser Institute Waiting Your Turn 2025; CIHI 2024',   '2025-01-01');

-- ─── SEED: Housing ──────────────────────────────────────────────────────────
insert into provinces_housing (province_code, mls_hpi_benchmark, mls_hpi_yoy_pct, housing_starts_per_1000_growth, rent_inflation_pct, source_notes, data_date)
values
  ('BC', 995000,  2.5, 175, 4.5, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('AB', 490000,  8.5, 220, 6.8, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('SK', 325000,  5.0, 200, 4.2, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('MB', 355000,  3.5, 155, 5.0, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('ON', 855000,  1.5, 140, 4.8, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('QC', 480000,  6.0, 120, 5.5, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('NB', 298000,  4.5, 245, 7.2, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('NS', 415000,  5.5, 190, 6.5, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('PE', 370000,  3.0, 270, 5.8, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01'),
  ('NL', 290000,  2.0,  88, 3.2, 'CREA MLS HPI Feb 2026; CMHC 2025; Stats Can CPI', '2026-02-01');

-- ─── SEED: Credit ratings ────────────────────────────────────────────────────
insert into provinces_credit (province_code, moodys_rating, moodys_outlook, dbrs_rating, dbrs_outlook, sp_rating, sp_outlook, fitch_rating, fitch_outlook, data_date)
values
  ('BC', 'Aa2', 'stable',   'AA',  'stable',   'AA',  'stable',   'AA',  'stable',   '2025-10-01'),
  ('AB', 'Aa1', 'stable',   'AA+', 'stable',   'AA',  'stable',   null,  null,        '2025-10-01'),
  ('SK', 'Aa2', 'stable',   'AA',  'stable',   'AA',  'stable',   null,  null,        '2025-10-01'),
  ('MB', 'A1',  'stable',   'A+',  'stable',   'A+',  'stable',   null,  null,        '2025-10-01'),
  ('ON', 'Aa3', 'stable',   'AA-', 'stable',   'AA-', 'stable',   'AA-', 'stable',   '2025-10-01'),
  ('QC', 'Aa2', 'stable',   'AA',  'stable',   'AA-', 'stable',   null,  null,        '2025-10-01'),
  ('NB', 'A1',  'stable',   'A',   'positive', 'A+',  'stable',   null,  null,        '2025-10-01'),
  ('NS', 'A1',  'stable',   'A+',  'stable',   'A+',  'stable',   null,  null,        '2025-10-01'),
  ('PE', 'A1',  'stable',   'A+',  'stable',   null,  null,        null,  null,        '2025-10-01'),
  ('NL', 'A3',  'negative', 'A-',  'negative', 'A-',  'stable',   null,  null,        '2025-10-01');

-- ─── SEED: Polling ──────────────────────────────────────────────────────────
insert into provinces_polling (province_code, premier_approval_pct, premier_disapproval_pct, vote_intention_delta, source_notes, data_date)
values
  ('BC', 45, 42,  0, 'Angus Reid Feb 2026',              '2026-02-01'),
  ('AB', 44, 48,  0, 'Angus Reid Feb 2026',              '2026-02-01'),
  ('SK', 42, 48,  0, 'Angus Reid Feb 2026',              '2026-02-01'),
  ('MB', 52, 35,  0, 'Angus Reid Feb 2026',              '2026-02-01'),
  ('ON', 38, 55,  0, 'Angus Reid Feb 2026',              '2026-02-01'),
  ('QC', 37, 56,  0, 'Angus Reid / Léger Feb 2026',      '2026-02-01'),
  ('NB', 48, 32,  0, 'Angus Reid Feb 2026',              '2026-02-01'),
  ('NS', 52, 38,  0, 'Angus Reid Feb 2026',              '2026-02-01'),
  ('PE', 55, 30,  0, 'Angus Reid / local polling Feb 2026', '2026-02-01'),
  ('NL', 42, 42,  0, 'Angus Reid Feb 2026',              '2026-02-01');

-- ─── SEED: Governance ───────────────────────────────────────────────────────
insert into provinces_governance (province_code, ag_opinion, ag_year, data_date)
values
  ('BC', 'clean',     2024, '2024-01-01'),
  ('AB', 'clean',     2024, '2024-01-01'),
  ('SK', 'clean',     2024, '2024-01-01'),
  ('MB', 'qualified', 2024, '2024-01-01'),
  ('ON', 'clean',     2024, '2024-01-01'),
  ('QC', 'clean',     2024, '2024-01-01'),
  ('NB', 'clean',     2024, '2024-01-01'),
  ('NS', 'clean',     2024, '2024-01-01'),
  ('PE', 'clean',     2024, '2024-01-01'),
  ('NL', 'qualified', 2024, '2024-01-01');

-- ─── SEED: Infrastructure projects ──────────────────────────────────────────
-- (Abbreviated — see fallback-cache.json for full set; insert via Table Editor)
insert into infrastructure_projects (province_code, project_name, project_type, original_budget, current_budget, overrun_pct, original_completion, current_completion, months_delayed, status)
values
  ('BC', 'Broadway Subway (SkyTrain Extension)',  'Transit',  2830000000, 2830000000,   0.0, '2025-12', '2026-03',  3, 'In Construction'),
  ('BC', 'Pattullo Bridge Replacement',           'Bridge',   1380000000, 1460000000,   5.8, '2027-06', '2027-06',  0, 'In Construction'),
  ('BC', 'St. Paul''s Hospital (New Site)',        'Hospital', 2100000000, 2300000000,   9.5, '2026-12', '2028-01', 13, 'In Construction'),
  ('AB', 'Calgary Green Line LRT',                'Transit',  4650000000, 5600000000,  20.4, '2026-12', '2028-06', 18, 'In Construction'),
  ('AB', 'Edmonton Valley Line West LRT',         'Transit',  1870000000, 2100000000,  12.3, '2023-12', '2025-12', 24, 'Delayed Opening'),
  ('AB', 'Red Deer Regional Hospital Campus',     'Hospital',  910000000, 1100000000,  20.9, '2027-06', '2027-12',  6, 'In Construction'),
  ('SK', 'Regina Bypass (Ring Road)',             'Highway',   400000000, 1400000000, 250.0, '2017-10', '2019-12', 26, 'Complete (over budget)'),
  ('SK', 'Prince Albert Victoria Hospital Redev.','Hospital',  260000000,  310000000,  19.2, '2027-03', '2027-09',  6, 'In Construction'),
  ('MB', 'Kenaston Underpass Extension',          'Highway',   195000000,  207000000,   6.2, '2025-10', '2025-10',  0, 'Complete'),
  ('MB', 'Health Sciences Centre Redevelopment',  'Hospital',  850000000,  940000000,  10.6, '2028-06', '2028-12',  6, 'In Construction'),
  ('ON', 'Eglinton Crosstown LRT',                'Transit',  5300000000,12500000000, 135.8, '2021-12', '2025-10', 46, 'Delayed Opening'),
  ('ON', 'Ontario Line Subway',                   'Transit', 10900000000,13200000000,  21.1, '2030-12', '2033-06', 30, 'In Construction'),
  ('ON', 'Finch West LRT',                        'Transit',  1200000000, 2100000000,  75.0, '2023-06', '2026-03', 33, 'Delayed Opening'),
  ('QC', 'REM (Réseau express métropolitain)',    'Transit',  6300000000, 6900000000,   9.5, '2023-06', '2024-09', 15, 'Operational (phased)'),
  ('QC', 'CHUM Hospital Expansion',              'Hospital', 1460000000, 2570000000,  75.9, '2019-06', '2023-12', 54, 'Complete (over budget)'),
  ('NB', 'Mactaquac Dam Renewal',                 'Utility',  2900000000, 3500000000,  20.7, '2030-12', '2030-12',  0, 'In Construction'),
  ('NB', 'Fredericton-Moncton Highway Twinning', 'Highway',    550000000,  600000000,   9.1, '2028-12', '2028-12',  0, 'In Construction'),
  ('NS', 'QEII New Generation Project (Halifax)', 'Hospital', 2000000000, 2500000000,  25.0, '2028-06', '2029-06', 12, 'In Construction'),
  ('NS', 'Halifax Infirmary Expansion',           'Hospital', 1300000000, 1460000000,  12.3, '2027-12', '2028-06',  6, 'In Construction'),
  ('PE', 'PEI Hospital Charlottetown Redevelop.', 'Hospital',  154000000,  210000000,  36.4, '2022-09', '2023-12', 15, 'Complete'),
  ('PE', 'Trans-Canada Highway Upgrades',         'Highway',   280000000,  295000000,   5.4, '2027-10', '2027-10',  0, 'In Construction'),
  ('NL', 'Muskrat Falls / Labrador-Island Link',  'Utility',  6200000000,13100000000, 111.3, '2017-12', '2023-06', 66, 'Operational (over budget)'),
  ('NL', 'Corner Brook Acute Care Hospital',      'Hospital',  820000000, 1150000000,  40.2, '2025-12', '2027-06', 18, 'In Construction');
