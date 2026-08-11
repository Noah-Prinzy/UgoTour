// ============================================================
// Fresh production database bootstrap
// ============================================================
// Intended for a NEW Railway PostgreSQL database. It creates the current
// schema, inserts the original tourism seed, then applies the tourism-library
// and Phase 9 additive migrations. Every source SQL file is kept in the repo
// so the database structure remains easy to inspect for the assignment.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import database from "./connection.js";

const moduleDir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(moduleDir, "../../..");

const steps = [
  "database/schema.sql",
  "database/seeds/001_destinations.sql",
  "database/migrations/006_phase8_8_tourism_library.sql",
  "database/migrations/007_phase8_9_map_coordinate_correction.sql",
  "database/migrations/008_phase9_predeployment_features.sql"
];

async function run() {
  const existing = await database.query("SELECT to_regclass('public.destinations') AS destinations_table");
  const hasDestinationsTable = Boolean(existing.rows[0]?.destinations_table);

  if (hasDestinationsTable) {
    const countResult = await database.query("SELECT COUNT(*)::int AS count FROM destinations");
    if (Number(countResult.rows[0]?.count || 0) > 0) {
      console.log("Production bootstrap skipped: destinations already contain data.");
      console.log("Use numbered migrations for an existing database instead of re-seeding it.");
      return;
    }
  }

  for (const relativePath of steps) {
    const absolutePath = resolve(projectRoot, relativePath);
    console.log(`Applying ${relativePath}...`);
    const sql = readFileSync(absolutePath, "utf8");
    await database.query(sql);
  }

  const summary = await database.query(`
    SELECT
      (SELECT COUNT(*)::int FROM destinations) AS destinations,
      (SELECT COUNT(*)::int FROM attractions) AS attractions
  `);
  const row = summary.rows[0];
  console.log(`Production database ready: ${row.destinations} destinations + ${row.attractions} attractions.`);
}

run()
  .catch((error) => {
    console.error("Production database bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.end().catch(() => {});
  });
