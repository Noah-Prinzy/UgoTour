import database from "../database/connection.js";

function mapGalleryImages(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item.url === "string").map((item) => ({
    url: item.url,
    credit: item.credit ?? null,
    sourceUrl: item.sourceUrl ?? null
  }));
}

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
    createdAt: row.created_at
  };
}

const attractionSelect = `
  SELECT a.*, d.name AS destination_name
  FROM attractions a
  LEFT JOIN destinations d ON d.id = a.destination_id
`;

export async function getAllAttractions() {
  const result = await database.query(`${attractionSelect} ORDER BY a.name`);
  return result.rows.map(mapAttraction);
}

export async function getAttractionById(attractionId) {
  const result = await database.query(`${attractionSelect} WHERE a.id = $1`, [Number(attractionId)]);
  return mapAttraction(result.rows[0]);
}

export async function getAttractionsByDestinationId(destinationId) {
  const result = await database.query(
    `${attractionSelect} WHERE a.destination_id = $1 ORDER BY a.name`,
    [Number(destinationId)]
  );
  return result.rows.map(mapAttraction);
}
