import database from "../database/connection.js";

function mapDestination(row) {
  if (!row) return null;
  return {
    id: Number(row.id), name: row.name, category: row.category, region: row.region,
    description: row.description, highlight: row.highlight, activities: row.activities ?? [],
    bestFor: row.best_for, suggestedDays: row.suggested_days === null ? null : Number(row.suggested_days),
    travelTip: row.travel_tip, imageUrl: row.image_url, photoCredit: row.photo_credit,
    photoSourceUrl: row.photo_source_url, createdAt: row.created_at
  };
}

const destinationColumns = `id, name, category, region, description, highlight, activities, best_for, suggested_days, travel_tip, image_url, photo_credit, photo_source_url, created_at`;

export async function getAllDestinations() {
  const result = await database.query(`SELECT ${destinationColumns} FROM destinations ORDER BY id`);
  return result.rows.map(mapDestination);
}

export async function getDestinationById(destinationId) {
  const result = await database.query(`SELECT ${destinationColumns} FROM destinations WHERE id = $1`, [Number(destinationId)]);
  return mapDestination(result.rows[0]);
}
