import { apiRequest } from "../api.js";

export async function getSavedPlaces() {
  const payload = await apiRequest("/saved", { authenticated:true });
  return payload.data;
}

export async function getSavedStatus(placeType, placeId) {
  const params = new URLSearchParams({ placeType, placeId:String(placeId) });
  const payload = await apiRequest(`/saved/status?${params}`, { authenticated:true });
  return Boolean(payload.data.saved);
}

export async function savePlace(placeType, placeId) {
  await apiRequest("/saved", { method:"POST", authenticated:true, body:{ placeType, placeId:Number(placeId) } });
}

export async function removeSavedPlace(placeType, placeId) {
  await apiRequest(`/saved/${encodeURIComponent(placeType)}/${Number(placeId)}`, { method:"DELETE", authenticated:true });
}

export async function toggleSavedPlace(placeType, placeId, currentlySaved) {
  if (currentlySaved) await removeSavedPlace(placeType, placeId);
  else await savePlace(placeType, placeId);
  return !currentlySaved;
}
