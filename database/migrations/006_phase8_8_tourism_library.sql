-- ============================================================
-- PHASE 8.8: Uganda tourism library + future-map coordinates
-- ============================================================
-- This migration only extends tourism data. It never deletes users, sessions,
-- bookings, or the original destination rows.

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS district VARCHAR(120),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

ALTER TABLE destinations DROP CONSTRAINT IF EXISTS destinations_latitude_check;
ALTER TABLE destinations ADD CONSTRAINT destinations_latitude_check
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);
ALTER TABLE destinations DROP CONSTRAINT IF EXISTS destinations_longitude_check;
ALTER TABLE destinations ADD CONSTRAINT destinations_longitude_check
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

CREATE UNIQUE INDEX IF NOT EXISTS destinations_name_unique_ci
  ON destinations (LOWER(name));

CREATE TABLE IF NOT EXISTS attractions (
  id BIGSERIAL PRIMARY KEY,
  destination_id BIGINT REFERENCES destinations(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  district VARCHAR(120),
  region VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  highlight VARCHAR(255),
  latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  image_url TEXT,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo_credit VARCHAR(180),
  photo_source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS attractions_name_unique_ci
  ON attractions (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_attractions_destination_id
  ON attractions(destination_id);
CREATE INDEX IF NOT EXISTS idx_attractions_category
  ON attractions(category);

-- Preserve original IDs while making the original nine map-ready.
UPDATE destinations SET district='Masindi, Kiryandongo, Nwoya and Buliisa', latitude=2.280000, longitude=31.690000 WHERE name='Murchison Falls';
UPDATE destinations SET district='Kanungu, Kabale and Kisoro', latitude=-1.033333, longitude=29.716667 WHERE name='Bwindi Impenetrable National Park';
UPDATE destinations SET district='Jinja', latitude=0.447857, longitude=33.202612 WHERE name='Jinja';
UPDATE destinations SET district='Kasese, Rubirizi, Rukungiri and Kamwenge', latitude=-0.200000, longitude=30.000000 WHERE name='Queen Elizabeth National Park';
UPDATE destinations SET district='Kaabong', latitude=3.840000, longitude=33.850000 WHERE name='Kidepo Valley National Park';
UPDATE destinations SET district='Kabale', latitude=-1.295000, longitude=29.916000 WHERE name='Lake Bunyonyi';
UPDATE destinations SET district='Kapchorwa', latitude=1.335000, longitude=34.379000 WHERE name='Sipi Falls';
UPDATE destinations SET district='Kampala', latitude=0.347596, longitude=32.582520 WHERE name='Kampala';
UPDATE destinations SET district='Kasese, Kabarole and Bundibugyo', latitude=0.383333, longitude=29.983333 WHERE name='Rwenzori Mountains';

-- Ten additional major destinations. Name conflict handling makes reruns safe.
INSERT INTO destinations (name,category,region,district,description,highlight,activities,best_for,suggested_days,travel_tip,latitude,longitude,image_url,photo_credit,photo_source_url,gallery_images)
VALUES
('Kibale National Park','Wildlife','Western Uganda','Kabarole and Kamwenge','A rainforest national park renowned for chimpanzee tracking and Uganda''s exceptional diversity of primates.','Chimpanzees and rainforest biodiversity',ARRAY['Chimpanzee tracking','Forest walks','Birding'],'Primate enthusiasts and rainforest travellers',3,'Book primate activities in advance and carry rain protection for forest conditions.',0.500000,30.400000,'images/destinations/kibale/kibale-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Kibale%20National%20Park','[{"url":"images/destinations/kibale/kibale-01.jpg"},{"url":"images/destinations/kibale/kibale-02.jpg"}]'),
('Lake Mburo National Park','Wildlife','Western Uganda','Kiruhura','A compact savannah-and-wetland park known for zebras, impalas, birdlife and active safari experiences.','Zebras, wetlands and walking safaris',ARRAY['Game drives','Boat trips','Guided nature walks'],'Short safaris, wildlife and birding',2,'Combine an early wildlife drive with a lake or guided walking experience.',-0.627778,30.966667,'images/destinations/lake-mburo/lake-mburo-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Lake%20Mburo%20National%20Park','[{"url":"images/destinations/lake-mburo/lake-mburo-01.jpg"},{"url":"images/destinations/lake-mburo/lake-mburo-02.jpg"}]'),
('Semuliki National Park','Nature','Western Uganda','Bundibugyo','A lowland forest park at the edge of the Albertine Rift, celebrated for Central African species, birding and hot springs.','Lowland forest and Sempaya Hot Springs',ARRAY['Hot-spring walks','Birding','Forest nature walks'],'Birders and unusual forest landscapes',2,'Use a local guide on the spring trail and prepare for humid forest conditions.',0.825000,30.061111,'images/destinations/semuliki/semuliki-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Semuliki%20National%20Park','[{"url":"images/destinations/semuliki/semuliki-01.jpg"},{"url":"images/destinations/semuliki/semuliki-02.jpg"}]'),
('Mount Elgon National Park','Adventure','Eastern Uganda','Mbale, Sironko, Manafwa, Bududa and Kapchorwa','A transboundary mountain landscape with highland trails, caves, waterfalls and the broad caldera of an ancient volcano.','Highland hiking and volcanic scenery',ARRAY['Mountain hiking','Cave and waterfall walks','Birding'],'Hikers and highland nature travellers',3,'Choose a route suited to your fitness and use authorised guides for longer treks.',1.133333,34.583333,'images/destinations/mount-elgon/mount-elgon-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Mount%20Elgon%20Uganda','[{"url":"images/destinations/mount-elgon/mount-elgon-01.jpg"},{"url":"images/destinations/mount-elgon/mount-elgon-02.jpg"}]'),
('Mgahinga Gorilla National Park','Wildlife','Western Uganda','Kisoro','Uganda''s smallest national park protects Virunga volcano habitats used by mountain gorillas and golden monkeys.','Gorillas, golden monkeys and Virunga volcanoes',ARRAY['Gorilla tracking','Golden monkey tracking','Volcano hiking'],'Primate and mountain-adventure travellers',3,'Secure permits early and plan for steep, changeable mountain conditions.',-1.369444,29.640278,'images/destinations/mgahinga/mgahinga-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Mgahinga%20Gorilla%20National%20Park','[{"url":"images/destinations/mgahinga/mgahinga-01.jpg"},{"url":"images/destinations/mgahinga/mgahinga-02.jpg"}]'),
('Fort Portal','Nature','Western Uganda','Kabarole','A green western-Uganda tourism hub for crater-lake landscapes, Tooro heritage and journeys to nearby forests and mountains.','Crater lakes and Tooro highlands',ARRAY['Crater-lake exploration','Cultural visits','Nature excursions'],'Scenic road trips and western circuits',2,'Use the city as a base and allow separate days for crater lakes and protected areas.',0.654444,30.274444,'images/destinations/fort-portal/fort-portal-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Fort%20Portal%20Uganda','[{"url":"images/destinations/fort-portal/fort-portal-01.jpg"},{"url":"images/destinations/fort-portal/fort-portal-02.jpg"}]'),
('Entebbe','City','Central Uganda','Wakiso','A relaxed Lake Victoria gateway with botanical, wildlife, wetland and island experiences close to Uganda''s international airport.','Lake Victoria nature gateway',ARRAY['Lake Victoria excursions','Botanical walks','Wildlife education'],'Families, birders and short stays',2,'Reserve island transfers ahead and keep weather flexibility for lake trips.',0.050000,32.460000,'images/destinations/entebbe/entebbe-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Entebbe%20Uganda','[{"url":"images/destinations/entebbe/entebbe-01.jpg"},{"url":"images/destinations/entebbe/entebbe-02.jpg"}]'),
('Ssese Islands','Island','Central Uganda','Kalangala','An archipelago in Lake Victoria offering beaches, forested shorelines, fishing culture and unhurried island stays.','Lake Victoria island escape',ARRAY['Island exploration','Beach relaxation','Boat experiences'],'Slow travel, couples and lake escapes',3,'Confirm ferry schedules and onward transport before travelling.',-0.433333,32.250000,'images/destinations/ssese-islands/ssese-islands-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Ssese%20Islands','[{"url":"images/destinations/ssese-islands/ssese-islands-01.jpg"},{"url":"images/destinations/ssese-islands/ssese-islands-02.jpg"}]'),
('Lake Mutanda','Lake','Western Uganda','Kisoro','A scenic freshwater lake framed by terraced highlands and views toward the Virunga volcanoes near Kisoro.','Virunga views and tranquil water',ARRAY['Canoeing','Lakeside walks','Landscape photography'],'Quiet nature stays and photographers',2,'Mornings often offer calmer water and clearer volcano views.',-1.235000,29.670000,'images/destinations/lake-mutanda/lake-mutanda-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Lake%20Mutanda','[{"url":"images/destinations/lake-mutanda/lake-mutanda-01.jpg"},{"url":"images/destinations/lake-mutanda/lake-mutanda-02.jpg"}]'),
('Ziwa Rhino Sanctuary','Wildlife','Central Uganda','Nakasongola','A conservation sanctuary central to Uganda''s white-rhino recovery programme and known for guided rhino tracking.','Guided white-rhino tracking',ARRAY['Guided rhino tracking','Birding','Nature walks'],'Conservation-minded wildlife travellers',1,'Use the sanctuary''s authorised guides and verify current visitor arrangements before departure.',1.485556,32.095278,'images/destinations/ziwa-rhino-sanctuary/ziwa-rhino-sanctuary-01.jpg','Wikimedia Commons contributors','https://commons.wikimedia.org/wiki/Special:MediaSearch?search=Ziwa%20Rhino%20Sanctuary','[{"url":"images/destinations/ziwa-rhino-sanctuary/ziwa-rhino-sanctuary-01.jpg"},{"url":"images/destinations/ziwa-rhino-sanctuary/ziwa-rhino-sanctuary-02.jpg"}]')
ON CONFLICT (LOWER(name)) DO NOTHING;

-- Attraction rows use destination-name lookups so original destination IDs are retained.
WITH attraction_data(parent_name,name,category,district,region,description,highlight,latitude,longitude,slug) AS (VALUES
('Kampala','Kasubi Royal Tombs','Heritage','Kampala','Central Uganda','UNESCO-listed royal burial grounds of Buganda kings, recognised for living traditions and monumental organic architecture.','Buganda royal heritage',0.329167,32.553333,'kasubi-royal-tombs'),
('Kampala','Uganda National Museum','Museum','Kampala','Central Uganda','Uganda''s national collection of archaeology, ethnography, natural history and musical heritage; currently listed by the museum authority as temporarily closed for renovation.','National collections and cultural history',0.335969,32.582511,'uganda-national-museum'),
('Kampala','Kabaka''s Palace','Heritage','Kampala','Central Uganda','The historic Mengo palace grounds of the Kabaka, presenting Buganda royal history and important twentieth-century memory.','Buganda monarchy and history',0.301700,32.560900,'kabakas-palace'),
('Kampala','Bulange and Royal Mile','Architecture','Kampala','Central Uganda','Buganda''s parliament building and the ceremonial avenue linking Bulange with the Kabaka''s Palace.','Buganda civic architecture',0.309500,32.558500,'bulange-royal-mile'),
('Kampala','Namugongo Martyrs Shrine','Faith','Wakiso','Central Uganda','A major Christian pilgrimage complex commemorating the Uganda Martyrs near Kampala.','Uganda Martyrs pilgrimage',0.387273,32.652365,'namugongo-martyrs-shrine'),
('Kampala','Ndere Cultural Centre','Culture','Kampala','Central Uganda','A performance and cultural venue presenting music, dance and traditions from communities across Uganda.','Ugandan music and dance',0.373900,32.615300,'ndere-cultural-centre'),
('Kampala','Uganda National Mosque','Faith','Kampala','Central Uganda','A prominent Old Kampala mosque whose elevated setting and architecture are city landmarks.','Old Kampala architecture and views',0.315539,32.568591,'uganda-national-mosque'),
('Kampala','National Theatre and Craft Village','Culture','Kampala','Central Uganda','A central arts complex for theatre and performance beside stalls offering Ugandan crafts and souvenirs.','Performing arts and local crafts',0.315833,32.589167,'national-theatre-craft-village'),
('Kampala','Kabaka''s Lake','History','Kampala','Central Uganda','A man-made lake associated with Kabaka Mwanga II and Buganda''s royal history.','Historic royal lake',0.297500,32.561667,'kabakas-lake'),
('Kampala','Munyonyo Martyrs Shrine','Faith','Kampala','Central Uganda','A lakeside Catholic shrine linked to the Uganda Martyrs and the start of their final journey.','Lakeside martyr heritage',0.237250,32.616535,'munyonyo-martyrs-shrine'),
('Jinja','Source of the Nile','Nature','Jinja','Eastern Uganda','The celebrated Lake Victoria outlet where the White Nile begins its northward journey.','Nile headwaters',0.416800,33.193900,'source-of-the-nile'),
('Jinja','Itanda Falls','Adventure','Jinja','Eastern Uganda','A powerful stretch of Nile rapids and rocky river scenery downstream of Jinja.','White-water Nile scenery',0.599700,33.057600,'itanda-falls'),
('Jinja','Busowoko Falls','Nature','Jinja','Eastern Uganda','A scenic Nile cascade and riverside stop north of Jinja, valued for its rushing water and rocky setting.','Nile cascade',0.528200,33.070400,'busowoko-falls'),
('Jinja','Mabira Forest','Ecotourism','Buikwe','Central Uganda','A large tropical forest reserve on the Kampala-Jinja corridor with nature trails, birdlife and primates.','Forest walks on the eastern corridor',0.398333,33.016389,'mabira-forest'),
('Jinja','Kagulu Hill','Hiking','Buyende','Eastern Uganda','A dramatic granite hill and Busoga cultural landmark with a steep climb and broad regional views.','Busoga hill climb',1.220833,33.330556,'kagulu-hill'),
('Jinja','Nalubaale Dam','Architecture','Jinja','Eastern Uganda','The historic hydroelectric dam at the Nile outlet, formerly known as Owen Falls Dam.','Nile engineering landmark',0.443611,33.185000,'nalubaale-dam'),
('Jinja','Source of the Nile Bridge','Architecture','Jinja','Eastern Uganda','A modern cable-stayed crossing over the Nile that forms a striking gateway between Jinja and Njeru.','Modern Nile crossing',0.438611,33.187500,'source-of-the-nile-bridge'),
('Jinja','Bishop Hannington Memorial Site','History','Mayuge','Eastern Uganda','A memorial and faith-heritage site at Kyando associated with Anglican bishop James Hannington.','Faith and colonial-era history',0.414900,33.496600,'bishop-hannington-site'),
('Jinja','Ssezibwa Falls','Culture','Mukono','Central Uganda','A culturally significant waterfall on the Kampala-Jinja route, combining riverside scenery with Buganda tradition.','Waterfall and living tradition',0.356413,32.861890,'ssezibwa-falls'),
('Kibale National Park','Bigodi Wetland Sanctuary','Ecotourism','Kamwenge','Western Uganda','A community-run wetland near Kibale known for guided walks, primates and rich birdlife.','Community wetland walks',0.410600,30.404800,'bigodi-wetland-sanctuary'),
('Fort Portal','Fort Portal Crater Lakes','Nature','Kabarole','Western Uganda','A cluster of volcanic crater lakes set among green hills around Fort Portal and the Ndali-Kasenda landscape.','Volcanic crater-lake scenery',0.493500,30.247900,'fort-portal-crater-lakes'),
('Fort Portal','Fort Portal Regional Museum','Museum','Kabarole','Western Uganda','An official regional museum interpreting Tooro and Bunyoro heritage, royal traditions and western Uganda''s landscapes.','Tooro and Bunyoro collections',0.654444,30.274444,'fort-portal-regional-museum'),
('Fort Portal','Katoosa Martyrs Site','Faith','Kyenjojo','Western Uganda','A Catholic martyr heritage and pilgrimage site where government-led Phase I tourism development began in 2026; visitor facilities are still developing.','Developing faith-heritage site',0.632100,30.647500,'katoosa-martyrs-site'),
('Semuliki National Park','Sempaya Hot Springs','Nature','Bundibugyo','Western Uganda','Semuliki''s best-known geothermal attraction, reached on a guided forest trail to steaming male and female springs.','Geothermal springs',0.835282,30.165564,'sempaya-hot-springs'),
('Queen Elizabeth National Park','Kazinga Channel','Wildlife','Kasese and Rubirizi','Western Uganda','A natural channel linking Lakes George and Edward, famous for boat-based wildlife and bird viewing.','Boat safari wildlife',-0.070961,29.157595,'kazinga-channel'),
('Queen Elizabeth National Park','Ishasha Sector','Wildlife','Kanungu','Western Uganda','The park''s southern savannah sector, particularly known for tree-climbing lions and quieter game drives.','Tree-climbing lions',-0.445000,29.686000,'ishasha-sector'),
('Queen Elizabeth National Park','Lake Katwe','Heritage','Kasese','Western Uganda','A saline crater lake beside a long-established community salt-working landscape.','Crater lake and salt heritage',-0.127500,29.868056,'lake-katwe'),
('Murchison Falls','Budongo Forest','Nature','Masindi','Western Uganda','A biodiverse mahogany forest south of Murchison Falls National Park known for chimpanzees and birdlife.','Chimpanzees and old-growth forest',1.724167,31.545833,'budongo-forest'),
('Entebbe','Ngamba Island Chimpanzee Sanctuary','Wildlife','Wakiso','Central Uganda','An island sanctuary caring for rescued chimpanzees, reached by organised boat transfer from the Entebbe area.','Rescued chimpanzee conservation',-0.104167,32.653056,'ngamba-island'),
('Entebbe','Uganda Wildlife Conservation Education Centre','Wildlife','Wakiso','Central Uganda','A conservation education centre on Lake Victoria caring for rescued native wildlife and supporting public learning.','Ugandan wildlife education',0.052778,32.476389,'uwec'),
('Entebbe','Entebbe Botanical Gardens','Nature','Wakiso','Central Uganda','Historic lakeside gardens with tropical plant collections, forest paths and birdlife.','Lakeside tropical gardens',0.063069,32.477717,'entebbe-botanical-gardens'),
('Entebbe','Mabamba Bay Wetland','Birding','Wakiso','Central Uganda','A Lake Victoria wetland and Ramsar site best known for guided canoe searches for the shoebill.','Shoebill wetland excursions',0.083333,32.333333,'mabamba-bay'),
('Entebbe','Lutembe Bay','Birding','Wakiso','Central Uganda','A protected Lake Victoria bay and Ramsar wetland important for migratory waterbirds.','Migratory waterbird habitat',0.154100,32.568100,'lutembe-bay'),
(NULL,'Nyero Rock Paintings','Archaeology','Kumi','Eastern Uganda','A protected rock-art complex of geometric paintings in shelters near Kumi, included on Uganda''s UNESCO Tentative List.','Geometric rock art',1.471528,33.846222,'nyero-rock-paintings'),
(NULL,'Fort Patiko / Baker''s Fort','History','Gulu','Northern Uganda','A stone-walled nineteenth-century site north of Gulu associated with regional trade, conflict and Samuel Baker''s anti-slavery campaign.','Northern Uganda historic fort',3.015834,32.317625,'fort-patiko'),
(NULL,'Tororo Rock','Hiking','Tororo','Eastern Uganda','A prominent volcanic plug rising above Tororo town, recognised for geology, caves and steep guided climbs.','Town landmark and summit views',0.685000,34.183611,'tororo-rock'),
(NULL,'Aruu Falls','Nature','Pader','Northern Uganda','A broad series of rocky cascades on the Agago River near Pader, especially dramatic during wetter months.','Rocky northern cascades',2.896667,32.646944,'aruu-falls'),
(NULL,'Kabale Regional Museum','Museum','Kabale','Western Uganda','An official regional museum focused on highland communities, material culture and terraced-farming traditions.','Southwestern highland heritage',-1.248600,29.989700,'kabale-regional-museum'),
(NULL,'Soroti Regional Museum','Museum','Soroti','Eastern Uganda','An official regional museum documenting Iteso and neighbouring communities through homesteads, pottery and material culture.','Teso cultural collections',1.714600,33.611100,'soroti-regional-museum'),
(NULL,'Moroto Regional Museum','Museum','Moroto','Northern Uganda','The official Karamoja regional museum, presenting pastoralist culture and important archaeological and fossil collections.','Karamoja culture and fossils',2.521260,34.684460,'moroto-regional-museum'),
(NULL,'Ajai Wildlife Reserve','Wildlife','Madi-Okollo','Northern Uganda','A protected reserve undergoing active restoration; southern white rhinos were reintroduced in 2026 as part of a phased national recovery programme.','Developing rhino conservation landscape',2.866667,31.283333,'ajai-wildlife-reserve')
)
INSERT INTO attractions (destination_id,name,category,district,region,description,highlight,latitude,longitude,image_url,gallery_images,photo_credit,photo_source_url)
SELECT d.id,a.name,a.category,a.district,a.region,a.description,a.highlight,a.latitude,a.longitude,
  'images/attractions/'||a.slug||'/'||a.slug||CASE WHEN a.slug IN ('katoosa-martyrs-site','lutembe-bay','ajai-wildlife-reserve') THEN '-01.svg' ELSE '-01.jpg' END,
  jsonb_build_array(jsonb_build_object('url','images/attractions/'||a.slug||'/'||a.slug||CASE WHEN a.slug IN ('katoosa-martyrs-site','lutembe-bay','ajai-wildlife-reserve') THEN '-01.svg' ELSE '-01.jpg' END)),
  'Wikimedia Commons contributors',
  'https://commons.wikimedia.org/wiki/Special:MediaSearch?search='||replace(a.name,' ','%20')
FROM attraction_data a
LEFT JOIN destinations d ON d.name=a.parent_name
ON CONFLICT (LOWER(name)) DO NOTHING;

-- These three low-documentation/status-aware records use clearly labelled
-- editorial artwork rather than an unrelated or falsely attributed photo.
UPDATE attractions SET
  image_url='images/attractions/katoosa-martyrs-site/katoosa-martyrs-site-01.svg',
  gallery_images='[{"url":"images/attractions/katoosa-martyrs-site/katoosa-martyrs-site-01.svg"}]'::jsonb
WHERE name='Katoosa Martyrs Site';
UPDATE attractions SET
  image_url='images/attractions/lutembe-bay/lutembe-bay-01.svg',
  gallery_images='[{"url":"images/attractions/lutembe-bay/lutembe-bay-01.svg"}]'::jsonb
WHERE name='Lutembe Bay';
UPDATE attractions SET
  image_url='images/attractions/ajai-wildlife-reserve/ajai-wildlife-reserve-01.svg',
  gallery_images='[{"url":"images/attractions/ajai-wildlife-reserve/ajai-wildlife-reserve-01.svg"}]'::jsonb
WHERE name='Ajai Wildlife Reserve';
