-- UgoTour destination seed data through Phase 8.1.
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

-- Phase 8.1 local gallery metadata. Safe to re-run after schema.sql.
UPDATE destinations
SET
  image_url = 'images/destinations/murchison-falls/murchison-01.jpg',
  photo_credit = 'Ivan Sabayuki',
  photo_source_url = 'https://unsplash.com/photos/8WZRp0H75ao',
  gallery_images = '[{"url": "images/destinations/murchison-falls/murchison-01.jpg", "credit": "Ivan Sabayuki", "sourceUrl": "https://unsplash.com/photos/8WZRp0H75ao"}, {"url": "images/destinations/murchison-falls/murchison-02.jpg", "credit": "Jonathan Göhner", "sourceUrl": "https://unsplash.com/photos/dB9uhIxlHyE"}, {"url": "images/destinations/murchison-falls/murchison-03.jpg", "credit": "Omoniyi David", "sourceUrl": "https://unsplash.com/photos/XzpdMwnoUY0"}, {"url": "images/destinations/murchison-falls/murchison-04.jpg", "credit": "Nathalie Lays", "sourceUrl": "https://unsplash.com/photos/_3hT8Bw10Q0"}]'::jsonb
WHERE name = 'Murchison Falls';

UPDATE destinations
SET
  image_url = 'images/destinations/bwindi/bwindi-01.jpg',
  photo_credit = 'Nathalie Lays',
  photo_source_url = 'https://unsplash.com/photos/Lb65e5jMBMo',
  gallery_images = '[{"url": "images/destinations/bwindi/bwindi-01.jpg", "credit": "Nathalie Lays", "sourceUrl": "https://unsplash.com/photos/Lb65e5jMBMo"}, {"url": "images/destinations/bwindi/bwindi-02.jpg", "credit": "2H Media", "sourceUrl": "https://unsplash.com/photos/FKcRXTOHG8M"}, {"url": "images/destinations/bwindi/bwindi-03.jpg", "credit": "william pietermans", "sourceUrl": "https://unsplash.com/photos/5SujvqCTuJc"}, {"url": "images/destinations/bwindi/bwindi-04.jpg", "credit": "Gurth Bramall", "sourceUrl": "https://unsplash.com/photos/dtiZl9O14zc"}]'::jsonb
WHERE name = 'Bwindi Impenetrable National Park';

UPDATE destinations
SET
  image_url = 'images/destinations/jinja/jinja-01.jpg',
  photo_credit = 'Prince Beguin',
  photo_source_url = 'https://unsplash.com/photos/Vq2pbzX9YtQ',
  gallery_images = '[{"url": "images/destinations/jinja/jinja-01.jpg", "credit": "Prince Beguin", "sourceUrl": "https://unsplash.com/photos/Vq2pbzX9YtQ"}, {"url": "images/destinations/jinja/jinja-02.jpg", "credit": "Prince Beguin", "sourceUrl": "https://unsplash.com/photos/pCveYAHgc4k"}, {"url": "images/destinations/jinja/jinja-03.jpg", "credit": "Yoel Winkler", "sourceUrl": "https://unsplash.com/photos/JMHFwovV65Y"}, {"url": "images/destinations/jinja/jinja-04.jpg", "credit": "Kayla Farmer", "sourceUrl": "https://unsplash.com/photos/ZFam6iMtEps"}]'::jsonb
WHERE name = 'Jinja';

UPDATE destinations
SET
  image_url = 'images/destinations/queen-elizabeth/queen-elizabeth-01.jpg',
  photo_credit = 'Simone Dinoia',
  photo_source_url = 'https://unsplash.com/photos/ewBGsxuMv3Y',
  gallery_images = '[{"url": "images/destinations/queen-elizabeth/queen-elizabeth-01.jpg", "credit": "Simone Dinoia", "sourceUrl": "https://unsplash.com/photos/ewBGsxuMv3Y"}, {"url": "images/destinations/queen-elizabeth/queen-elizabeth-02.jpg", "credit": "Simone Dinoia", "sourceUrl": "https://unsplash.com/photos/eMayyM6F0xA"}, {"url": "images/destinations/queen-elizabeth/queen-elizabeth-03.jpg", "credit": "Random Institute", "sourceUrl": "https://unsplash.com/photos/QGlSeNMsLxk"}, {"url": "images/destinations/queen-elizabeth/queen-elizabeth-04.jpg", "credit": "Simone Dinoia", "sourceUrl": "https://unsplash.com/photos/xxxvYWmZIAw"}]'::jsonb
WHERE name = 'Queen Elizabeth National Park';

