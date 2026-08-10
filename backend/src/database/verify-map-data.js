import database from "./connection.js";

// Lightweight Phase 8.9 coordinate sanity check.
// This does not replace source-by-source geographic research; it catches missing
// or clearly out-of-Uganda coordinates before they are rendered as map pins.
const UGANDA_ENVELOPE = {
  minLatitude: -1.6,
  maxLatitude: 4.4,
  minLongitude: 29.4,
  maxLongitude: 35.1
};

async function verifyMapData() {
  try {
    const result = await database.query(`
      SELECT 'destination'::text AS place_type, id, name, latitude, longitude
      FROM destinations
      UNION ALL
      SELECT 'attraction'::text AS place_type, id, name, latitude, longitude
      FROM attractions
      ORDER BY place_type, name
    `);

    const rows = result.rows;
    const missing = rows.filter((row) => row.latitude === null || row.longitude === null);
    const outside = rows.filter((row) => {
      if (row.latitude === null || row.longitude === null) return false;
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);
      return latitude < UGANDA_ENVELOPE.minLatitude ||
        latitude > UGANDA_ENVELOPE.maxLatitude ||
        longitude < UGANDA_ENVELOPE.minLongitude ||
        longitude > UGANDA_ENVELOPE.maxLongitude;
    });

    const destinations = rows.filter((row) => row.place_type === "destination").length;
    const attractions = rows.filter((row) => row.place_type === "attraction").length;

    console.log("UgoTour map-data verification");
    console.log(`Destinations: ${destinations}`);
    console.log(`Attractions:  ${attractions}`);
    console.log(`Total pins:   ${rows.length}`);
    console.log(`Missing coordinates: ${missing.length}`);
    console.log(`Outside Uganda sanity envelope: ${outside.length}`);

    if (missing.length) console.table(missing);
    if (outside.length) console.table(outside);

    if (missing.length || outside.length) {
      process.exitCode = 1;
      return;
    }

    console.log("Map coordinate sanity check passed.");
  } finally {
    await database.end();
  }
}

verifyMapData().catch((error) => {
  console.error("Map-data verification failed:", error);
  process.exitCode = 1;
});
