-- ══════════════════════════════════════════════════════════════════════════════
-- Bang for Your Duck: MPs — Supabase Schema
-- 338 federal electoral ridings, grading MP delivery & riding outcomes
-- FK: riding_code (Elections Canada 5-digit code, e.g., '35001')
-- ══════════════════════════════════════════════════════════════════════════════

-- ── META ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ridings_meta (
  riding_code   TEXT PRIMARY KEY,
  riding_name   TEXT NOT NULL,
  province_code TEXT NOT NULL,           -- e.g., 'ON', 'BC', 'QC'
  mp_name       TEXT,
  mp_party      TEXT,                    -- 'Liberal','Conservative','NDP','Bloc Québécois','Green','Independent'
  mp_elected_date DATE,
  population    INTEGER,
  registered_voters INTEGER,
  lat           REAL,                    -- riding centroid
  lng           REAL
);

-- ── 1. MP PERFORMANCE (25%) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ridings_mp_performance (
  riding_code            TEXT PRIMARY KEY REFERENCES ridings_meta(riding_code),
  vote_participation_pct REAL,           -- % of House votes attended
  bills_introduced       INTEGER,        -- bills introduced or co-sponsored
  bills_passed           INTEGER,        -- bills that received royal assent
  committee_memberships  INTEGER,        -- standing/special committee seats
  speeches_count         INTEGER,        -- interventions in House (Hansard)
  is_opposition          BOOLEAN DEFAULT FALSE,
  source_notes           TEXT,
  data_date              DATE
);

-- ── 2. FEDERAL INVESTMENT (20%) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ridings_federal_investment (
  riding_code                  TEXT PRIMARY KEY REFERENCES ridings_meta(riding_code),
  infrastructure_grants_per_capita REAL,  -- federal infra $ per person
  federal_contracts_per_capita     REAL,  -- PSPC contracts $ per person
  federal_facilities_count         INTEGER, -- buildings, bases, labs, etc.
  source_notes                     TEXT,
  data_date                        DATE
);

-- ── 3. ELECTORAL HEALTH (15%) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ridings_electoral (
  riding_code           TEXT PRIMARY KEY REFERENCES ridings_meta(riding_code),
  voter_turnout_pct     REAL,            -- % of registered voters who voted
  turnout_vs_national   REAL,            -- pp delta from national avg
  margin_of_victory_pct REAL,            -- winner margin (lower = more competitive)
  candidates_count      INTEGER,
  source_notes          TEXT,
  data_date             DATE
);

-- ── 4. DEMOGRAPHIC OUTCOMES (15%) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ridings_demographics (
  riding_code             TEXT PRIMARY KEY REFERENCES ridings_meta(riding_code),
  median_household_income INTEGER,
  income_vs_national_pct  REAL,          -- % above/below national median
  unemployment_rate       REAL,
  postsecondary_rate      REAL,          -- % of pop with post-secondary credential
  immigration_pct         REAL,          -- % of pop who are immigrants
  source_notes            TEXT,
  data_date               DATE
);

-- ── 5. MP FISCAL RESPONSIBILITY (15%) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ridings_mp_expenses (
  riding_code           TEXT PRIMARY KEY REFERENCES ridings_meta(riding_code),
  total_expenses        INTEGER,         -- total annual MP expenses ($)
  travel_expenses       INTEGER,
  hospitality_expenses  INTEGER,
  office_expenses       INTEGER,
  distance_from_ottawa_km INTEGER,       -- for distance normalization
  travel_per_km         REAL,            -- computed: travel / distance
  source_notes          TEXT,
  data_date             DATE
);

-- ── 6. FEDERAL TRANSFERS (10%) ──────────────────────────────────────────────
-- Provincial-level data allocated per capita (same score for all ridings in a province)
CREATE TABLE IF NOT EXISTS ridings_federal_transfers (
  riding_code              TEXT PRIMARY KEY REFERENCES ridings_meta(riding_code),
  cht_per_capita           REAL,         -- Canada Health Transfer
  cst_per_capita           REAL,         -- Canada Social Transfer
  equalization_per_capita  REAL,         -- equalization payment (0 for non-receiving)
  gas_tax_per_capita       REAL,         -- federal gas tax transfer
  total_transfers_per_capita REAL,
  source_notes             TEXT,
  data_date                DATE
);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ridings_meta_province ON ridings_meta(province_code);
CREATE INDEX IF NOT EXISTS idx_ridings_meta_party    ON ridings_meta(mp_party);
