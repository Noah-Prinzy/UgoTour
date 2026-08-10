import database from "../database/connection.js";

// Converts PostgreSQL snake_case columns into camelCase objects for the
// JavaScript frontend. PostgreSQL TEXT[] values arrive as normal JS arrays.
function mapDestination(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    region: row.region,
    description: row.description,
    highlight: row.highlight,
    activities: row.activities ?? [],
    bestFor: row.best_for,
    suggestedDays: row.suggested_days === null ? null : Number(row.suggested_days),
    travelTip: row.travel_tip,
    createdAt: row.created_at
  };
}

const destinationColumns = `
  id,
  name,
  category,
  region,
  description,
  highlight,
  activities,
  best_for,
  suggested_days,
  travel_tip,
  created_at
`;

export async function getAllDestinations() {
  const result = await database.query(`
    SELECT ${destinationColumns}
    FROM destinations
    ORDER BY id
  `);

  return result.rows.map(mapDestination);
}

export async function getDestinationById(destinationId) {
  const result = await database.query(
    `
      SELECT ${destinationColumns}
      FROM destinations
      WHERE id = $1
    `,
    [Number(destinationId)]
  );

  return mapDestination(result.rows[0]);
}
