// ============================================================
// FRONTEND SAVED PLACES / FAVORITES SERVICE
// Centralizes the API calls used by destination, attraction and Favorites pages
// to read or change a user's saved-place state.
// ============================================================

import { apiRequest } from "../api.js";

// Load the signed-in user's combined saved destinations + attractions.
export async function getSavedPlaces() {
  const payload = await apiRequest("/saved", { authenticated:true });
  return payload.data;
}

// Check one card's server-backed heart state.
export async function getSavedStatus(placeType, placeId) {
  const params = new URLSearchParams({ placeType, placeId:String(placeId) });
  const payload = await apiRequest(`/saved/status?${params}`, { authenticated:true });
  return Boolean(payload.data.saved);
}

// Add one destination/attraction to Favorites.
export async function savePlace(placeType, placeId) {
  await apiRequest("/saved", { method:"POST", authenticated:true, body:{ placeType, placeId:Number(placeId) } });
}

// Remove one destination/attraction from Favorites.
export async function removeSavedPlace(placeType, placeId) {
  await apiRequest(`/saved/${encodeURIComponent(placeType)}/${Number(placeId)}`, { method:"DELETE", authenticated:true });
}

// Convenience helper for heart buttons: perform the opposite operation and return
// the new boolean state so the UI can immediately redraw ♡/♥.
export async function toggleSavedPlace(placeType, placeId, currentlySaved) {
  if (currentlySaved) await removeSavedPlace(placeType, placeId);
  else await savePlace(placeType, placeId);
  return !currentlySaved;
}
