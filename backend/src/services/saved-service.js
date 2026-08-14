// ============================================================
// SAVED PLACES SERVICE
// Implements Favorites for both destinations and attractions while presenting a
// single unified saved-place model to the frontend.
// ============================================================

import database from "../database/connection.js";

// Convert external place-type input into one of the two database-supported types.
function normalizeType(value) {
  return value === "attraction" ? "attraction" : value === "destination" ? "destination" : null;
}

// Join saved_places to either destinations or attractions and normalize both
// record types into the same object shape for saved.html.
export async function listSavedPlaces(userId) {
  const result = await database.query(`
    SELECT
      sp.id AS saved_id,
      sp.created_at AS saved_at,
      CASE WHEN sp.destination_id IS NOT NULL THEN 'destination' ELSE 'attraction' END AS place_type,
      COALESCE(d.id, a.id) AS place_id,
      COALESCE(d.name, a.name) AS name,
      COALESCE(d.category, a.category) AS category,
      COALESCE(d.region, a.region) AS region,
      COALESCE(d.district, a.district) AS district,
      COALESCE(d.description, a.description) AS description,
      COALESCE(d.highlight, a.highlight) AS highlight,
      COALESCE(d.image_url, a.image_url) AS image_url,
      a.destination_id AS parent_destination_id,
      pd.name AS parent_destination_name
    FROM saved_places sp
    LEFT JOIN destinations d ON d.id = sp.destination_id
    LEFT JOIN attractions a ON a.id = sp.attraction_id
    LEFT JOIN destinations pd ON pd.id = a.destination_id
    WHERE sp.user_id=$1
      AND COALESCE(d.is_active, a.is_active, TRUE)=TRUE
    ORDER BY sp.created_at DESC
  `, [Number(userId)]);

  return result.rows.map((row) => ({
    savedId: Number(row.saved_id),
    savedAt: row.saved_at,
    placeType: row.place_type,
    id: Number(row.place_id),
    name: row.name,
    category: row.category,
    region: row.region,
    district: row.district,
    description: row.description,
    highlight: row.highlight,
    imageUrl: row.image_url,
    destinationId: row.parent_destination_id === null ? null : Number(row.parent_destination_id),
    destinationName: row.parent_destination_name ?? null
  }));
}

// Validate the requested place, verify that it is active, then INSERT it. The
// partial unique indexes make saving an already-saved place safely idempotent.
export async function savePlace(userId, placeType, placeId) {
  const type = normalizeType(placeType);
  const id = Number(placeId);
  if (!type || !Number.isInteger(id) || id <= 0) {
    const error = new Error("A valid placeType and placeId are required.");
    error.statusCode = 400;
    throw error;
  }

  const table = type === "destination" ? "destinations" : "attractions";
  const exists = await database.query(`SELECT id FROM ${table} WHERE id=$1 AND is_active=TRUE`, [id]);
  if (!exists.rowCount) {
    const error = new Error("Place not found.");
    error.statusCode = 404;
    throw error;
  }

  if (type === "destination") {
    await database.query(`
      INSERT INTO saved_places (user_id,destination_id)
      VALUES ($1,$2)
      ON CONFLICT (user_id,destination_id) WHERE destination_id IS NOT NULL DO NOTHING
    `, [Number(userId), id]);
  } else {
    await database.query(`
      INSERT INTO saved_places (user_id,attraction_id)
      VALUES ($1,$2)
      ON CONFLICT (user_id,attraction_id) WHERE attraction_id IS NOT NULL DO NOTHING
    `, [Number(userId), id]);
  }
  return true;
}

// Delete the correct foreign-key column according to the saved place type.
export async function removeSavedPlace(userId, placeType, placeId) {
  const type = normalizeType(placeType);
  const id = Number(placeId);
  if (!type || !Number.isInteger(id) || id <= 0) return false;

  const column = type === "destination" ? "destination_id" : "attraction_id";
  const result = await database.query(
    `DELETE FROM saved_places WHERE user_id=$1 AND ${column}=$2 RETURNING id`,
    [Number(userId), id]
  );
  return result.rowCount > 0;
}

// Fast yes/no lookup used to draw the correct Favorites heart state.
export async function isPlaceSaved(userId, placeType, placeId) {
  const type = normalizeType(placeType);
  const id = Number(placeId);
  if (!type || !Number.isInteger(id) || id <= 0) return false;
  const column = type === "destination" ? "destination_id" : "attraction_id";
  const result = await database.query(
    `SELECT id FROM saved_places WHERE user_id=$1 AND ${column}=$2`,
    [Number(userId), id]
  );
  return result.rowCount > 0;
}
