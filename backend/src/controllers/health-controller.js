// ============================================================
// HEALTH CONTROLLER
// Used by developers and hosting platforms to confirm that both the Node.js API
// process and its PostgreSQL connection are alive.
// ============================================================

import database from "../database/connection.js";
import { sendJson } from "../utils/http.js";

// GET /health
// A tiny SELECT proves the database can answer before the endpoint reports OK.
export async function getHealth(_request, response) {
  await database.query("SELECT 1 AS database_ok");
  sendJson(response, 200, {
    status: "ok",
    message: "UgoTour API is running",
    phase: "9",
    database: "connected",
    environment: process.env.APP_ENV || "development",
    timestamp: new Date().toISOString()
  });
}
