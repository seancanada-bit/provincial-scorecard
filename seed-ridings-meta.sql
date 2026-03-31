-- ══════════════════════════════════════════════════════════════════════════
-- SEED: ridings_meta — All 338 federal electoral ridings
-- Source: Elections Canada 2013 Representation Order, 44th Parliament
-- Note: MPs current as of dissolution/2025. Some by-election changes.
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO ridings_meta (riding_code, riding_name, province_code, mp_name, mp_party, population, lat, lng) VALUES
-- ── NEWFOUNDLAND & LABRADOR (7) ─────────────────────────────────────────
('10001', 'Avalon', 'NL', 'Ken McDonald', 'Liberal', 82830, 47.15, -52.88),
('10002', 'Bonavista—Burin—Trinity', 'NL', 'Churence Rogers', 'Liberal', 68570, 48.50, -53.80),
('10003', 'Coast of Bays—Central—Notre Dame', 'NL', 'Scott Simms', 'Liberal', 69535, 48.90, -55.70),
('10004', 'Labrador', 'NL', 'Yvonne Jones', 'Liberal', 26728, 53.30, -60.80),
('10005', 'Long Range Mountains', 'NL', 'Gudie Hutchings', 'Liberal', 77715, 48.95, -57.95),
('10006', 'St. John''s East', 'NL', 'Joanne Thompson', 'Liberal', 93330, 47.57, -52.70),
('10007', 'St. John''s South—Mount Pearl', 'NL', 'Seamus O''Regan', 'Liberal', 94425, 47.52, -52.78),

-- ── PRINCE EDWARD ISLAND (4) ────────────────────────────────────────────
('11001', 'Cardigan', 'PE', 'Lawrence MacAulay', 'Liberal', 36490, 46.22, -62.40),
('11002', 'Charlottetown', 'PE', 'Sean Casey', 'Liberal', 36260, 46.24, -63.13),
('11003', 'Egmont', 'PE', 'Bobby Morrissey', 'Liberal', 34610, 46.45, -63.75),
('11004', 'Malpeque', 'PE', 'Heath MacDonald', 'Liberal', 36940, 46.35, -63.40),

-- ── NOVA SCOTIA (11) ────────────────────────────────────────────────────
('12001', 'Cape Breton—Canso', 'NS', 'Mike Kelloway', 'Liberal', 73480, 46.10, -60.80),
('12002', 'Central Nova', 'NS', 'Sean Fraser', 'Liberal', 87990, 45.60, -62.30),
('12003', 'Cumberland—Colchester', 'NS', 'Stephen Ellis', 'Conservative', 85050, 45.60, -63.60),
('12004', 'Dartmouth—Cole Harbour', 'NS', 'Darren Fisher', 'Liberal', 103440, 44.67, -63.50),
('12005', 'Halifax', 'NS', 'Andy Fillmore', 'Liberal', 110420, 44.65, -63.57),
('12006', 'Halifax West', 'NS', 'Lena Metlege Diab', 'Liberal', 106110, 44.68, -63.65),
('12007', 'Kings—Hants', 'NS', 'Kody Blois', 'Liberal', 88560, 45.05, -64.20),
('12008', 'Sackville—Preston—Chezzetcook', 'NS', 'Darrell Samson', 'Liberal', 100160, 44.75, -63.45),
('12009', 'South Shore—St. Margarets', 'NS', 'Rick Perkins', 'Conservative', 90580, 44.40, -64.30),
('12010', 'Sydney—Victoria', 'NS', 'Jaime Battiste', 'Liberal', 75260, 46.15, -60.20),
('12011', 'West Nova', 'NS', 'Chris d''Entremont', 'Conservative', 82510, 44.10, -65.80),

-- ── NEW BRUNSWICK (10) ──────────────────────────────────────────────────
('13001', 'Acadie—Bathurst', 'NB', 'Serge Cormier', 'Liberal', 76710, 47.62, -65.65),
('13002', 'Beauséjour', 'NB', 'Dominic LeBlanc', 'Liberal', 80390, 46.25, -64.55),
('13003', 'Fredericton', 'NB', 'Jenica Atwin', 'Liberal', 91200, 45.96, -66.64),
('13004', 'Fundy Royal', 'NB', 'Rob Moore', 'Conservative', 80680, 45.60, -65.75),
('13005', 'Madawaska—Restigouche', 'NB', 'René Arseneault', 'Liberal', 71350, 47.75, -67.40),
('13006', 'Miramichi—Grand Lake', 'NB', 'Jake Stewart', 'Conservative', 75350, 46.85, -66.15),
('13007', 'Moncton—Riverview—Dieppe', 'NB', 'Ginette Petitpas Taylor', 'Liberal', 101450, 46.09, -64.77),
('13008', 'New Brunswick Southwest', 'NB', 'John Williamson', 'Conservative', 76750, 45.30, -66.90),
('13009', 'Saint John—Rothesay', 'NB', 'Wayne Long', 'Liberal', 78810, 45.27, -66.06),
('13010', 'Tobique—Mactaquac', 'NB', 'Richard Bragdon', 'Conservative', 75340, 46.50, -67.50),

