import { getAuthenticatedUser } from "../middleware/auth.js";
import { isPlaceSaved, listSavedPlaces, removeSavedPlace, savePlace } from "../services/saved-service.js";
import { readJsonBody, sendJson, sendNoContent } from "../utils/http.js";

async function userOr401(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) sendJson(response, 401, { error: "Authentication required." });
  return user;
}

export async function listSaved(request, response) {
  const user = await userOr401(request, response);
  if (!user) return;
  sendJson(response, 200, { data: await listSavedPlaces(user.id) });
}

export async function createSaved(request, response) {
  const user = await userOr401(request, response);
  if (!user) return;
  const body = await readJsonBody(request);
  await savePlace(user.id, body.placeType, body.placeId);
  sendJson(response, 201, { message: "Place saved." });
}

export async function deleteSaved(request, response, params) {
  const user = await userOr401(request, response);
  if (!user) return;
  await removeSavedPlace(user.id, params.placeType, params.id);
  sendNoContent(response);
}

export async function getSavedStatus(request, response, _params, url) {
  const user = await userOr401(request, response);
  if (!user) return;
  const placeType = url.searchParams.get("placeType");
  const placeId = url.searchParams.get("placeId");
  sendJson(response, 200, { data: { saved: await isPlaceSaved(user.id, placeType, placeId) } });
}
