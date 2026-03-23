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

-- ─── EDUCATION ──────────────────────────────────────────────────────────────
-- PCAP = Pan-Canadian Assessment Program (CMEC) — Grade 8 equivalent outcomes
create table if not exists provinces_education (
  id                      serial primary key,
  province_code           text not null references provinces_meta(province_code),
  pcap_math_score         numeric,   -- PCAP math score (~440–540 range nationally)
  pcap_reading_score      numeric,   -- PCAP reading score
  per_pupil_spending      integer,   -- Annual K–12 spending per student ($CAD)
  student_teacher_ratio   numeric,   -- Classroom student-to-teacher ratio
  avg_university_tuition  integer,   -- Average domestic undergrad tuition ($CAD/yr)
  source_notes            text,
  data_date               date
);

-- ─── TAXES & COST BURDEN ────────────────────────────────────────────────────
-- Household-level cost data for a typical two-income family (~$120K combined)
create table if not exists provinces_tax (
  id                          serial primary key,
  province_code               text not null references provinces_meta(province_code),
  sales_tax_pct               numeric,  -- Provincial sales/consumption tax rate (PST/QST/HST provincial portion)
  has_hst                     boolean default false,  -- True if blended HST rather than separate PST
  income_effective_rate_pct   numeric,  -- Effective provincial income tax rate at $60K individual income
  tax_burden_index            integer,  -- Total provincial tax burden vs national avg (100 = average)
  childcare_monthly_avg       integer,  -- Average regulated childcare cost, toddler, $/month
  legislature_cost_per_capita numeric,  -- Annual Legislative Assembly operating cost per resident ($)
  public_sector_per_1000      numeric,  -- Provincial + health sector employees per 1,000 population
  source_notes                text,
  data_date                   date
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

-- ─── SEED: Education data ────────────────────────────────────────────────────
-- Source: CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO
insert into provinces_education (province_code, pcap_math_score, pcap_reading_score, per_pupil_spending, student_teacher_ratio, avg_university_tuition, source_notes, data_date)
values
  ('BC', 504, 506, 12700, 17.5, 5974,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('AB', 503, 505, 14200, 16.8, 7280,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('SK', 483, 490, 12900, 17.2, 6793,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('MB', 473, 481, 13200, 16.5, 4850,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('ON', 494, 501, 12400, 18.2, 9070,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('QC', 531, 521, 13400, 15.8, 3013,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('NB', 475, 485, 13100, 14.2, 7242,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('NS', 472, 478, 14000, 14.8, 8391,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('PE', 464, 470, 13600, 14.1, 7210,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01'),
  ('NL', 460, 466, 17200, 13.5, 3872,  'CMEC PCAP 2022; Stats Canada Education Indicators 2023-24; CAUBO', '2023-09-01');

-- ─── SEED: Tax burden data ───────────────────────────────────────────────────
-- Source: Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01
insert into provinces_tax (province_code, sales_tax_pct, has_hst, income_effective_rate_pct, tax_burden_index, childcare_monthly_avg, legislature_cost_per_capita, public_sector_per_1000, source_notes, data_date)
values
  ('BC', 7.0,    false, 9.8,  94,  897,  17,  73,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('AB', 0.0,    false, 9.2,  70,  1242, 24,  72,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('SK', 6.0,    false, 11.5, 85,  912,  43,  82,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('MB', 7.0,    false, 13.5, 92,  584,  35,  90,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('ON', 8.0,    true,  9.2,  97,  1456, 9,   68,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('QC', 9.975,  false, 17.8, 128, 196,  22,  88,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('NB', 10.0,   true,  13.2, 100, 619,  54,  89,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('NS', 10.0,   true,  16.0, 113, 631,  62,  94,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('PE', 10.0,   true,  15.6, 109, 398,  120, 98,  'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01'),
  ('NL', 10.0,   true,  15.5, 110, 598,  107, 104, 'Fraser Institute Tax Simulator 2024; CCPA Child Care Fee Survey 2024; Stats Canada Table 14-10-0023-01', '2024-01-01');

-- ─── SAFETY ──────────────────────────────────────────────────────────────────
-- Survey-based methodology: GSS victimization avoids reporting-confidence bias.
-- Homicide rates are always counted (body count), most reliable objective metric.
create table if not exists provinces_safety (
  id                          serial primary key,
  province_code               text not null references provinces_meta(province_code),
  victimization_rate_per_1000 numeric,  -- GSS Cycle 36 (2019) — self-reported victimization per 1,000 residents
  homicide_rate_per_100k      numeric,  -- Stats Canada Homicide Survey 2023 — per 100,000 residents
  source_notes                text,
  data_date                   date
);

-- ─── SEED: Safety data ───────────────────────────────────────────────────────
-- Sources: Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey (2023)
insert into provinces_safety (province_code, victimization_rate_per_1000, homicide_rate_per_100k, source_notes, data_date)
values
  ('BC', 118, 2.42, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('AB', 113, 2.76, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('SK', 140, 4.85, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('MB', 131, 5.24, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('ON',  97, 1.55, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('QC',  82, 1.38, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('NB',  99, 1.48, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('NS', 107, 2.21, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('PE',  78, 0.58, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01'),
  ('NL',  91, 1.91, 'Stats Canada GSS Cycle 36 (2019); Stats Canada Homicide Survey 2023', '2023-01-01');

-- ─── ECONOMY (STATSCAN) ──────────────────────────────────────────────────────
-- Manually maintained quarterly. Stats Canada WDS v1 API was deprecated 2024.
-- Sources: Stats Canada LFS Table 14-10-0287-01; GDP Table 36-10-0222-01
-- unemployment_delta: province rate minus national rate (pp) — negative = better
-- gdp_growth_delta:   province YoY GDP growth minus national (pp) — positive = better
create table if not exists provinces_statscan (
  id                              serial primary key,
  province_code                   text not null references provinces_meta(province_code),
  unemployment_rate               numeric,  -- % (latest month, seasonally adjusted)
  unemployment_delta_from_national numeric, -- pp vs Canada (negative = better than national)
  gdp_growth_pct                  numeric,  -- YoY % real GDP growth
  gdp_growth_delta_from_national  numeric,  -- pp vs Canada growth rate
  source_notes                    text,
  data_date                       date
);

-- ─── SEED: Economy data (Q4 2024 / Jan 2025) ─────────────────────────────────
-- National unemployment Jan 2025: ~6.6%  |  National real GDP growth 2024: ~1.3%
-- Update via Supabase table editor when Stats Canada releases new LFS/GDP data.
insert into provinces_statscan (province_code, unemployment_rate, unemployment_delta_from_national, gdp_growth_pct, gdp_growth_delta_from_national, source_notes, data_date)
values
  ('BC', 5.5,  -1.1,  2.1,  0.8, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('AB', 7.4,   0.8,  2.8,  1.5, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('SK', 5.4,  -1.2,  1.8,  0.5, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('MB', 5.1,  -1.5,  1.5,  0.2, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('ON', 7.1,   0.5,  1.0, -0.3, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('QC', 5.8,  -0.8,  1.4,  0.1, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('NB', 7.8,   1.2,  1.9,  0.6, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('NS', 7.2,   0.6,  1.6,  0.3, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('PE', 9.8,   3.2,  1.1, -0.2, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01'),
  ('NL',10.5,   3.9,  0.8, -0.5, 'Stats Can LFS Jan 2025; GDP preliminary 2024', '2025-01-01');

-- ─── COST OF LIVING / PURCHASING POWER ───────────────────────────────────────
-- Measures how far take-home pay goes on day-to-day essentials.
-- Not a government performance score — reflects structural cost environment.
-- Sources: CMHC Rental Market Survey 2024; Stats Canada median wages 2023;
--          Stats Canada CPI Table 18-10-0004-01 (food component);
--          NRCan Electricity Prices report 2024;
--          Insurance Bureau of Canada 2024 auto insurance report.
create table if not exists provinces_cost_of_living (
  id                        serial primary key,
  province_code             text not null references provinces_meta(province_code),
  rent_to_income_pct        numeric,  -- avg 2BR annual rent ÷ median household income × 100
  grocery_index             numeric,  -- relative to national avg = 100 (lower = cheaper)
  annual_energy_cost        numeric,  -- electricity + heating combined, typical household ($)
  auto_insurance_annual     numeric,  -- avg annual auto insurance premium ($)
  -- childcare pulled from provinces_tax.childcare_monthly_avg
  source_notes              text,
  data_date                 date
);

-- ─── SEED: Cost of living data (2024) ─────────────────────────────────────────
-- rent_to_income: CMHC avg 2BR rent annualised ÷ Stats Can median household income
-- grocery_index: food CPI relative to national (100 = national avg)
-- annual_energy: NRCan electricity (7,200 kWh/yr typical) + home heating estimate
-- auto_insurance: IBC avg annual premium by province
insert into provinces_cost_of_living (province_code, rent_to_income_pct, grocery_index, annual_energy_cost, auto_insurance_annual, source_notes, data_date)
values
  ('BC', 27.5, 102, 2085, 1832, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('AB', 18.9, 101, 2552, 1952, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('SK', 15.3,  99, 2702, 1071, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('MB', 16.9,  98, 2013, 1060, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('ON', 25.1, 100, 2365, 1754, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('QC', 19.5,  98, 1626,  717, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('NB', 18.2, 106, 3143,  847, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('NS', 21.8, 108, 3926,  905, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('PE', 20.3, 110, 3726,  780, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01'),
  ('NL', 15.4, 112, 2979, 1128, 'CMHC 2024; Stats Can wages; NRCan electricity; IBC 2024', '2024-01-01');

-- ─── MENTAL HEALTH & ADDICTIONS ──────────────────────────────────────────────
-- Sources: Health Canada Drug and Substance Use report 2023;
--          CIHI "Hospital Mental Health Services" 2022;
--          CIHI "National Health Expenditure Trends" 2022;
--          CMHC / provincial recovery housing inventories 2023.
-- Note: drug_toxicity_rate reflects entire harm-reduction + treatment system.
--       psychiatric_beds: ON/BC have deinstitutionalised — community care not captured here.
--       recovery_beds are estimates from provincial housing authorities.
create table if not exists provinces_mental_health (
  id                          serial primary key,
  province_code               text not null references provinces_meta(province_code),
  drug_toxicity_rate_per_100k numeric,  -- apparent drug toxicity deaths per 100k (lower = better)
  psychiatric_beds_per_100k   numeric,  -- hospital psychiatric beds per 100k (higher = better)
  mental_health_budget_pct    numeric,  -- mental health as % of provincial health budget (higher = better)
  recovery_beds_per_100k      numeric,  -- recovery/supportive housing beds per 100k (higher = better)
  source_notes                text,
  data_date                   date
);

-- ─── SEED: Mental health data (2022–2023) ────────────────────────────────────
insert into provinces_mental_health (province_code, drug_toxicity_rate_per_100k, psychiatric_beds_per_100k, mental_health_budget_pct, recovery_beds_per_100k, source_notes, data_date)
values
  ('BC', 38.0, 34, 6.5, 45, 'Health Canada 2023; CIHI 2022; BC Housing recovery inventory 2023', '2023-01-01'),
  ('AB', 21.5, 28, 6.0, 28, 'Health Canada 2023; CIHI 2022; AB Health recovery housing 2023',   '2023-01-01'),
  ('SK', 15.2, 31, 7.0, 18, 'Health Canada 2023; CIHI 2022; SK Housing 2023',                   '2023-01-01'),
  ('MB', 11.8, 38, 7.5, 22, 'Health Canada 2023; CIHI 2022; MB Housing 2023',                   '2023-01-01'),
  ('ON', 11.2, 25, 7.0, 20, 'Health Canada 2023; CIHI 2022; ON community housing 2023',         '2023-01-01'),
  ('QC',  4.1, 83, 9.0, 35, 'Health Canada 2023; CIHI 2022; QC MSSS housing inventory 2023',    '2023-01-01'),
  ('NB',  5.6, 30, 7.5, 15, 'Health Canada 2023; CIHI 2022; NB recovery housing 2023',          '2023-01-01'),
  ('NS',  6.8, 42, 8.0, 20, 'Health Canada 2023; CIHI 2022; NS recovery housing 2023',          '2023-01-01'),
  ('PE',  3.2, 28, 6.5, 12, 'Health Canada 2023; CIHI 2022; PEI housing services 2023',         '2023-01-01'),
  ('NL',  7.1, 44, 6.5, 15, 'Health Canada 2023; CIHI 2022; NL housing 2023',                   '2023-01-01');

-- ─── ADD: Supportive housing + OAT access to mental health table ─────────────
-- supportive_housing_per_100k: provincially-funded supportive housing units per 100k residents
--   Sources: CMHC NHS; BC Housing inventory 2023; provincial housing authority reports
--   Note: includes only units with wraparound services (not pure affordable housing)
-- oat_access_index: composite 30–100 index of opioid agonist therapy accessibility
--   Factors: prescriber eligibility (GP/NP vs. addiction specialist only),
--            witnessed ingestion requirements, rural telemedicine availability,
--            provincial drug plan coverage of methadone/buprenorphine
--   Sources: CADTH 2023 review; provincial college of physicians prescribing guidelines
alter table provinces_mental_health
  add column if not exists supportive_housing_per_100k numeric,
  add column if not exists oat_access_index            numeric;

update provinces_mental_health set supportive_housing_per_100k = 38, oat_access_index = 90 where province_code = 'BC';
update provinces_mental_health set supportive_housing_per_100k = 14, oat_access_index = 72 where province_code = 'AB';
update provinces_mental_health set supportive_housing_per_100k =  9, oat_access_index = 52 where province_code = 'SK';
update provinces_mental_health set supportive_housing_per_100k = 17, oat_access_index = 65 where province_code = 'MB';
update provinces_mental_health set supportive_housing_per_100k = 11, oat_access_index = 80 where province_code = 'ON';
update provinces_mental_health set supportive_housing_per_100k = 24, oat_access_index = 68 where province_code = 'QC';
update provinces_mental_health set supportive_housing_per_100k =  7, oat_access_index = 48 where province_code = 'NB';
update provinces_mental_health set supportive_housing_per_100k = 10, oat_access_index = 62 where province_code = 'NS';
update provinces_mental_health set supportive_housing_per_100k =  5, oat_access_index = 44 where province_code = 'PE';
update provinces_mental_health set supportive_housing_per_100k =  7, oat_access_index = 55 where province_code = 'NL';

-- ─── ADD: Core housing need to housing table ─────────────────────────────────
-- core_housing_need_pct: % of households spending 30%+ of pre-tax income on housing
--   that does not meet adequacy, suitability, or affordability standards (CMHC definition)
-- Sources: Stats Canada 2021 Census; CMHC Housing Needs Assessment 2022
-- Lower = better (fewer households in core need)
alter table provinces_housing
  add column if not exists core_housing_need_pct numeric;

update provinces_housing set core_housing_need_pct = 16.8 where province_code = 'BC';
update provinces_housing set core_housing_need_pct = 10.8 where province_code = 'AB';
update provinces_housing set core_housing_need_pct = 11.5 where province_code = 'SK';
update provinces_housing set core_housing_need_pct = 14.2 where province_code = 'MB';
update provinces_housing set core_housing_need_pct = 13.6 where province_code = 'ON';
update provinces_housing set core_housing_need_pct = 12.4 where province_code = 'QC';
update provinces_housing set core_housing_need_pct = 10.2 where province_code = 'NB';
update provinces_housing set core_housing_need_pct = 13.8 where province_code = 'NS';
update provinces_housing set core_housing_need_pct = 13.1 where province_code = 'PE';
update provinces_housing set core_housing_need_pct =  9.8 where province_code = 'NL';
