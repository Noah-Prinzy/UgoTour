import {
  getMapCapabilities as loadMapCapabilities,
  getNearbyMapPlaces,
  getRouteGeoJson,
  searchMapDiscovery
} from "../services/map-discovery-service.js";
import { getMapLocations } from "../services/map-service.js";
import { readJsonBody, sendJson } from "../utils/http.js";

export async function listMapLocations(_request, response) {
  sendJson(response, 200, { data: await getMapLocations() });
}

export async function getMapCapabilities(_request, response) {
  sendJson(response, 200, { data: loadMapCapabilities() });
}

export async function searchMapPlaces(_request, response, _params, url) {
  const query = String(url.searchParams.get("q") || "").trim();
  if (query.length < 2) {
    const error = new Error("Search at least 2 characters.");
    error.statusCode = 400;
    throw error;
  }
  if (query.length > 80) {
    const error = new Error("Map search is too long.");
    error.statusCode = 400;
    throw error;
  }
  sendJson(response, 200, { data: await searchMapDiscovery(query) });
}

export async function nearbyMapPlaces(_request, response, _params, url) {
  const latitude = numberParam(url, "lat", -90, 90);
  const longitude = numberParam(url, "lng", -180, 180);
  const radiusKm = optionalNumberParam(url, "radiusKm", 8, 1, 25);
  const category = String(url.searchParams.get("category") || "attractions").toLowerCase();
  const contextName = String(url.searchParams.get("context") || "").trim().slice(0, 80) || null;

  const allowed = new Set(["all", "attractions", "hotels", "restaurants", "fuel", "hospitals"]);
  if (!allowed.has(category)) {
    const error = new Error("Unsupported nearby category.");
    error.statusCode = 400;
    throw error;
  }

  sendJson(response, 200, {
    data: await getNearbyMapPlaces({ latitude, longitude, radiusKm, category, contextName })
  });
}

export async function routeMap(request, response, _params, url) {
  // Route calculation is a read-only operation. Phase 1.12 accepts GET so the
  // browser can request directions without triggering write-origin safeguards,
  // while POST remains supported for compatibility with Phase 1.11 clients.
  let from;
  let to;
  let mode;

  if (request.method === "GET") {
    from = {
      lat: numberParam(url, "fromLat", -90, 90),
      lng: numberParam(url, "fromLng", -180, 180)
    };
    to = {
      lat: numberParam(url, "toLat", -90, 90),
      lng: numberParam(url, "toLng", -180, 180)
    };
    mode = String(url.searchParams.get("mode") || "driving").toLowerCase();
  } else {
    const body = await readJsonBody(request);
    from = readCoordinate(body.from, "from");
    to = readCoordinate(body.to, "to");
    mode = String(body.mode || "driving").toLowerCase();
  }

  const allowedModes = new Set(["driving", "walking", "cycling"]);
  if (!allowedModes.has(mode)) {
    const error = new Error("Route mode must be driving, walking or cycling.");
    error.statusCode = 400;
    throw error;
  }

  sendJson(response, 200, {
    data: await getRouteGeoJson({ from, to, mode })
  });
}

function numberParam(url, key, min, max) {
  const raw = url.searchParams.get(key);
  const value = raw === null || raw === "" ? Number.NaN : Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    const error = new Error(`Invalid ${key}.`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function optionalNumberParam(url, key, fallback, min, max) {
  const raw = url.searchParams.get(key);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    const error = new Error(`Invalid ${key}.`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function readCoordinate(value, label) {
  const latitude = Number(value?.lat);
  const longitude = Number(value?.lng);
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) {
    const error = new Error(`Invalid ${label} coordinate.`);
    error.statusCode = 400;
    throw error;
  }
  return { lat: latitude, lng: longitude };
}
