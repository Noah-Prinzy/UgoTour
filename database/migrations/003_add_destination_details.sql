-- ============================================================
-- PHASE 7 MIGRATION: richer destination details
-- ============================================================
-- The frontend details page previously kept these values in a local JS array.
-- Phase 7 moves them into PostgreSQL so every destination screen is API-backed.

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS activities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS best_for VARCHAR(255),
  ADD COLUMN IF NOT EXISTS suggested_days INTEGER CHECK (suggested_days > 0),
  ADD COLUMN IF NOT EXISTS travel_tip TEXT;

UPDATE destinations
SET
  activities = ARRAY['Waterfall viewpoints', 'Boat experiences', 'Wildlife viewing'],
  best_for = 'Nature lovers and first-time safari visitors',
  suggested_days = 2,
  travel_tip = 'Plan enough time for both the falls viewpoints and the Nile-side experiences.'
WHERE name = 'Murchison Falls';

UPDATE destinations
SET
  activities = ARRAY['Forest walks', 'Gorilla trekking', 'Community experiences'],
  best_for = 'Wildlife travellers and forest explorers',
  suggested_days = 3,
  travel_tip = 'Prepare for changing forest weather and allow time to travel through the highland region.'
WHERE name = 'Bwindi Impenetrable National Park';

UPDATE destinations
SET
  activities = ARRAY['Nile sightseeing', 'Kayaking and rafting', 'City exploration'],
  best_for = 'Adventure seekers and weekend travellers',
  suggested_days = 2,
  travel_tip = 'Keep one flexible day if you plan to combine several outdoor activities.'
WHERE name = 'Jinja';

UPDATE destinations
SET
  activities = ARRAY['Game drives', 'Kazinga Channel experiences', 'Crater landscape viewing'],
  best_for = 'Safari travellers and photographers',
  suggested_days = 3,
  travel_tip = 'Early morning and late afternoon are useful times for wildlife-focused activities.'
WHERE name = 'Queen Elizabeth National Park';

UPDATE destinations
SET
  activities = ARRAY['Game drives', 'Landscape photography', 'Cultural experiences'],
  best_for = 'Travellers who enjoy remote and less crowded places',
  suggested_days = 3,
  travel_tip = 'Because the park is remote, include travel time when planning your total trip length.'
WHERE name = 'Kidepo Valley National Park';

UPDATE destinations
SET
  activities = ARRAY['Lake viewpoints', 'Canoe experiences', 'Relaxation'],
  best_for = 'Slow travel, couples and peaceful getaways',
  suggested_days = 2,
  travel_tip = 'Carry a light layer for the cooler highland mornings and evenings.'
WHERE name = 'Lake Bunyonyi';

UPDATE destinations
SET
  activities = ARRAY['Waterfall hikes', 'Scenic viewpoints', 'Coffee experiences'],
  best_for = 'Hikers and active weekend travellers',
  suggested_days = 2,
  travel_tip = 'Wear footwear with good grip because some paths can become slippery after rain.'
WHERE name = 'Sipi Falls';

UPDATE destinations
SET
  activities = ARRAY['Landmark visits', 'Food experiences', 'Markets and arts'],
  best_for = 'Culture, food and city travellers',
  suggested_days = 2,
  travel_tip = 'Plan activities by area because city traffic can affect travel time between stops.'
WHERE name = 'Kampala';

UPDATE destinations
SET
  activities = ARRAY['Mountain trekking', 'Nature walks', 'Landscape photography'],
  best_for = 'Hikers and mountain adventure travellers',
  suggested_days = 4,
  travel_tip = 'Longer treks require more preparation, so match the route to your fitness and available time.'
WHERE name = 'Rwenzori Mountains';
