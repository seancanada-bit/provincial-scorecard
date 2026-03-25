-- ─────────────────────────────────────────────────────────────────────────────
-- Bang for Your Duck: Cities — Seed Data
-- Research-based estimates from training data (up to early 2025).
-- Sources: Stats Canada 2021 Census, CMHC RMS 2023, CREA MLS HPI 2023,
--          Stats Canada CSI 2022, Stats Canada LFS 2023.
-- Verify and update values against live sources before publishing.
-- Run supabase-cities-schema.sql first.
-- ─────────────────────────────────────────────────────────────────────────────

-- Note: Ottawa cma_code = '505', Gatineau = '505G' (QC portion of CMA 505)

-- ─── CITIES META ─────────────────────────────────────────────────────────────
insert into cities_meta
  (cma_code, city_name, province, province_abbr, mayor_name, population_2021, lat, lng)
values
  ('535',  'Toronto',                    'Ontario',                   'ON', 'Olivia Chow',       6202225, 43.7001, -79.4163),
  ('462',  'Montreal',                   'Quebec',                    'QC', 'Valérie Plante',    4291732, 45.5017, -73.5673),
  ('933',  'Vancouver',                  'British Columbia',          'BC', 'Ken Sim',           2642825, 49.2827,-123.1207),
  ('825',  'Calgary',                    'Alberta',                   'AB', 'Jyoti Gondek',      1392609, 51.0447,-114.0719),
  ('835',  'Edmonton',                   'Alberta',                   'AB', 'Amarjeet Sohi',     1418118, 53.5461,-113.4938),
  ('505',  'Ottawa',                     'Ontario',                   'ON', 'Mark Sutcliffe',    1017449, 45.4215, -75.6972),
  ('505G', 'Gatineau',                   'Quebec',                    'QC', 'France Bélisle',     340722, 45.4765, -75.7013),
  ('602',  'Winnipeg',                   'Manitoba',                  'MB', 'Scott Gillingham',   834678, 49.8951, -97.1384),
  ('421',  'Quebec City',                'Quebec',                    'QC', 'Bruno Marchand',     839311, 46.8139, -71.2080),
  ('537',  'Hamilton',                   'Ontario',                   'ON', 'Andrea Horwath',     785184, 43.2557, -79.8711),
  ('541',  'Kitchener-Cambridge-Waterloo','Ontario',                  'ON', 'Berry Vrbanovic',    575847, 43.4516, -80.4925),
  ('555',  'London',                     'Ontario',                   'ON', 'Josh Morgan',        543551, 42.9849, -81.2453),
  ('205',  'Halifax',                    'Nova Scotia',               'NS', 'Mike Savage',        465703, 44.6488, -63.5752),
  ('539',  'St. Catharines-Niagara',     'Ontario',                   'ON', 'Mat Siscoe',         433604, 43.1594, -79.2469),
  ('532',  'Oshawa',                     'Ontario',                   'ON', 'Dan Carter',         415311, 43.8971, -78.8658),
  ('935',  'Victoria',                   'British Columbia',          'BC', 'Marianne Alto',      397237, 48.4284,-123.3656),
  ('559',  'Windsor',                    'Ontario',                   'ON', 'Drew Dilkens',       422630, 42.3149, -83.0364),
  ('725',  'Saskatoon',                  'Saskatchewan',              'SK', 'Charlie Clark',      317480, 52.1332,-106.6700),
  ('705',  'Regina',                     'Saskatchewan',              'SK', 'Sandra Masters',     249217, 50.4452,-104.6189),
  ('433',  'Sherbrooke',                 'Quebec',                    'QC', 'Évelyne Beaudin',    227398, 45.4042, -71.8929),
  ('568',  'Barrie',                     'Ontario',                   'ON', 'Alex Nuttall',       197059, 44.3894, -79.6903),
  ('915',  'Kelowna',                    'British Columbia',          'BC', 'Tom Dyas',           222162, 49.8880,-119.4960),
  ('932',  'Abbotsford-Mission',         'British Columbia',          'BC', 'Ross Siemens',       195726, 49.0504,-122.3045),
  ('521',  'Kingston',                   'Ontario',                   'ON', 'Bryan Paterson',     172546, 44.2312, -76.4860),
  ('408',  'Saguenay',                   'Quebec',                    'QC', 'Julie Dufour',       160980, 48.4284, -71.0537),
  ('442',  'Trois-Rivières',             'Quebec',                    'QC', 'Jean Lamarche',      166921, 46.3432, -72.5418),
  ('550',  'Guelph',                     'Ontario',                   'ON', 'Cam Guthrie',        165027, 43.5448, -80.2482),
  ('305',  'Moncton',                    'New Brunswick',             'NB', 'Dawn Arnold',        176292, 46.0878, -64.7782),
  ('580',  'Sudbury',                    'Ontario',                   'ON', 'Paul Lefebvre',      197078, 46.5136, -80.9935),
  ('570',  'Peterborough',               'Ontario',                   'ON', 'Jeff Leal',          131220, 44.3091, -78.3197),
  ('595',  'Thunder Bay',                'Ontario',                   'ON', 'Ken Boshcoff',       134227, 48.3809, -89.2477),
  ('840',  'Lethbridge',                 'Alberta',                   'AB', 'Blaine Hyggen',      117394, 49.6956,-112.8451),
  ('918',  'Kamloops',                   'British Columbia',          'BC', 'Reid Hamer-Jackson', 114142, 50.6745,-120.3273),
  ('543',  'Brantford',                  'Ontario',                   'ON', 'Kevin Davis',        141681, 43.1394, -80.2644),
  ('938',  'Nanaimo',                    'British Columbia',          'BC', 'Leonard Krog',       147069, 49.1659,-123.9401),
  ('930',  'Chilliwack',                 'British Columbia',          'BC', 'Ken Popove',         125109, 49.1579,-121.9514),
  ('522',  'Belleville-Quinte West',     'Ontario',                   'ON', 'Neil Ellis',         115121, 44.1628, -77.3832),
  ('830',  'Red Deer',                   'Alberta',                   'AB', 'Ken Johnston',       113980, 52.2681,-113.8112),
  ('320',  'Fredericton',                'New Brunswick',             'NB', 'Kate Rogers',        108681, 45.9636, -66.6431),
  ('450',  'Drummondville',              'Quebec',                    'QC', 'Stéphanie Lacoste',  107471, 45.8836, -72.4833),
  ('310',  'Saint John',                 'New Brunswick',             'NB', 'Donna Reardon',      127761, 45.2733, -66.0633),
  ('011',  'St. John''s',                'Newfoundland and Labrador', 'NL', 'Danny Breen',        223414, 47.5615, -52.7126);


