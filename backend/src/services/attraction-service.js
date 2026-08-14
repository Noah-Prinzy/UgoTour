// ============================================================
// ATTRACTION SERVICE
// Reads active attractions from PostgreSQL and converts database rows into the
// camelCase objects consumed by controllers and frontend JavaScript.
// ============================================================

import database from "../database/connection.js";

// Normalize the JSONB gallery column into predictable image objects.
function mapGalleryImages(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item.url === "string").map((item) => ({
    url: item.url,
    credit: item.credit ?? null,
    sourceUrl: item.sourceUrl ?? null
  }));
}

// Translate a raw SQL row into the public attraction model used by the API.
function mapAttraction(row) {
  if (!row) return null;
  const galleryImages = mapGalleryImages(row.gallery_images);
  return {
    id: Number(row.id),
    destinationId: row.destination_id === null ? null : Number(row.destination_id),
    destinationName: row.destination_name ?? null,
    name: row.name,
    category: row.category,
    district: row.district,
    region: row.region,
    description: row.description,
    highlight: row.highlight,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    imageUrl: row.image_url ?? galleryImages[0]?.url ?? null,
    galleryImages,
    photoCredit: row.photo_credit ?? galleryImages[0]?.credit ?? null,
    photoSourceUrl: row.photo_source_url ?? galleryImages[0]?.sourceUrl ?? null,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null
  };
}

// Shared SELECT joins the parent destination name onto each attraction.
const attractionSelect = `
  SELECT a.*, d.name AS destination_name
  FROM attractions a
  LEFT JOIN destinations d ON d.id = a.destination_id
`;

// Return every active attraction alphabetically.
export async function getAllAttractions() {
  const result = await database.query(`${attractionSelect} WHERE a.is_active=TRUE ORDER BY a.name`);
  return result.rows.map(mapAttraction);
}

// Return one active attraction by primary-key id.
export async function getAttractionById(attractionId) {
  const result = await database.query(`${attractionSelect} WHERE a.id = $1 AND a.is_active=TRUE`, [Number(attractionId)]);
  return mapAttraction(result.rows[0]);
}

// Return active attractions linked to one destination.
export async function getAttractionsByDestinationId(destinationId) {
  const result = await database.query(
    `${attractionSelect} WHERE a.destination_id = $1 AND a.is_active=TRUE ORDER BY a.name`,
    [Number(destinationId)]
  );
  return result.rows.map(mapAttraction);
}
