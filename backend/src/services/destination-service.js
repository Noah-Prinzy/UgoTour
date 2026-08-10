import database from "../database/connection.js";

// Converts PostgreSQL's snake_case row shape into the camelCase objects used
// by the rest of the JavaScript application.
function mapDestination(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    region: row.region,
    description: row.description,
    highlight: row.highlight,
    createdAt: row.created_at
  };
}

// PHASE 6 COMPLETE:
// Destinations now come from PostgreSQL instead of ../data/destinations.js.
export async function getAllDestinations() {
  const result = await database.query(`
    SELECT
      id,
      name,
      category,
      region,
      description,
      highlight,
      created_at
    FROM destinations
    ORDER BY id
  `);

  return result.rows.map(mapDestination);
}

export async function getDestinationById(destinationId) {
  const result = await database.query(
    `
      SELECT
        id,
        name,
        category,
        region,
        description,
        highlight,
        created_at
      FROM destinations
      WHERE id = $1
    `,
    [Number(destinationId)]
  );

  return mapDestination(result.rows[0]);
}
