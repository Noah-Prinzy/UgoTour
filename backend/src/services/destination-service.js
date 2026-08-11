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
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null
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
  is_active,
  created_at,
  updated_at
`;

export async function getAllDestinations() {
  const result = await database.query(`SELECT ${destinationColumns} FROM destinations WHERE is_active=TRUE ORDER BY id`);
  return result.rows.map(mapDestination);
}

export async function getDestinationById(destinationId) {
  const result = await database.query(
    `SELECT ${destinationColumns} FROM destinations WHERE id = $1 AND is_active=TRUE`,
    [Number(destinationId)]
  );

  return mapDestination(result.rows[0]);
}
