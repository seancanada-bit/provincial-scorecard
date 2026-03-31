-- MySQL 8 Schema for Bang for Your Duck
-- Auto-generated from Supabase PostgreSQL
-- Generated: 2026-03-31T18:12:45.467Z

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- _provincial_transfers_lookup
DROP TABLE IF EXISTS `_provincial_transfers_lookup`;
CREATE TABLE `_provincial_transfers_lookup` (
  `province_code` VARCHAR(100) NOT NULL,
  `cht_per_capita` FLOAT,
  `cst_per_capita` FLOAT,
  `equalization_per_capita` FLOAT,
  `gas_tax_per_capita` FLOAT,
  `total_transfers_per_capita` FLOAT,
  PRIMARY KEY (`province_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_community
DROP TABLE IF EXISTS `cities_community`;
CREATE TABLE `cities_community` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `homelessness_pit_count` INT,
  `homelessness_per_10k_pop` DECIMAL(12,4),
  `homelessness_yoy_trend` TEXT,
  `library_spending_per_capita` DECIMAL(12,4),
  `affordable_housing_units_annual` INT,
  `social_services_spending_per_capita` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_economic
DROP TABLE IF EXISTS `cities_economic`;
CREATE TABLE `cities_economic` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `unemployment_rate` DECIMAL(12,4),
  `unemployment_vs_national_avg` DECIMAL(12,4),
  `median_household_income` DECIMAL(12,4),
  `income_vs_national_avg_pct` DECIMAL(12,4),
  `population_growth_rate_pct` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_fiscal
DROP TABLE IF EXISTS `cities_fiscal`;
CREATE TABLE `cities_fiscal` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `property_tax_residential_rate` DECIMAL(12,4),
  `municipal_revenue_per_capita` DECIMAL(12,4),
  `municipal_spending_per_capita` DECIMAL(12,4),
  `infrastructure_spending_pct` DECIMAL(12,4),
  `net_debt_per_capita` DECIMAL(12,4),
  `operating_surplus_deficit_per_capita` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_housing
DROP TABLE IF EXISTS `cities_housing`;
CREATE TABLE `cities_housing` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `mls_hpi_benchmark` DECIMAL(12,4),
  `mls_hpi_yoy_pct` DECIMAL(12,4),
  `avg_rent_2br` DECIMAL(12,4),
  `rent_yoy_pct` DECIMAL(12,4),
  `rent_to_income_ratio` DECIMAL(12,4),
  `housing_starts_per_1000_pop` DECIMAL(12,4),
  `avg_permit_approval_days` INT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_infrastructure_projects
DROP TABLE IF EXISTS `cities_infrastructure_projects`;
CREATE TABLE `cities_infrastructure_projects` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `project_name` TEXT,
  `project_type` TEXT,
  `original_budget` DECIMAL(12,4),
  `current_budget` DECIMAL(12,4),
  `overrun_pct` DECIMAL(12,4),
  `original_completion` DATE,
  `current_completion` DATE,
  `months_delayed` INT,
  `status` TEXT,
  `source_notes` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_liveability
DROP TABLE IF EXISTS `cities_liveability`;
CREATE TABLE `cities_liveability` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `transit_ridership_per_capita` DECIMAL(12,4),
  `transit_recovery_pct_prepandemic` DECIMAL(12,4),
  `avg_commute_time_mins` DECIMAL(12,4),
  `air_quality_index_annual_avg` DECIMAL(12,4),
  `parks_rec_spending_per_capita` DECIMAL(12,4),
  `walkability_score` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  `transit_score` INT,
  `bike_score` INT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_meta
DROP TABLE IF EXISTS `cities_meta`;
CREATE TABLE `cities_meta` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `city_name` TEXT NOT NULL,
  `province` TEXT NOT NULL,
  `province_abbr` TEXT NOT NULL,
  `mayor_name` TEXT,
  `population_2021` INT,
  `lat` DECIMAL(12,4),
  `lng` DECIMAL(12,4),
  `last_updated_housing` DATE,
  `last_updated_safety` DATE,
  `last_updated_fiscal` DATE,
  `last_updated_liveability` DATE,
  `last_updated_economic` DATE,
  `last_updated_community` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- cities_safety
DROP TABLE IF EXISTS `cities_safety`;
CREATE TABLE `cities_safety` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `cma_code` VARCHAR(20) NOT NULL,
  `crime_severity_index` DECIMAL(12,4),
  `violent_csi` DECIMAL(12,4),
  `csi_yoy_change_pct` DECIMAL(12,4),
  `csi_10yr_trend` TEXT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- events
DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `ts` DATETIME NOT NULL,
  `event` TEXT NOT NULL,
  `province` TEXT,
  `detail` TEXT,
  `referrer` TEXT,
  `device` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- infrastructure_projects
DROP TABLE IF EXISTS `infrastructure_projects`;
CREATE TABLE `infrastructure_projects` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `project_name` TEXT NOT NULL,
  `project_type` TEXT,
  `original_budget` BIGINT,
  `current_budget` BIGINT,
  `overrun_pct` DECIMAL(12,4),
  `original_completion` TEXT,
  `current_completion` TEXT,
  `months_delayed` INT,
  `status` TEXT,
  `source_notes` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_cost_of_living
DROP TABLE IF EXISTS `provinces_cost_of_living`;
CREATE TABLE `provinces_cost_of_living` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `rent_to_income_pct` DECIMAL(12,4),
  `grocery_index` DECIMAL(12,4),
  `annual_energy_cost` DECIMAL(12,4),
  `auto_insurance_annual` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_credit
DROP TABLE IF EXISTS `provinces_credit`;
CREATE TABLE `provinces_credit` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `moodys_rating` TEXT,
  `moodys_outlook` TEXT,
  `dbrs_rating` TEXT,
  `dbrs_outlook` TEXT,
  `sp_rating` TEXT,
  `sp_outlook` TEXT,
  `fitch_rating` TEXT,
  `fitch_outlook` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_education
DROP TABLE IF EXISTS `provinces_education`;
CREATE TABLE `provinces_education` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `pcap_math_score` DECIMAL(12,4),
  `pcap_reading_score` DECIMAL(12,4),
  `per_pupil_spending` INT,
  `student_teacher_ratio` DECIMAL(12,4),
  `avg_university_tuition` INT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_fiscal
DROP TABLE IF EXISTS `provinces_fiscal`;
CREATE TABLE `provinces_fiscal` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `budget_balance_pct_gdp` DECIMAL(12,4),
  `debt_interest_cents_per_dollar` DECIMAL(12,4),
  `net_debt_per_capita` DECIMAL(12,4),
  `fiscal_trend` TEXT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_governance
DROP TABLE IF EXISTS `provinces_governance`;
CREATE TABLE `provinces_governance` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `ag_opinion` TEXT,
  `ag_year` INT,
  `infrastructure_grade` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_healthcare
DROP TABLE IF EXISTS `provinces_healthcare`;
CREATE TABLE `provinces_healthcare` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `surgical_wait_weeks` DECIMAL(12,4),
  `primary_care_attachment_pct` DECIMAL(12,4),
  `er_benchmark_met_pct` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_housing
DROP TABLE IF EXISTS `provinces_housing`;
CREATE TABLE `provinces_housing` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `mls_hpi_benchmark` DECIMAL(12,4),
  `mls_hpi_yoy_pct` DECIMAL(12,4),
  `housing_starts_per_1000_growth` DECIMAL(12,4),
  `rent_inflation_pct` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  `core_housing_need_pct` DECIMAL(12,4),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_ltc
DROP TABLE IF EXISTS `provinces_ltc`;
CREATE TABLE `provinces_ltc` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `ltc_beds_per_1k_75plus` DECIMAL(12,4),
  `direct_care_hours_per_day` DECIMAL(12,4),
  `home_care_recipients_per_1k` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_mental_health
DROP TABLE IF EXISTS `provinces_mental_health`;
CREATE TABLE `provinces_mental_health` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `drug_toxicity_rate_per_100k` DECIMAL(12,4),
  `psychiatric_beds_per_100k` DECIMAL(12,4),
  `mental_health_budget_pct` DECIMAL(12,4),
  `recovery_beds_per_100k` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  `supportive_housing_per_100k` DECIMAL(12,4),
  `oat_access_index` DECIMAL(12,4),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_meta
DROP TABLE IF EXISTS `provinces_meta`;
CREATE TABLE `provinces_meta` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `name` TEXT NOT NULL,
  `premier_name` TEXT,
  `last_updated_healthcare` DATE,
  `last_updated_housing` DATE,
  `last_updated_credit` DATE,
  `last_updated_polling` DATE,
  `last_updated_infrastructure` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_polling
DROP TABLE IF EXISTS `provinces_polling`;
CREATE TABLE `provinces_polling` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `premier_approval_pct` DECIMAL(12,4),
  `premier_disapproval_pct` DECIMAL(12,4),
  `vote_intention_delta` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_safety
DROP TABLE IF EXISTS `provinces_safety`;
CREATE TABLE `provinces_safety` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `victimization_rate_per_1000` DECIMAL(12,4),
  `homicide_rate_per_100k` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_statscan
DROP TABLE IF EXISTS `provinces_statscan`;
CREATE TABLE `provinces_statscan` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `unemployment_rate` DECIMAL(12,4),
  `unemployment_delta_from_national` DECIMAL(12,4),
  `gdp_growth_pct` DECIMAL(12,4),
  `gdp_growth_delta_from_national` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  `workplace_injury_rate` DECIMAL(12,4),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- provinces_tax
DROP TABLE IF EXISTS `provinces_tax`;
CREATE TABLE `provinces_tax` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `sales_tax_pct` DECIMAL(12,4),
  `has_hst` TINYINT(1) DEFAULT 0,
  `income_effective_rate_pct` DECIMAL(12,4),
  `tax_burden_index` INT,
  `childcare_monthly_avg` INT,
  `legislature_cost_per_capita` DECIMAL(12,4),
  `public_sector_per_1000` DECIMAL(12,4),
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ridings_demographics
DROP TABLE IF EXISTS `ridings_demographics`;
CREATE TABLE `ridings_demographics` (
  `riding_code` VARCHAR(100) NOT NULL,
  `median_household_income` INT,
  `income_vs_national_pct` FLOAT,
  `unemployment_rate` FLOAT,
  `postsecondary_rate` FLOAT,
  `immigration_pct` FLOAT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`riding_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ridings_electoral
DROP TABLE IF EXISTS `ridings_electoral`;
CREATE TABLE `ridings_electoral` (
  `riding_code` VARCHAR(100) NOT NULL,
  `voter_turnout_pct` FLOAT,
  `turnout_vs_national` FLOAT,
  `margin_of_victory_pct` FLOAT,
  `candidates_count` INT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`riding_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ridings_federal_investment
DROP TABLE IF EXISTS `ridings_federal_investment`;
CREATE TABLE `ridings_federal_investment` (
  `riding_code` VARCHAR(100) NOT NULL,
  `infrastructure_grants_per_capita` FLOAT,
  `federal_contracts_per_capita` FLOAT,
  `federal_facilities_count` INT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`riding_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ridings_federal_transfers
DROP TABLE IF EXISTS `ridings_federal_transfers`;
CREATE TABLE `ridings_federal_transfers` (
  `riding_code` VARCHAR(100) NOT NULL,
  `cht_per_capita` FLOAT,
  `cst_per_capita` FLOAT,
  `equalization_per_capita` FLOAT,
  `gas_tax_per_capita` FLOAT,
  `total_transfers_per_capita` FLOAT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`riding_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ridings_meta
DROP TABLE IF EXISTS `ridings_meta`;
CREATE TABLE `ridings_meta` (
  `riding_code` VARCHAR(100) NOT NULL,
  `riding_name` TEXT NOT NULL,
  `province_code` VARCHAR(20) NOT NULL,
  `mp_name` TEXT,
  `mp_party` TEXT,
  `mp_elected_date` DATE,
  `population` INT,
  `registered_voters` INT,
  `lat` FLOAT,
  `lng` FLOAT,
  PRIMARY KEY (`riding_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ridings_mp_expenses
DROP TABLE IF EXISTS `ridings_mp_expenses`;
CREATE TABLE `ridings_mp_expenses` (
  `riding_code` VARCHAR(100) NOT NULL,
  `total_expenses` INT,
  `travel_expenses` INT,
  `hospitality_expenses` INT,
  `office_expenses` INT,
  `distance_from_ottawa_km` INT,
  `travel_per_km` FLOAT,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`riding_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ridings_mp_performance
DROP TABLE IF EXISTS `ridings_mp_performance`;
CREATE TABLE `ridings_mp_performance` (
  `riding_code` VARCHAR(100) NOT NULL,
  `vote_participation_pct` FLOAT,
  `bills_introduced` INT,
  `bills_passed` INT,
  `committee_memberships` INT,
  `speeches_count` INT,
  `is_opposition` TINYINT(1) DEFAULT 0,
  `source_notes` TEXT,
  `data_date` DATE,
  PRIMARY KEY (`riding_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- supporters
DROP TABLE IF EXISTS `supporters`;
CREATE TABLE `supporters` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `display_name` TEXT NOT NULL,
  `tier` TEXT,
  `active` TINYINT(1) DEFAULT 1,
  `added_date` DATE DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
