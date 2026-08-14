// ============================================================
// FRONTEND MAP API SERVICE
// Translates map-page actions into backend endpoints for curated GeoJSON, smart
// search, nearby discovery and directions.
// ============================================================

import { apiRequest } from "../api.js";

// The base GeoJSON endpoint is the fast source of UgoTour-verified places.
export async function getMapLocations() {
  const payload = await apiRequest("/map/locations");
  return payload.data;
}

// Ask the backend which map/routing providers and fallbacks are currently available.
export async function getMapCapabilities() {
  const payload = await apiRequest("/map/capabilities");
  return payload.data;
}

// Search UgoTour + live map discovery by a human-readable place/query string.
export async function searchMapPlaces(query) {
  const payload = await apiRequest(`/map/search?q=${encodeURIComponent(query)}`);
  return payload.data;
}

// Serialize a nearby-search request into query parameters understood by the backend.
export async function getNearbyMapPlaces({ lat, lng, category = "attractions", radiusKm = 8, context = "" }) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    category,
    radiusKm: String(radiusKm),
    context: String(context || "")
  });
  const payload = await apiRequest(`/map/nearby?${params.toString()}`);
  return payload.data;
}

// Request road directions. GET is the current route API; the nested POST request
// preserves compatibility with a previously-running Phase 1.11 backend.
export async function getMapRoute({ from, to, mode = "driving" }) {
  const params = new URLSearchParams({
    fromLat: String(from.lat),
    fromLng: String(from.lng),
    toLat: String(to.lat),
    toLng: String(to.lng),
    mode
  });

  try {
    const payload = await apiRequest(`/map/route?${params.toString()}`);
    return payload.data;
  } catch (error) {
    // Phase 1.11 exposed POST only. Falling back keeps the frontend compatible
    // while a developer restarts the backend onto the Phase 1.12 router.
    if (![404, 405].includes(Number(error?.status))) throw error;
    try {
      const payload = await apiRequest("/map/route", {
        method: "POST",
        body: { from, to, mode }
      });
      return payload.data;
    } catch (postError) {
      if (Number(postError?.status) === 404) {
        postError.message = "The running Node backend does not have the new map routes yet. Restart npm run start:backend, then try Directions again.";
      }
      throw postError;
    }
  }
}
