import database from "../database/connection.js";

// Phase 8.9 map service
// ---------------------
// The frontend map should not have to understand two different database tables.
// This service combines major destinations and nested/independent attractions
// into one GeoJSON FeatureCollection, which Leaflet can consume directly.

function toFeature(row) {
  return {
    type: "Feature",
    id: `${row.place_type}:${Number(row.id)}`,
    geometry: {
      type: "Point",
      // GeoJSON coordinates always use [longitude, latitude].
      coordinates: [Number(row.longitude), Number(row.latitude)]
    },
    properties: {
      id: Number(row.id),
      placeType: row.place_type,
      destinationId: row.destination_id === null ? null : Number(row.destination_id),
      destinationName: row.destination_name ?? null,
      name: row.name,
      category: row.category,
      district: row.district,
      region: row.region,
      description: row.description,
      highlight: row.highlight,
      imageUrl: row.image_url ?? null
    }
  };
}

export async function getMapLocations() {
  const result = await database.query(`
    SELECT
      'destination'::text AS place_type,
      d.id,
      d.id AS destination_id,
      d.name AS destination_name,
      d.name,
      d.category,
      d.district,
      d.region,
      d.description,
      d.highlight,
      d.latitude,
      d.longitude,
      d.image_url
    FROM destinations AS d
    WHERE d.is_active=TRUE
      AND d.latitude IS NOT NULL
      AND d.longitude IS NOT NULL

    UNION ALL

    SELECT
      'attraction'::text AS place_type,
      a.id,
      a.destination_id,
      d.name AS destination_name,
      a.name,
      a.category,
      a.district,
      a.region,
      a.description,
      a.highlight,
      a.latitude,
      a.longitude,
      a.image_url
    FROM attractions AS a
    LEFT JOIN destinations AS d
      ON d.id = a.destination_id
    WHERE a.is_active=TRUE
      AND a.latitude IS NOT NULL
      AND a.longitude IS NOT NULL

    ORDER BY place_type DESC, name ASC
  `);

  const features = result.rows.map(toFeature);
  const destinationCount = features.filter((feature) => feature.properties.placeType === "destination").length;
  const attractionCount = features.length - destinationCount;

  return {
    type: "FeatureCollection",
    features,
    meta: {
      total: features.length,
      destinations: destinationCount,
      attractions: attractionCount
    }
  };
}
