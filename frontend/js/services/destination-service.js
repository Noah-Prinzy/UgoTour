// ============================================================
// DESTINATION API SERVICE - PHASE 7
// ============================================================
// Destination data now comes from the real Node.js REST API, which reads
// PostgreSQL through pg. The frontend no longer owns a duplicate destination
// array.

import { ApiError, apiRequest } from "../api.js";

export async function getAllDestinations() {
  const payload = await apiRequest("/destinations");
  return payload.data;
}

// The Home page intentionally shows only three featured destinations, but the
// three items are still fetched from the database-backed API first.
export async function getStarterDestinations() {
  const destinations = await getAllDestinations();
  return destinations.slice(0, 3);
}

export async function getDestinationById(id) {
  try {
    const payload = await apiRequest(`/destinations/${Number(id)}`);
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

// Category buttons are still generated with vanilla JavaScript, but their
// values are derived from the database records returned by the API.
export function getDestinationCategories(destinations) {
  return [...new Set(destinations.map((destination) => destination.category))];
}
