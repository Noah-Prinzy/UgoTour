import database from "../database/connection.js";

function mapGalleryImages(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item.url === "string")
    .map((item) => ({
      url: item.url,
      credit: item.credit ?? null,
      sourceUrl: item.sourceUrl ?? null
    }));
}

function mapDestination(row) {
  if (!row) return null;

  const galleryImages = mapGalleryImages(row.gallery_images);

  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    region: row.region,
    district: row.district,
    description: row.description,
    highlight: row.highlight,
    activities: row.activities ?? [],
    bestFor: row.best_for,
    suggestedDays: row.suggested_days === null ? null : Number(row.suggested_days),
    travelTip: row.travel_tip,
    imageUrl: row.image_url ?? galleryImages[0]?.url ?? null,
    photoCredit: row.photo_credit ?? galleryImages[0]?.credit ?? null,
    photoSourceUrl: row.photo_source_url ?? galleryImages[0]?.sourceUrl ?? null,
    galleryImages,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    createdAt: row.created_at
  };
}

const destinationColumns = `
  id,
  name,
  category,
  region,
  district,
  description,
  highlight,
  activities,
  best_for,
  suggested_days,
  travel_tip,
  image_url,
  photo_credit,
  photo_source_url,
  gallery_images,
  latitude,
  longitude,
  created_at
`;

export async function getAllDestinations() {
  const result = await database.query(`SELECT ${destinationColumns} FROM destinations ORDER BY id`);
  return result.rows.map(mapDestination);
}

export async function getDestinationById(destinationId) {
  const result = await database.query(
    `SELECT ${destinationColumns} FROM destinations WHERE id = $1`,
    [Number(destinationId)]
  );

  return mapDestination(result.rows[0]);
}
