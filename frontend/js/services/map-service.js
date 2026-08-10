import { apiRequest } from "../api.js";

// A dedicated map endpoint returns both destinations and attractions as GeoJSON.
// This keeps geographic data shaping on the backend and leaves the page code
// focused on filtering, rendering and interaction.
export async function getMapLocations() {
  const payload = await apiRequest("/map/locations");
  return payload.data;
}
