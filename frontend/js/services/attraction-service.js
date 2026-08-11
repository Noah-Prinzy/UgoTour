import { ApiError, apiRequest } from "../api.js";

export async function getAllAttractions() {
  const payload = await apiRequest("/attractions");
  return payload.data;
}

export async function getAttractionsByDestinationId(destinationId) {
  const payload = await apiRequest(`/destinations/${Number(destinationId)}/attractions`);
  return payload.data;
}

export async function getAttractionById(attractionId) {
  try {
    const payload = await apiRequest(`/attractions/${Number(attractionId)}`);
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
