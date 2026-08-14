// ============================================================
// DESTINATION CONTROLLER
// Converts public destination API requests into service calls and JSON replies.
// The actual SQL lives in backend/src/services/destination-service.js.
// ============================================================

import {
  getAllDestinations,
  getDestinationById
} from "../services/destination-service.js";
import { sendJson } from "../utils/http.js";

// GET /api/destinations
// Controllers are asynchronous because their services query PostgreSQL.
export async function listDestinations(_request, response) {
  sendJson(response, 200, {
    data: await getAllDestinations()
  });
}

// GET /api/destinations/:id
// Return one active destination or a clear 404 when the id is unavailable.
export async function getDestination(_request, response, params) {
  const destination = await getDestinationById(params.id);

  if (!destination) {
    sendJson(response, 404, { error: "Destination not found." });
    return;
  }

  sendJson(response, 200, { data: destination });
}
