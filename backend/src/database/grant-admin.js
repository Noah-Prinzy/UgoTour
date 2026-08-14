// ============================================================
// ADMIN ROLE GRANT SCRIPT
// One-off command-line helper used to promote an existing UgoTour account from
// the normal `user` role to `admin`.
// Example: npm run admin:grant -- person@example.com
// ============================================================

import database from "./connection.js";

// The email is supplied as the first command-line argument after the script name.
const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node src/database/grant-admin.js user@example.com");
  process.exitCode = 1;
} else {
  try {
    // Update only the matching account and return enough data to confirm the change.
    const result = await database.query("UPDATE users SET role='admin',updated_at=NOW() WHERE email=$1 RETURNING id,email,role", [email]);
    if (!result.rowCount) {
      console.error(`No UgoTour user exists with email ${email}.`);
      process.exitCode = 1;
    } else {
      console.log(`Admin access granted to ${result.rows[0].email}.`);
    }
  } finally {
    // This is a one-off script, so close the PostgreSQL pool before Node exits.
    await database.end();
  }
}
