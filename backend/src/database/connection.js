import pg from "pg";

const { Pool } = pg;

const useSsl = String(process.env.DB_SSL || "").toLowerCase() === "true";
const common = {
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30_000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10_000),
  ssl: useSsl ? { rejectUnauthorized: false } : undefined
};

// Deployment platforms commonly expose one DATABASE_URL. Local development can
// keep using the explicit variables below.
const database = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ...common })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "ugotour_db",
      user: process.env.DB_USER || "ugotour_user",
      password: process.env.DB_PASSWORD || "UgoTour_dev_2026!",
      ...common
    });

database.on("error", (error) => {
  console.error(JSON.stringify({ level: "error", type: "postgres_pool", message: error.message, at: new Date().toISOString() }));
});

export default database;