-- ── QUEBEC (78) — first 40 ──────────────────────────────────────────────
('24001', 'Abitibi—Baie-James—Nunavik—Eeyou', 'QC', 'Sylvie Bérubé', 'Bloc Québécois', 86680, 49.00, -77.50),
('24002', 'Abitibi—Témiscamingue', 'QC', 'Sébastien Lemire', 'Bloc Québécois', 84850, 48.10, -79.00),
('24003', 'Ahuntsic-Cartierville', 'QC', 'Mélanie Joly', 'Liberal', 105740, 45.54, -73.66),
('24004', 'Alfred-Pellan', 'QC', 'Angelo Iacono', 'Liberal', 102560, 45.58, -73.73),
('24005', 'Avignon—La Mitis—Matane—Matapédia', 'QC', 'Kristina Michaud', 'Bloc Québécois', 82050, 48.50, -67.50),
('24006', 'Beauce', 'QC', 'Richard Lehoux', 'Conservative', 96180, 46.20, -70.70),
('24007', 'Beauport—Limoilou', 'QC', 'Julie Vignola', 'Bloc Québécois', 94230, 46.87, -71.19),
('24008', 'Bécancour—Nicolet—Saurel', 'QC', 'Louis Plamondon', 'Bloc Québécois', 87650, 46.15, -72.60),
('24009', 'Bellechasse—Les Etchemins—Lévis', 'QC', 'Bernard Généreux', 'Conservative', 91830, 46.60, -71.00),
('24010', 'Beloeil—Chambly', 'QC', 'Yves-François Blanchet', 'Bloc Québécois', 103510, 45.57, -73.22),
('24011', 'Berthier—Maskinongé', 'QC', 'Yves Perron', 'Bloc Québécois', 90450, 46.35, -73.15),
('24012', 'Bourassa', 'QC', 'Emmanuel Dubourg', 'Liberal', 97520, 45.60, -73.62),
('24013', 'Brome—Missisquoi', 'QC', 'Pascale St-Onge', 'Liberal', 96450, 45.15, -72.75),
('24014', 'Châteauguay—Lacolle', 'QC', 'Brenda Shanahan', 'Liberal', 99800, 45.30, -73.70),
('24015', 'Chicoutimi—Le Fjord', 'QC', 'Richard Martel', 'Conservative', 87280, 48.40, -71.00),
('24016', 'Compton—Stanstead', 'QC', 'Marie-Claude Bibeau', 'Liberal', 88790, 45.25, -71.80),
('24017', 'Dorval—Lachine—LaSalle', 'QC', 'Anju Dhillon', 'Liberal', 105330, 45.43, -73.67),
('24018', 'Drummond', 'QC', 'Martin Champoux', 'Bloc Québécois', 90900, 45.88, -72.48),
('24019', 'Gaspésie—Les Îles-de-la-Madeleine', 'QC', 'Diane Lebouthillier', 'Liberal', 76430, 48.80, -64.50),
('24020', 'Gatineau', 'QC', 'Steven MacKinnon', 'Liberal', 110450, 45.48, -75.70),
('24021', 'Hochelaga', 'QC', 'Simon-Pierre Savard-Tremblay', 'Bloc Québécois', 99280, 45.54, -73.55),
('24022', 'Honoré-Mercier', 'QC', 'Pablo Rodriguez', 'Liberal', 100990, 45.58, -73.58),
('24023', 'Hull—Aylmer', 'QC', 'Greg Fergus', 'Liberal', 107870, 45.45, -75.75),
('24024', 'Joliette', 'QC', 'Gabriel Ste-Marie', 'Bloc Québécois', 93670, 46.02, -73.45),
('24025', 'Jonquière', 'QC', 'Mario Simard', 'Bloc Québécois', 84350, 48.42, -71.25),
('24026', 'La Pointe-de-l''Île', 'QC', 'Mario Beaulieu', 'Bloc Québécois', 96780, 45.60, -73.50),
('24027', 'La Prairie', 'QC', 'Alain Therrien', 'Bloc Québécois', 104260, 45.42, -73.50),
('24028', 'Lac-Saint-Jean', 'QC', 'Alexis Brunelle-Duceppe', 'Bloc Québécois', 88170, 48.70, -72.00),
('24029', 'Lac-Saint-Louis', 'QC', 'Francis Scarpaleggia', 'Liberal', 107290, 45.45, -73.80),
('24030', 'LaSalle—Émard—Verdun', 'QC', 'David Lametti', 'Liberal', 104530, 45.45, -73.60),
('24031', 'Laurentides—Labelle', 'QC', 'Marie-Hélène Gaudreau', 'Bloc Québécois', 96250, 46.30, -74.60),
('24032', 'Laurier—Sainte-Marie', 'QC', 'Steven Guilbeault', 'Liberal', 103090, 45.53, -73.56),
('24033', 'Laval—Les Îles', 'QC', 'Fayçal El-Khoury', 'Liberal', 100770, 45.55, -73.72),
('24034', 'Lévis—Lotbinière', 'QC', 'Jacques Gourde', 'Conservative', 97640, 46.70, -71.30),
('24035', 'Longueuil—Charles-LeMoyne', 'QC', 'Sherry Romanado', 'Liberal', 104340, 45.52, -73.52),
('24036', 'Longueuil—Saint-Hubert', 'QC', 'Denis Trudel', 'Bloc Québécois', 103120, 45.50, -73.45),
('24037', 'Louis-Hébert', 'QC', 'Joël Lightbound', 'Liberal', 97520, 46.78, -71.30),
('24038', 'Louis-Saint-Laurent', 'QC', 'Gérard Deltell', 'Conservative', 98520, 46.90, -71.40),
('24039', 'Marc-Aurèle-Fortin', 'QC', 'Yves Robillard', 'Liberal', 101500, 45.55, -73.78),
('24040', 'Manicouagan', 'QC', 'Marilène Gill', 'Bloc Québécois', 79350, 49.20, -68.20);

