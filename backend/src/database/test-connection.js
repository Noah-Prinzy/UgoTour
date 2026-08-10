import database from "./connection.js";

// This small script proves that Node.js -> pg -> PostgreSQL is working before
// we replace the Phase 5 in-memory services with database queries.
async function testDatabaseConnection() {
  try {
    // Query the nine destination records you seeded into PostgreSQL.
    const result = await database.query(`
      SELECT
        id,
        name,
        category,
        region
      FROM destinations
      ORDER BY id
    `);

    console.log("Connected to PostgreSQL successfully.");
    console.log(`Destinations found: ${result.rows.length}`);
    console.table(result.rows);
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    // This is a one-off test script, so close the pool when the test finishes.
    await database.end();
  }
}

testDatabaseConnection();