-- ─── HOUSING ─────────────────────────────────────────────────────────────────
-- housing_starts_per_1000_pop computed: housing_starts_2023 / (population_2021 / 1000)
-- rent_to_income_ratio computed: (avg_rent_2br * 12 / median_household_income) * 100
insert into cities_housing
  (cma_code, mls_hpi_benchmark, mls_hpi_yoy_pct, avg_rent_2br, rent_to_income_ratio,
   housing_starts_per_1000_pop, source_notes, data_date)
values
  ('535',  1065000, -4.5, 2100, 28.0,  6.5, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('462',   545000, -3.0, 1400, 23.3,  5.1, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('933',  1175000, -5.0, 2300, 30.7, 10.6, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('825',   570000,  5.0, 1750, 20.0, 12.9, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('835',   400000,  3.0, 1450, 17.4,  9.9, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('505',   620000, -6.0, 1850, 21.1,  7.9, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('505G',  390000, -4.0, 1350, 18.4, 10.3, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('602',   355000,  1.0, 1300, 20.0,  7.2, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('421',   330000,  2.0, 1050, 16.8,  6.6, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('537',   790000, -8.0, 1650, 24.8,  5.7, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('541',   720000, -9.0, 1700, 23.2,  9.6, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('555',   615000, -8.5, 1600, 24.6,  7.4, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('205',   510000, -2.0, 1700, 24.9, 10.7, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('539',   590000, -7.0, 1500, 24.7,  5.8, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('532',   780000, -8.0, 1700, 24.9,  7.2, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('935',   870000, -6.0, 2000, 27.3,  8.8, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('559',   490000,  0.0, 1350, 21.6,  7.1, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('725',   360000,  3.0, 1250, 18.1,  9.5, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('705',   310000,  2.5, 1200, 17.6,  8.0, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('433',   310000,  1.0, 1000, 17.6,  8.8, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('568',   730000, -9.0, 1700, 24.0, 12.7, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('915',   800000, -8.0, 1850, 27.1, 15.8, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('932',   800000, -7.0, 1750, 26.3, 10.2, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('521',   590000, -7.5, 1700, 24.3, 10.4, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('408',   230000,  2.0,  900, 15.9,  7.5, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('442',   260000,  3.0,  950, 17.5,  9.0, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('550',   750000, -8.0, 1800, 23.5, 12.1, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('305',   340000,  2.0, 1350, 22.5, 14.2, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('580',   380000,  0.0, 1300, 20.0,  6.1, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('570',   640000, -9.0, 1650, 26.1, 10.7, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('595',   280000,  1.0, 1100, 17.8,  6.0, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('840',   340000,  3.0, 1250, 18.8, 10.2, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('918',   600000, -5.0, 1600, 24.6, 13.1, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('543',   650000, -8.5, 1600, 24.6, 12.7, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('938',   700000, -7.0, 1750, 28.0, 12.2, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('930',   720000, -6.0, 1650, 27.5, 14.4, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('522',   530000, -9.0, 1500, 24.7, 10.4, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('830',   355000,  3.0, 1300, 18.8,  8.8, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('320',   320000,  1.0, 1250, 20.8, 12.9, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('450',   270000,  2.0,  900, 16.1, 11.2, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('310',   275000,  2.0, 1150, 20.9,  6.3, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01'),
  ('011',   340000,  3.0, 1300, 19.3,  5.4, 'CREA MLS HPI 2023; CMHC RMS 2023; starts estimate', '2023-12-01');


-- ─── SAFETY ──────────────────────────────────────────────────────────────────
-- Source: Statistics Canada Table 35-10-0026-01, 2022 data
-- National CSI average ≈ 73 (2022)
insert into cities_safety
  (cma_code, crime_severity_index, violent_csi, csi_10yr_trend, source_notes, data_date)
values
  ('535',  56.2,  52.1, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('462',  68.0,  65.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('933',  84.0,  78.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('825',  80.0,  72.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('835', 100.0,  95.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('505',  64.0,  58.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('505G', 70.0,  63.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('602', 110.0, 115.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('421',  55.0,  50.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('537',  74.0,  68.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('541',  70.0,  60.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('555',  82.0,  78.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('205',  72.0,  68.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('539',  73.0,  67.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('532',  75.0,  68.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('935',  90.0,  82.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('559',  85.0,  80.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('725', 125.0, 130.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('705', 130.0, 135.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('433',  62.0,  56.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('568',  78.0,  70.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('915', 100.0,  88.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('932', 105.0,  95.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('521',  68.0,  60.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('408',  60.0,  52.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('442',  75.0,  68.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('550',  60.0,  52.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('305',  78.0,  72.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('580',  90.0,  85.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('570',  80.0,  72.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('595', 120.0, 125.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('840', 130.0, 125.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('918', 100.0,  92.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('543',  88.0,  80.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('938', 110.0, 100.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('930', 105.0,  95.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('522',  78.0,  70.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('830', 140.0, 135.0, 'worsening', 'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('320',  72.0,  65.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('450',  65.0,  58.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('310',  95.0,  88.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31'),
  ('011',  68.0,  62.0, 'stable',    'StatsCan 35-10-0026-01, 2022', '2022-12-31');


-- ─── FISCAL ──────────────────────────────────────────────────────────────────
-- property_tax_residential_rate: % of assessed value (e.g. 0.631 = 0.631%)
-- Other fiscal fields left null pending Stats Canada 10-10-0020-01 fetch
insert into cities_fiscal
  (cma_code, property_tax_residential_rate, source_notes, data_date)
values
  ('535',  0.631, 'City of Toronto 2023 budget; moderate confidence', '2023-01-01'),
  ('462',  0.692, 'Ville de Montréal 2023 approximate; moderate confidence', '2023-01-01'),
  ('933',  0.269, 'City of Vancouver 2023; moderate confidence', '2023-01-01'),
  ('825',  0.635, 'City of Calgary 2023 approximate; moderate confidence', '2023-01-01'),
  ('835',  0.869, 'City of Edmonton 2023 approximate; moderate confidence', '2023-01-01'),
  ('505',  1.101, 'City of Ottawa 2023 approximate; moderate confidence', '2023-01-01'),
  ('505G', 1.010, 'Ville de Gatineau 2023 approximate; moderate confidence', '2023-01-01'),
  ('602',  2.643, 'City of Winnipeg 2023 approximate — high mill rate on low assessed values; moderate confidence', '2023-01-01'),
  ('421',  0.820, 'Ville de Québec 2023 approximate; moderate confidence', '2023-01-01'),
  ('537',  1.293, 'City of Hamilton 2023 approximate; moderate confidence', '2023-01-01'),
  ('541',  1.100, 'Kitchener 2023 approximate; moderate confidence', '2023-01-01'),
  ('555',  1.254, 'City of London 2023 approximate; moderate confidence', '2023-01-01'),
  ('205',  1.247, 'Halifax Regional Municipality 2023 approximate; moderate confidence', '2023-01-01'),
  ('539',  1.500, 'City of St. Catharines 2023 approximate; moderate confidence', '2023-01-01'),
  ('532',  1.311, 'City of Oshawa 2023 approximate; moderate confidence', '2023-01-01'),
  ('935',  0.520, 'City of Victoria 2023 approximate; moderate confidence', '2023-01-01'),
  ('559',  1.775, 'City of Windsor 2023 approximate; moderate confidence', '2023-01-01'),
  ('725',  1.170, 'City of Saskatoon 2023 approximate; moderate confidence', '2023-01-01'),
  ('705',  1.251, 'City of Regina 2023 approximate; moderate confidence', '2023-01-01'),
  ('433',  1.200, 'Ville de Sherbrooke 2023 approximate; moderate confidence', '2023-01-01'),
  ('568',  1.400, 'City of Barrie 2023 approximate; moderate confidence', '2023-01-01'),
  ('915',  0.520, 'City of Kelowna 2023 approximate; moderate confidence', '2023-01-01'),
  ('932',  0.590, 'City of Abbotsford 2023 approximate; moderate confidence', '2023-01-01'),
  ('521',  1.450, 'City of Kingston 2023 approximate; moderate confidence', '2023-01-01'),
  ('408',  1.350, 'Ville de Saguenay 2023 approximate; moderate confidence', '2023-01-01'),
  ('442',  1.250, 'Ville de Trois-Rivières 2023 approximate; moderate confidence', '2023-01-01'),
  ('550',  1.221, 'City of Guelph 2023 approximate; moderate confidence', '2023-01-01'),
  ('305',  1.590, 'City of Moncton 2023 approximate; moderate confidence', '2023-01-01'),
  ('580',  1.600, 'City of Greater Sudbury 2023 approximate; moderate confidence', '2023-01-01'),
  ('570',  1.594, 'City of Peterborough 2023 approximate; moderate confidence', '2023-01-01'),
  ('595',  1.700, 'City of Thunder Bay 2023 approximate; moderate confidence', '2023-01-01'),
  ('840',  0.870, 'City of Lethbridge 2023 approximate; moderate confidence', '2023-01-01'),
  ('918',  0.570, 'City of Kamloops 2023 approximate; moderate confidence', '2023-01-01'),
  ('543',  1.479, 'City of Brantford 2023 approximate; moderate confidence', '2023-01-01'),
  ('938',  0.610, 'City of Nanaimo 2023 approximate; moderate confidence', '2023-01-01'),
  ('930',  0.540, 'City of Chilliwack 2023 approximate; moderate confidence', '2023-01-01'),
  ('522',  1.550, 'City of Belleville 2023 approximate; moderate confidence', '2023-01-01'),
  ('830',  0.950, 'City of Red Deer 2023 approximate; moderate confidence', '2023-01-01'),
  ('320',  1.620, 'City of Fredericton 2023 approximate; moderate confidence', '2023-01-01'),
  ('450',  1.100, 'Ville de Drummondville 2023 approximate; moderate confidence', '2023-01-01'),
  ('310',  1.785, 'City of Saint John 2023 approximate; moderate confidence', '2023-01-01'),
  ('011',  0.800, 'City of St. John''s 2023 approximate; moderate confidence', '2023-01-01');


-- ─── ECONOMIC ────────────────────────────────────────────────────────────────
-- income_vs_national_avg_pct: (median_household_income - 66800) / 66800 * 100
-- national median ≈ $66,800 (2021 Census)
-- unemployment_vs_national_avg: delta from ~6.3% national average (LFS 2023)
insert into cities_economic
  (cma_code, unemployment_rate, unemployment_vs_national_avg,
   median_household_income, income_vs_national_avg_pct,
   population_growth_rate_pct, source_notes, data_date)
values
  ('535',  6.2, -0.1,  90000,  34.7,  4.6, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('462',  5.8, -0.5,  72000,   7.8,  3.8, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('933',  5.5, -0.8,  90000,  34.7,  7.3, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('825',  6.8,  0.5, 105000,  57.2,  5.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('835',  7.2,  0.9, 100000,  49.7,  4.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('505',  5.0, -1.3, 105000,  57.2,  8.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('505G', 5.2, -1.1,  88000,  31.7,  7.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('602',  5.5, -0.8,  78000,  16.8,  3.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('421',  4.0, -2.3,  75000,  12.3,  3.2, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('537',  6.5,  0.2,  80000,  19.8,  7.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('541',  5.5, -0.8,  88000,  31.7, 11.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('555',  7.0,  0.7,  78000,  16.8,  6.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('205',  6.0, -0.3,  82000,  22.8, 14.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('539',  7.5,  1.2,  73000,   9.3,  5.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('532',  6.8,  0.5,  82000,  22.8,  9.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('935',  4.8, -1.5,  88000,  31.7,  8.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('559',  8.5,  2.2,  75000,  12.3,  7.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('725',  6.2, -0.1,  83000,  24.3,  4.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('705',  6.0, -0.3,  82000,  22.8,  2.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('433',  4.5, -1.8,  68000,   1.8,  5.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('568',  6.5,  0.2,  85000,  27.3, 13.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('915',  5.5, -0.8,  82000,  22.8, 15.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('932',  5.8, -0.5,  80000,  19.8,  9.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('521',  5.5, -0.8,  84000,  25.7,  8.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('408',  5.5, -0.8,  68000,   1.8,  0.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('442',  5.0, -1.3,  65000,  -2.7,  3.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('550',  4.8, -1.5,  92000,  37.7, 10.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('305',  7.5,  1.2,  72000,   7.8, 14.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('580',  7.5,  1.2,  78000,  16.8,  1.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('570',  7.0,  0.7,  76000,  13.8,  8.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('595',  7.8,  1.5,  74000,  10.8, -0.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('840',  7.5,  1.2,  80000,  19.8,  5.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('918',  6.0, -0.3,  78000,  16.8,  7.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('543',  7.0,  0.7,  78000,  16.8, 10.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('938',  6.0, -0.3,  75000,  12.3, 10.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('930',  6.5,  0.2,  72000,   7.8, 12.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('522',  6.8,  0.5,  73000,   9.3,  9.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('830',  8.0,  1.7,  83000,  24.3,  2.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('320',  6.5,  0.2,  72000,   7.8,  9.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('450',  4.5, -1.8,  67000,   0.3,  6.0, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('310',  9.0,  2.7,  66000,  -1.2,  3.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01'),
  ('011',  9.5,  3.2,  81000,  21.3,  2.5, 'StatsCan LFS 2023; 2021 Census income; 2016-2021 pop growth', '2023-01-01');


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES LEFT EMPTY FOR MANUAL POPULATION:
-- cities_liveability    — transit, commute, air quality, parks spending
-- cities_community      — homelessness counts, social services spending
-- cities_infrastructure_projects — per-city project tracking
--
-- Priority data to add next:
-- 1. avg_commute_time_mins for all cities (2021 Census Table 98-400-X2021059)
-- 2. transit_ridership_per_capita (StatsCan 23-10-0251-01)
-- 3. homelessness_per_10k where available (Infrastructure Canada PiT counts)
-- ─────────────────────────────────────────────────────────────────────────────