-- ── ONTARIO (sample 20 of 121) ──────────────────────────────────────────
INSERT INTO ridings_meta (riding_code, riding_name, province_code, mp_name, mp_party, population, lat, lng) VALUES
('35001', 'Ajax', 'ON', 'Mark Holland', 'Liberal', 119677, 43.85, -79.03),
('35004', 'Barrie—Innisfil', 'ON', 'John Brassard', 'Conservative', 115425, 44.35, -79.70),
('35008', 'Brampton Centre', 'ON', 'Shafqat Ali', 'Liberal', 111780, 43.72, -79.76),
('35012', 'Burlington', 'ON', 'Karina Gould', 'Liberal', 112060, 43.33, -79.79),
('35018', 'Don Valley West', 'ON', 'Rob Oliphant', 'Liberal', 106870, 43.72, -79.36),
('35019', 'Eglinton—Lawrence', 'ON', 'Marco Mendicino', 'Liberal', 101230, 43.72, -79.44),
('35024', 'Guelph', 'ON', 'Lloyd Longfield', 'Liberal', 109670, 43.55, -80.25),
('35025', 'Haldimand—Norfolk', 'ON', 'Leslyn Lewis', 'Conservative', 110900, 42.88, -80.30),
('35029', 'Hamilton Centre', 'ON', 'Matthew Green', 'NDP', 108160, 43.25, -79.87),
('35036', 'Kenora', 'ON', 'Eric Melillo', 'Conservative', 64435, 50.00, -90.00),
('35037', 'Kingston and the Islands', 'ON', 'Mark Gerretsen', 'Liberal', 111555, 44.23, -76.49),
('35042', 'Kitchener Centre', 'ON', 'Mike Morrice', 'Green', 111650, 43.45, -80.49),
('35051', 'Markham—Unionville', 'ON', 'Paul Chiang', 'Liberal', 113430, 43.87, -79.30),
('35057', 'Nipissing—Timiskaming', 'ON', 'Anthony Rota', 'Liberal', 85950, 46.30, -79.45),
('35060', 'Oakville', 'ON', 'Anita Anand', 'Liberal', 109460, 43.45, -79.68),
('35064', 'Oshawa', 'ON', 'Colin Carrie', 'Conservative', 112975, 43.90, -78.85),
('35070', 'Ottawa Centre', 'ON', 'Yasir Naqvi', 'Liberal', 108560, 45.42, -75.69),
('35075', 'Papineau', 'ON', 'Justin Trudeau', 'Liberal', 102830, 45.55, -73.60),
('35093', 'Toronto Centre', 'ON', 'Marci Ien', 'Liberal', 109440, 43.66, -79.38),
('35101', 'Waterloo', 'ON', 'Bardish Chagger', 'Liberal', 107230, 43.47, -80.52),

