// ============================================================
// ATTRACTION CONTROLLER
// Serves public attraction data and destination-specific attraction lists.
// ============================================================

import {
  getAllAttractions,
  getAttractionById,
  getAttractionsByDestinationId
} from "../services/attraction-service.js";
import { getDestinationById } from "../services/destination-service.js";
import { sendJson } from "../utils/http.js";

// GET /api/attractions — return every active attraction from PostgreSQL.
export async function listAttractions(_request, response) {
  sendJson(response, 200, { data: await getAllAttractions() });
}

// GET /api/attractions/:id — return one attraction or a 404.
export async function getAttraction(_request, response, params) {
  const attraction = await getAttractionById(params.id);
  if (!attraction) return sendJson(response, 404, { error: "Attraction not found." });
  sendJson(response, 200, { data: attraction });
}

// GET /api/destinations/:id/attractions
// Verify the parent destination first, then load the attractions related to it.
export async function listDestinationAttractions(_request, response, params) {
  if (!await getDestinationById(params.id)) {
    return sendJson(response, 404, { error: "Destination not found." });
  }
  sendJson(response, 200, { data: await getAttractionsByDestinationId(params.id) });
}