UPDATE destinations
SET
  image_url = 'images/destinations/kidepo/kidepo-01.jpg',
  photo_credit = 'CLINTON MWEBAZE',
  photo_source_url = 'https://unsplash.com/photos/XLivn95g--g',
  gallery_images = '[{"url": "images/destinations/kidepo/kidepo-01.jpg", "credit": "CLINTON MWEBAZE", "sourceUrl": "https://unsplash.com/photos/XLivn95g--g"}, {"url": "images/destinations/kidepo/kidepo-02.jpg", "credit": "CLINTON MWEBAZE", "sourceUrl": "https://unsplash.com/photos/1ejHmmazdjI"}, {"url": "images/destinations/kidepo/kidepo-03.jpg", "credit": "CLINTON MWEBAZE", "sourceUrl": "https://unsplash.com/photos/o6iaYyalgoY"}, {"url": "images/destinations/kidepo/kidepo-04.jpg", "credit": "Slim Emcee", "sourceUrl": "https://unsplash.com/photos/v8lToRM9l4E"}]'::jsonb
WHERE name = 'Kidepo Valley National Park';

UPDATE destinations
SET
  image_url = 'images/destinations/lake-bunyonyi/lake-bunyonyi-01.jpg',
  photo_credit = 'Wietse Jongsma',
  photo_source_url = 'https://unsplash.com/photos/xd0k2HB4voA',
  gallery_images = '[{"url": "images/destinations/lake-bunyonyi/lake-bunyonyi-01.jpg", "credit": "Wietse Jongsma", "sourceUrl": "https://unsplash.com/photos/xd0k2HB4voA"}, {"url": "images/destinations/lake-bunyonyi/lake-bunyonyi-02.jpg", "credit": "Random Institute", "sourceUrl": "https://unsplash.com/photos/KQ5djKAN35s"}, {"url": "images/destinations/lake-bunyonyi/lake-bunyonyi-03.jpg", "credit": "Random Institute", "sourceUrl": "https://unsplash.com/photos/n9buHOITydY"}]'::jsonb
WHERE name = 'Lake Bunyonyi';

UPDATE destinations
SET
  image_url = 'images/destinations/sipi-falls/sipi-falls-01.jpg',
  photo_credit = 'Tony Samuel Gachie',
  photo_source_url = 'https://unsplash.com/photos/BnjZe8tQUXQ',
  gallery_images = '[{"url": "images/destinations/sipi-falls/sipi-falls-01.jpg", "credit": "Tony Samuel Gachie", "sourceUrl": "https://unsplash.com/photos/BnjZe8tQUXQ"}, {"url": "images/destinations/sipi-falls/sipi-falls-02.jpg", "credit": "ludovico di giorgi", "sourceUrl": "https://unsplash.com/photos/-VpFLucS-5Q"}]'::jsonb
WHERE name = 'Sipi Falls';

UPDATE destinations
SET
  image_url = 'images/destinations/kampala/kampala-01.jpg',
  photo_credit = 'Robin Kutesa',
  photo_source_url = 'https://unsplash.com/photos/Q3ymlvOJGFs',
  gallery_images = '[{"url": "images/destinations/kampala/kampala-01.jpg", "credit": "Robin Kutesa", "sourceUrl": "https://unsplash.com/photos/Q3ymlvOJGFs"}, {"url": "images/destinations/kampala/kampala-02.jpg", "credit": "Keith Kasaija", "sourceUrl": "https://unsplash.com/photos/lii0uaz8Ieo"}, {"url": "images/destinations/kampala/kampala-03.jpg", "credit": "Alan David", "sourceUrl": "https://unsplash.com/photos/BMt7AVX5b-w"}, {"url": "images/destinations/kampala/kampala-04.jpg", "credit": "Jonathan Ward", "sourceUrl": "https://unsplash.com/photos/40I8Xjw91w0"}]'::jsonb
WHERE name = 'Kampala';

UPDATE destinations
SET
  image_url = 'images/destinations/rwenzori/rwenzori-01.jpg',
  photo_credit = 'Itote Rubombora',
  photo_source_url = 'https://unsplash.com/photos/8PF8fl6e6yE',
  gallery_images = '[{"url": "images/destinations/rwenzori/rwenzori-01.jpg", "credit": "Itote Rubombora", "sourceUrl": "https://unsplash.com/photos/8PF8fl6e6yE"}, {"url": "images/destinations/rwenzori/rwenzori-02.jpg", "credit": "Itote Rubombora", "sourceUrl": "https://unsplash.com/photos/q7MveQH8acU"}, {"url": "images/destinations/rwenzori/rwenzori-03.jpg", "credit": "Huzair Shafiq", "sourceUrl": "https://unsplash.com/photos/FgcroAvD8Bk"}]'::jsonb
WHERE name = 'Rwenzori Mountains';