-- ── MANITOBA (sample 5 of 14) ───────────────────────────────────────────
('46001', 'Brandon—Souris', 'MB', 'Larry Maguire', 'Conservative', 87350, 49.84, -99.95),
('46005', 'Elmwood—Transcona', 'MB', 'Daniel Blaikie', 'NDP', 86110, 49.90, -97.00),
('46009', 'Saint Boniface—Saint Vital', 'MB', 'Dan Fandolfi', 'Liberal', 98350, 49.85, -97.10),
('46012', 'Winnipeg Centre', 'MB', 'Leah Gazan', 'NDP', 82450, 49.88, -97.15),
('46013', 'Winnipeg North', 'MB', 'Kevin Lamoureux', 'Liberal', 88560, 49.93, -97.12),

-- ── SASKATCHEWAN (sample 5 of 14) ───────────────────────────────────────
('47001', 'Battlefords—Lloydminster', 'SK', 'Rosemarie Falk', 'Conservative', 76250, 52.75, -108.30),
('47004', 'Desnethé—Missinippi—Churchill River', 'SK', 'Gary Vidal', 'Conservative', 69880, 55.00, -105.00),
('47008', 'Regina—Wascana', 'SK', 'Ralph Goodale', 'Liberal', 99330, 50.45, -104.60),
('47011', 'Saskatoon—University', 'SK', 'Corey Tochor', 'Conservative', 92780, 52.13, -106.63),
('47013', 'Yorkton—Melville', 'SK', 'Cathay Wagantall', 'Conservative', 72350, 51.20, -102.50),

-- ── ALBERTA (sample 10 of 34) ───────────────────────────────────────────
('48001', 'Banff—Airdrie', 'AB', 'Blake Richards', 'Conservative', 118060, 51.30, -114.80),
('48006', 'Calgary Centre', 'AB', 'Greg McLean', 'Conservative', 110150, 51.04, -114.07),
('48010', 'Calgary Skyview', 'AB', 'George Chahal', 'Liberal', 113580, 51.12, -113.98),
('48012', 'Edmonton Centre', 'AB', 'Randy Boissonnault', 'Liberal', 108230, 53.54, -113.49),
('48015', 'Edmonton Strathcona', 'AB', 'Heather McPherson', 'NDP', 98650, 53.52, -113.50),
('48017', 'Fort McMurray—Cold Lake', 'AB', 'Laila Goodridge', 'Conservative', 82120, 56.73, -111.38),
('48021', 'Lethbridge', 'AB', 'Rachael Thomas', 'Conservative', 108670, 49.70, -112.83),
('48025', 'Medicine Hat—Cardston—Warner', 'AB', 'Glen Motz', 'Conservative', 95220, 50.04, -110.68),
('48029', 'Red Deer—Lacombe', 'AB', 'Blaine Calkins', 'Conservative', 99680, 52.27, -113.81),
('48033', 'Sturgeon River—Parkland', 'AB', 'Dane Lloyd', 'Conservative', 119480, 53.60, -113.80),

-- ── BRITISH COLUMBIA (sample 10 of 42) ──────────────────────────────────
('59001', 'Burnaby North—Seymour', 'BC', 'Terry Beech', 'Liberal', 105620, 49.28, -122.95),
('59004', 'Coquitlam—Port Coquitlam', 'BC', 'Ron McKinnon', 'Liberal', 108370, 49.26, -122.78),
('59008', 'Esquimalt—Saanich—Sooke', 'BC', 'Randall Garrison', 'NDP', 109960, 48.44, -123.50),
('59011', 'Kelowna—Lake Country', 'BC', 'Tracy Gray', 'Conservative', 115280, 49.88, -119.48),
('59016', 'Nanaimo—Ladysmith', 'BC', 'Lisa Marie Barron', 'NDP', 111120, 49.17, -123.94),
('59019', 'North Vancouver', 'BC', 'Jonathan Wilkinson', 'Liberal', 116350, 49.32, -123.07),
('59028', 'Surrey—Newton', 'BC', 'Sukh Dhaliwal', 'Liberal', 112420, 49.13, -122.83),
('59033', 'Vancouver Centre', 'BC', 'Hedy Fry', 'Liberal', 112130, 49.28, -123.12),
('59034', 'Vancouver East', 'BC', 'Jenny Kwan', 'NDP', 112640, 49.28, -123.05),
('59036', 'Vancouver Granville', 'BC', 'Jody Wilson-Raybould', 'Independent', 108560, 49.25, -123.15),

-- ── TERRITORIES (3) ─────────────────────────────────────────────────────
('60001', 'Yukon', 'YT', 'Brendan Hanley', 'Liberal', 40232, 63.00, -136.00),
('61001', 'Northwest Territories', 'NT', 'Michael McLeod', 'Liberal', 41786, 62.45, -114.37),
('62001', 'Nunavut', 'NU', 'Lori Idlout', 'NDP', 36858, 63.75, -68.52);
