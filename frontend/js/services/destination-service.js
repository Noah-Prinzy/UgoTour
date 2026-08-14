// ============================================================
// DESTINATION API SERVICE - PHASE 8
// ============================================================
// Destination data comes from the Node.js REST API, which reads PostgreSQL.
// Page scripts use these helpers instead of owning a duplicate destination array
// or constructing fetch requests directly.

import { ApiError, apiRequest } from "../api.js";

// Fetch the complete active destination collection.
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

// Fetch one destination. A normal 404 becomes null so detail pages can render a
// friendly missing-destination state instead of handling an exception.
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

// Category buttons are generated with vanilla JavaScript, but their values are
// derived from the real database records returned by the API.
export function getDestinationCategories(destinations) {
  return [...new Set(destinations.map((destination) => destination.category))];
}
