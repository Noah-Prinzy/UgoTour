import database from "./connection.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node src/database/grant-admin.js user@example.com");
  process.exitCode = 1;
} else {
  try {
    const result = await database.query("UPDATE users SET role='admin',updated_at=NOW() WHERE email=$1 RETURNING id,email,role", [email]);
    if (!result.rowCount) {
      console.error(`No UgoTour user exists with email ${email}.`);
      process.exitCode = 1;
    } else {
      console.log(`Admin access granted to ${result.rows[0].email}.`);
    }
  } finally {
    await database.end();
  }
}
