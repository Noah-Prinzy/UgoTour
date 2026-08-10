import database from "../database/connection.js";
import { sendJson } from "../utils/http.js";

// The health endpoint now checks PostgreSQL too. If this SELECT fails, the
// router's central error handler returns an HTTP 500 response.
export async function getHealth(_request, response) {
  await database.query("SELECT 1 AS database_ok");

  sendJson(response, 200, {
    status: "ok",
    message: "UgoTour API is running",
    phase: "8.5",
    database: "connected"
  });
}
