-- ============================================================
-- PHASE 8: visual destination assets + profile pictures
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_credit VARCHAR(180),
  ADD COLUMN IF NOT EXISTS photo_source_url TEXT;

UPDATE destinations SET image_url='images/murchison-falls.jpg', photo_credit='Ivan Sabayuki', photo_source_url='https://unsplash.com/photos/a-river-with-a-waterfall-8WZRp0H75ao' WHERE name='Murchison Falls';
UPDATE destinations SET image_url='images/bwindi.jpg', photo_credit='Nathalie Lays', photo_source_url='https://unsplash.com/photos/a-gorilla-standing-in-the-middle-of-a-forest-Lb65e5jMBMo' WHERE name='Bwindi Impenetrable National Park';
UPDATE destinations SET image_url='images/jinja-pinterest.jpg', photo_credit='Pinterest / Viator', photo_source_url='https://www.pinterest.com/pin/explore-the-source-of-the-nile-ssezibwa-falls-and-mabira-forest--424886546113650179/' WHERE name='Jinja';
UPDATE destinations SET image_url='images/queen-elizabeth.jpg', photo_credit='Simone Dinoia', photo_source_url='https://unsplash.com/photos/an-elephant-walks-across-the-african-savanna-ewBGsxuMv3Y' WHERE name='Queen Elizabeth National Park';
UPDATE destinations SET image_url='images/kidepo.jpg', photo_credit='CLINTON MWEBAZE', photo_source_url='https://unsplash.com/photos/a-herd-of-zebra-standing-on-top-of-a-grass-covered-field-1ejHmmazdjI' WHERE name='Kidepo Valley National Park';
UPDATE destinations SET image_url='images/lake-bunyonyi.jpg', photo_credit='Wietse Jongsma', photo_source_url='https://unsplash.com/photos/a-scenic-view-of-a-lake-surrounded-by-mountains-xd0k2HB4voA' WHERE name='Lake Bunyonyi';
UPDATE destinations SET image_url='images/sipi-falls.jpg', photo_credit='Tony Samuel Gachie', photo_source_url='https://unsplash.com/photos/a-waterfall-in-the-middle-of-a-lush-green-forest-BnjZe8tQUXQ' WHERE name='Sipi Falls';
UPDATE destinations SET image_url='images/kampala.jpg', photo_credit='Robin Kutesa', photo_source_url='https://unsplash.com/photos/city-skyline-bathed-in-warm-sunset-light-Q3ymlvOJGFs' WHERE name='Kampala';
UPDATE destinations SET image_url='images/rwenzori.jpg', photo_credit='Itote Rubombora', photo_source_url='https://unsplash.com/photos/green-trees-on-mountain-during-daytime-8PF8fl6e6yE' WHERE name='Rwenzori Mountains';
