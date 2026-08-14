// ============================================================
// SAVED PLACES CONTROLLER
// Powers Favorites for destinations and attractions. Every endpoint first
// resolves the authenticated user, then delegates storage to saved-service.js.
// ============================================================

import { getAuthenticatedUser } from "../middleware/auth.js";
import { isPlaceSaved, listSavedPlaces, removeSavedPlace, savePlace } from "../services/saved-service.js";
import { readJsonBody, sendJson, sendNoContent } from "../utils/http.js";

// Reusable guard shared by all Favorites handlers in this file.
async function userOr401(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) sendJson(response, 401, { error: "Authentication required." });
  return user;
}

// GET /api/saved — list the current user's saved destinations and attractions.
export async function listSaved(request, response) {
  const user = await userOr401(request, response);
  if (!user) return;
  sendJson(response, 200, { data: await listSavedPlaces(user.id) });
}

// POST /api/saved — save one destination or attraction.
export async function createSaved(request, response) {
  const user = await userOr401(request, response);
  if (!user) return;
  const body = await readJsonBody(request);
  await savePlace(user.id, body.placeType, body.placeId);
  sendJson(response, 201, { message: "Place saved." });
}

// DELETE /api/saved/:placeType/:id — remove one Favorite belonging to the user.
export async function deleteSaved(request, response, params) {
  const user = await userOr401(request, response);
  if (!user) return;
  await removeSavedPlace(user.id, params.placeType, params.id);
  sendNoContent(response);
}

// GET /api/saved/status?... — lets a card decide whether to draw ♡ or ♥.
export async function getSavedStatus(request, response, _params, url) {
  const user = await userOr401(request, response);
  if (!user) return;
  const placeType = url.searchParams.get("placeType");
  const placeId = url.searchParams.get("placeId");
  sendJson(response, 200, { data: { saved: await isPlaceSaved(user.id, placeType, placeId) } });
}
