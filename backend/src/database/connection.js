import pg from "pg";

const { Pool } = pg;

// PHASE 6: PostgreSQL connection pool.
//
// `pg` is the small Node.js PostgreSQL driver we installed with:
//   npm install pg
//
// A Pool keeps reusable database connections available instead of opening a
// completely new connection for every API request.
//
// For this local-learning phase we provide the values you created in psql as
// defaults. Environment variables can override them later during deployment.
const database = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "ugotour_db",
  user: process.env.DB_USER || "ugotour_user",
  password: process.env.DB_PASSWORD || "UgoTour_dev_2026!"
});

// If a connection becomes unhealthy while sitting inside the pool, pg emits
// an error event. Logging it gives us a useful diagnostic instead of allowing
// the failure to go unnoticed.
database.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

export default database;
