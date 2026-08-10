-- UgoTour destination seed data through Phase 7.
-- Each INSERT is guarded by name so this file can be re-run safely.

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Murchison Falls', 'Nature', 'Northern Uganda',
  'Uganda''s largest national park, known for the Nile forcing through a narrow gorge and creating the powerful Murchison Falls.',
  'Murchison Falls and Nile wildlife',
  ARRAY['Waterfall viewpoints', 'Boat experiences', 'Wildlife viewing'],
  'Nature lovers and first-time safari visitors', 2,
  'Plan enough time for both the falls viewpoints and the Nile-side experiences.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Murchison Falls');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Bwindi Impenetrable National Park', 'Wildlife', 'Western Uganda',
  'A dense rainforest famous for mountain gorilla trekking and exceptional biodiversity.',
  'Mountain gorilla trekking',
  ARRAY['Forest walks', 'Gorilla trekking', 'Community experiences'],
  'Wildlife travellers and forest explorers', 3,
  'Prepare for changing forest weather and allow time to travel through the highland region.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Bwindi Impenetrable National Park');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Jinja', 'Adventure', 'Eastern Uganda',
  'A vibrant tourism destination associated with the Source of the Nile and a wide range of outdoor activities.',
  'Source of the Nile adventures',
  ARRAY['Nile sightseeing', 'Kayaking and rafting', 'City exploration'],
  'Adventure seekers and weekend travellers', 2,
  'Keep one flexible day if you plan to combine several outdoor activities.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Jinja');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Queen Elizabeth National Park', 'Wildlife', 'Western Uganda',
  'A major Ugandan national park known for wildlife, crater lakes, savannah landscapes and the Kazinga Channel.',
  'Wildlife and Kazinga Channel',
  ARRAY['Game drives', 'Kazinga Channel experiences', 'Crater landscape viewing'],
  'Safari travellers and photographers', 3,
  'Early morning and late afternoon are useful times for wildlife-focused activities.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Queen Elizabeth National Park');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Kidepo Valley National Park', 'Wildlife', 'Northern Uganda',
  'A remote national park featuring dramatic savannah landscapes, mountains and diverse wildlife.',
  'Remote savannah wildlife',
  ARRAY['Game drives', 'Landscape photography', 'Cultural experiences'],
  'Travellers who enjoy remote and less crowded places', 3,
  'Because the park is remote, include travel time when planning your total trip length.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Kidepo Valley National Park');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Lake Bunyonyi', 'Nature', 'Southwestern Uganda',
  'A scenic lake surrounded by terraced hills and numerous small islands.',
  'Lake scenery and islands',
  ARRAY['Lake viewpoints', 'Canoe experiences', 'Relaxation'],
  'Slow travel, couples and peaceful getaways', 2,
  'Carry a light layer for the cooler highland mornings and evenings.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Lake Bunyonyi');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Sipi Falls', 'Nature', 'Eastern Uganda',
  'A group of waterfalls near Mount Elgon offering hiking, viewpoints and surrounding coffee-growing communities.',
  'Waterfalls and hiking',
  ARRAY['Waterfall hikes', 'Scenic viewpoints', 'Coffee experiences'],
  'Hikers and active weekend travellers', 2,
  'Wear footwear with good grip because some paths can become slippery after rain.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Sipi Falls');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Kampala', 'Culture', 'Central Uganda',
  'Uganda''s capital city, offering cultural landmarks, markets, restaurants, museums and urban experiences.',
  'Ugandan city and cultural experiences',
  ARRAY['Landmark visits', 'Food experiences', 'Markets and arts'],
  'Culture, food and city travellers', 2,
  'Plan activities by area because city traffic can affect travel time between stops.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Kampala');

INSERT INTO destinations
(name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip)
SELECT
  'Rwenzori Mountains', 'Adventure', 'Western Uganda',
  'A mountain range famous for high-altitude trekking, dramatic landscapes and the Mountains of the Moon.',
  'Mountain trekking',
  ARRAY['Mountain trekking', 'Nature walks', 'Landscape photography'],
  'Hikers and mountain adventure travellers', 4,
  'Longer treks require more preparation, so match the route to your fitness and available time.'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Rwenzori Mountains');
