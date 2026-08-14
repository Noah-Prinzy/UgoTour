// ============================================================
// FRONTEND ATTRACTION API SERVICE
// Provides simple attraction functions for page scripts while api.js handles the
// actual HTTP request mechanics.
// ============================================================

import { ApiError, apiRequest } from "../api.js";

// Fetch every active attraction from the backend.
export async function getAllAttractions() {
  const payload = await apiRequest("/attractions");
  return payload.data;
}

// Fetch only attractions linked to one destination.
export async function getAttractionsByDestinationId(destinationId) {
  const payload = await apiRequest(`/destinations/${Number(destinationId)}/attractions`);
  return payload.data;
}

// Fetch one attraction; convert a normal backend 404 into null for easier UI logic.
export async function getAttractionById(attractionId) {
  try {
    const payload = await apiRequest(`/attractions/${Number(attractionId)}`);
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
