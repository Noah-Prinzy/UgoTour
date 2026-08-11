import { getMapLocations } from "./map-service.js";

const NOMINATIM_BASE_URL = String(process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org").replace(/\/+$/, "");
const OVERPASS_API_URL = String(process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter");
const ORS_BASE_URL = String(process.env.ORS_BASE_URL || "https://api.openrouteservice.org").replace(/\/+$/, "");
const OSRM_BASE_URL = String(process.env.OSRM_BASE_URL || "https://router.project-osrm.org").replace(/\/+$/, "");
const CACHE_TTL_MS = Math.max(60_000, Number(process.env.MAP_DISCOVERY_CACHE_TTL_MS || 900_000));
const APP_IDENTITY = `UgoTour/1.12 (${process.env.PUBLIC_APP_URL || "https://ugotour-production.up.railway.app"})`;

const cache = new Map();
let nominatimChain = Promise.resolve();
let lastNominatimRequestAt = 0;

const nearbyFilters = {
  all: [
    ["tourism", "^(attraction|museum|viewpoint|gallery|zoo|hotel|guest_house|hostel|motel|camp_site)$"],
    ["historic", ".+"],
    ["leisure", "^park$"],
    ["amenity", "^(restaurant|cafe|fast_food|fuel|hospital|clinic|pharmacy|place_of_worship)$"]
  ],
  attractions: [
    ["tourism", "^(attraction|museum|viewpoint|gallery|zoo)$"],
    ["historic", ".+"],
    ["leisure", "^park$"],
    ["amenity", "^place_of_worship$"]
  ],
  hotels: [["tourism", "^(hotel|guest_house|hostel|motel|camp_site|chalet)$"]],
  restaurants: [["amenity", "^(restaurant|cafe|fast_food)$"]],
  fuel: [["amenity", "^fuel$"]],
  hospitals: [["amenity", "^(hospital|clinic|pharmacy)$"]]
};

export function getMapCapabilities() {
  return {
    smartSearch: true,
    nearbyDiscovery: true,
    currentLocation: true,
    routing: true,
    routingProvider: process.env.OPENROUTESERVICE_API_KEY ? "openrouteservice" : "osrm-fallback",
    routingFallback: !process.env.OPENROUTESERVICE_API_KEY
  };
}

export async function searchMapDiscovery(query) {
  const normalized = normalize(query);
  const curated = await curatedFeatures();
  const lexical = curated.filter((feature) => searchable(feature).includes(normalized));
  let geocode = null;
  let external = [];
  const warnings = [];

  try {
    geocode = await geocodeUganda(query);
  } catch (error) {
    warnings.push("Area lookup is temporarily unavailable.");
    console.warn("Map geocoding failed:", error.message);
  }

  let areaCurated = [];
  if (geocode) {
    const radiusKm = radiusForGeocode(geocode);
    areaCurated = curated.filter((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return pointInsideBoundingBox(lat, lng, geocode.boundingBox) ||
        haversineKm(geocode.lat, geocode.lng, lat, lng) <= radiusKm;
    });

    try {
      external = await overpassPlaces({
        latitude: geocode.lat,
        longitude: geocode.lng,
        radiusKm: Math.min(radiusKm, 20),
        category: "attractions",
        contextName: geocode.name
      });
    } catch (error) {
      warnings.push("Live OpenStreetMap sites could not be loaded right now.");
      console.warn("Map Overpass search failed:", error.message);
    }
  }

  const merged = mergeFeatures([...lexical, ...areaCurated], external);
  return {
    query,
    area: geocode ? {
      name: geocode.name,
      latitude: geocode.lat,
      longitude: geocode.lng,
      boundingBox: geocode.boundingBox,
      type: geocode.type
    } : null,
    collection: featureCollection(merged),
    warnings
  };
}

export async function getNearbyMapPlaces({ latitude, longitude, radiusKm = 8, category = "attractions", contextName = null }) {
  const curated = await curatedFeatures();
  const curatedNearby = curated
    .filter((feature) => matchesCuratedNearbyCategory(feature, category))
    .filter((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return haversineKm(latitude, longitude, lat, lng) <= radiusKm;
    })
    .map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        distanceKm: round(haversineKm(
          latitude,
          longitude,
          feature.geometry.coordinates[1],
          feature.geometry.coordinates[0]
        ), 1)
      }
    }));

  let external = [];
  const warnings = [];
  try {
    external = await overpassPlaces({
      latitude,
      longitude,
      radiusKm,
      category,
      contextName: contextName || "this area"
    });
  } catch (error) {
    warnings.push("Live nearby places could not be loaded right now.");
    console.warn("Nearby Overpass query failed:", error.message);
  }

  const merged = mergeFeatures(curatedNearby, external)
    .map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          distanceKm: feature.properties.distanceKm ??
            round(haversineKm(latitude, longitude, lat, lng), 1)
        }
      };
    })
    .sort((a, b) => (a.properties.distanceKm ?? Infinity) - (b.properties.distanceKm ?? Infinity));

  return {
    origin: { latitude, longitude },
    radiusKm,
    category,
    collection: featureCollection(merged),
    warnings
  };
}

export async function getRouteGeoJson({ from, to, mode }) {
  const apiKey = String(process.env.OPENROUTESERVICE_API_KEY || "").trim();

  // Prefer openrouteservice because it provides mode-specific road routing.
  // If no key is configured (or the provider is temporarily unavailable), the
  // prototype remains usable through an OSRM road-geometry fallback. A final
  // direct-distance fallback prevents the UI from failing with a dead button.
  if (apiKey) {
    try {
      return await getOpenRouteServiceRoute({ from, to, mode, apiKey });
    } catch (error) {
      console.warn("openrouteservice route failed; using fallback:", error.message);
    }
  }

  try {
    return await getOsrmFallbackRoute({ from, to, mode });
  } catch (error) {
    console.warn("OSRM fallback route failed; using direct estimate:", error.message);
    return getDirectRouteEstimate({ from, to, mode });
  }
}

async function getOpenRouteServiceRoute({ from, to, mode, apiKey }) {
  const profile = {
    driving: "driving-car",
    walking: "foot-walking",
    cycling: "cycling-regular"
  }[mode];

  const response = await fetchJson(`${ORS_BASE_URL}/v2/directions/${profile}/geojson`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
      Accept: "application/geo+json, application/json",
      "User-Agent": APP_IDENTITY
    },
    body: JSON.stringify({
      coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
      instructions: false
    })
  }, 18_000);

  const feature = response?.features?.[0];
  if (!feature?.geometry) throw providerError("The routing provider did not return a usable road route.");
  const summary = feature.properties?.summary || {};
  return {
    provider: "openrouteservice",
    providerLabel: "openrouteservice",
    mode,
    approximate: false,
    distanceMeters: Number(summary.distance || 0),
    durationSeconds: Number(summary.duration || 0),
    geojson: response
  };
}

async function getOsrmFallbackRoute({ from, to, mode }) {
  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = new URL(`${OSRM_BASE_URL}/route/v1/driving/${coordinates}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const response = await fetchJson(url, {
    headers: { "User-Agent": APP_IDENTITY, Accept: "application/json" }
  }, 14_000);
  const route = response?.routes?.[0];
  if (response?.code !== "Ok" || !route?.geometry?.coordinates?.length) {
    throw providerError(response?.message || "No fallback road route was found.");
  }

  const distanceMeters = Number(route.distance || 0);
  const durationSeconds = mode === "driving"
    ? Number(route.duration || estimateDuration(distanceMeters, mode))
    : estimateDuration(distanceMeters, mode);

  return {
    provider: "osrm-demo",
    providerLabel: "OpenStreetMap road fallback",
    mode,
    approximate: mode !== "driving",
    warning: mode === "driving"
      ? "Fallback road routing is active. Configure OPENROUTESERVICE_API_KEY for production routing."
      : `${mode[0].toUpperCase()}${mode.slice(1)} time is estimated from the fallback road geometry.`,
    distanceMeters,
    durationSeconds,
    geojson: {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: route.geometry.coordinates }
      }]
    }
  };
}

function getDirectRouteEstimate({ from, to, mode }) {
  const distanceMeters = haversineKm(from.lat, from.lng, to.lat, to.lng) * 1000;
  return {
    provider: "direct-estimate",
    providerLabel: "Direct distance estimate",
    mode,
    approximate: true,
    warning: "Road routing is temporarily unavailable, so this line shows direct distance rather than turn-by-turn roads.",
    distanceMeters,
    durationSeconds: estimateDuration(distanceMeters, mode),
    geojson: {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [[from.lng, from.lat], [to.lng, to.lat]]
        }
      }]
    }
  };
}

function estimateDuration(distanceMeters, mode) {
  const speedKph = { driving: 48, walking: 4.8, cycling: 15 }[mode] || 48;
  return Math.max(60, (Number(distanceMeters || 0) / 1000) / speedKph * 3600);
}

function providerError(message) {
  const error = new Error(message);
  error.statusCode = 502;
  return error;
}

function matchesCuratedNearbyCategory(feature, category) {
  if (["all", "attractions"].includes(category)) return true;
  const text = normalize([
    feature?.properties?.category,
    feature?.properties?.name,
    feature?.properties?.description
  ].filter(Boolean).join(" "));
  const terms = {
    hotels: ["hotel", "lodge", "guest house", "hostel", "camp", "accommodation"],
    restaurants: ["restaurant", "cafe", "food", "dining"],
    fuel: ["fuel", "petrol", "gas station"],
    hospitals: ["hospital", "clinic", "pharmacy", "health"]
  }[category] || [];
  return terms.some((term) => text.includes(term));
}

async function curatedFeatures() {
  const collection = await getMapLocations();
  return (collection.features || []).map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      source: "ugotour",
      sourceLabel: "UgoTour Verified",
      verified: true
    }
  }));
}

async function geocodeUganda(query) {
  const key = `geocode:${normalize(query)}`;
  const hit = getCached(key);
  if (hit) return hit;

  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set("q", `${query}, Uganda`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ug");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");

  const rows = await runNominatim(() => fetchJson(url, {
    headers: {
      "User-Agent": APP_IDENTITY,
      Accept: "application/json",
      "Accept-Language": "en"
    }
  }, 12_000));

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  const bounding = Array.isArray(row.boundingbox) ? row.boundingbox.map(Number) : [];
  const result = {
    name: row.display_name || query,
    lat: Number(row.lat),
    lng: Number(row.lon),
    type: row.type || row.addresstype || "place",
    boundingBox: bounding.length === 4 && bounding.every(Number.isFinite)
      ? {
          south: Math.min(bounding[0], bounding[1]),
          north: Math.max(bounding[0], bounding[1]),
          west: Math.min(bounding[2], bounding[3]),
          east: Math.max(bounding[2], bounding[3])
        }
      : null
  };
  setCached(key, result);
  return result;
}

async function overpassPlaces({ latitude, longitude, radiusKm, category, contextName }) {
  const radiusMeters = Math.round(Math.min(Math.max(radiusKm, 1), 25) * 1000);
  const cacheKey = `overpass:${round(latitude, 4)}:${round(longitude, 4)}:${radiusMeters}:${category}`;
  const hit = getCached(cacheKey);
  if (hit) return hit;

  const filters = nearbyFilters[category] || nearbyFilters.attractions;
  const statements = [];
  for (const [key, valueRegex] of filters) {
    for (const elementType of ["node", "way", "relation"]) {
      statements.push(
        valueRegex === ".+"
          ? `${elementType}["${key}"](around:${radiusMeters},${latitude},${longitude});`
          : `${elementType}["${key}"~"${valueRegex}"](around:${radiusMeters},${latitude},${longitude});`
      );
    }
  }

  const query = `[out:json][timeout:18];(${statements.join("")});out center tags 80;`;
  const body = new URLSearchParams({ data: query }).toString();
  const payload = await fetchJson(OVERPASS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": APP_IDENTITY,
      Accept: "application/json"
    },
    body
  }, 24_000);

  const results = (payload?.elements || [])
    .map((element) => overpassFeature(element, contextName))
    .filter(Boolean)
    .slice(0, 60);

  setCached(cacheKey, results);
  return results;
}

function overpassFeature(element, contextName) {
  const tags = element?.tags || {};
  const latitude = Number(element?.lat ?? element?.center?.lat);
  const longitude = Number(element?.lon ?? element?.center?.lon);
  const name = tags.name || tags["name:en"];
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const category = categoryFromTags(tags);
  const address = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"]
  ].filter(Boolean).join(" ");

  return {
    type: "Feature",
    id: `osm:${element.type}:${element.id}`,
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    properties: {
      id: null,
      externalId: `osm:${element.type}:${element.id}`,
      placeType: "external",
      destinationId: null,
      destinationName: null,
      name,
      category,
      district: tags["addr:city"] || tags["addr:district"] || null,
      region: tags["addr:state"] || null,
      address: address || null,
      description: tags.description || tags["description:en"] ||
        `${category} discovered from OpenStreetMap near ${contextName || "this area"}.`,
      highlight: tags.website ? "Website available" : null,
      imageUrl: null,
      source: "openstreetmap",
      sourceLabel: "OpenStreetMap",
      verified: false
    }
  };
}

function categoryFromTags(tags) {
  const tourism = String(tags.tourism || "");
  const amenity = String(tags.amenity || "");
  if (["hotel", "guest_house", "hostel", "motel", "camp_site", "chalet"].includes(tourism)) return "Accommodation";
  if (["restaurant", "cafe", "fast_food"].includes(amenity)) return "Food & Drink";
  if (amenity === "fuel") return "Fuel";
  if (["hospital", "clinic", "pharmacy"].includes(amenity)) return "Health";
  if (tourism === "museum") return "Museum";
  if (tourism === "viewpoint") return "Viewpoint";
  if (tourism === "gallery") return "Gallery";
  if (tags.historic) return "Historic site";
  if (tags.leisure === "park") return "Park";
  if (amenity === "place_of_worship") return "Cultural site";
  return "Attraction";
}

function mergeFeatures(curated, external) {
  const output = [];
  const names = new Set();

  for (const feature of [...curated, ...external]) {
    const key = normalize(feature.properties?.name);
    if (!key || names.has(key)) continue;
    names.add(key);
    output.push(feature);
  }
  return output;
}

function featureCollection(features) {
  return {
    type: "FeatureCollection",
    features,
    meta: {
      total: features.length,
      verified: features.filter((feature) => feature.properties?.verified).length,
      discovered: features.filter((feature) => !feature.properties?.verified).length
    }
  };
}

function searchable(feature) {
  const p = feature.properties || {};
  return normalize([
    p.name, p.category, p.region, p.district, p.destinationName, p.description, p.highlight
  ].filter(Boolean).join(" "));
}

function radiusForGeocode(geocode) {
  const box = geocode.boundingBox;
  if (!box) return 18;
  const northSouth = haversineKm(box.south, geocode.lng, box.north, geocode.lng);
  const eastWest = haversineKm(geocode.lat, box.west, geocode.lat, box.east);
  return Math.min(35, Math.max(8, Math.max(northSouth, eastWest) * 0.65));
}

function pointInsideBoundingBox(lat, lng, box) {
  if (!box) return false;
  return lat >= box.south && lat <= box.north && lng >= box.west && lng <= box.east;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => value * Math.PI / 180;
  const earthKm = 6371.0088;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function runNominatim(task) {
  const job = nominatimChain.then(async () => {
    const elapsed = Date.now() - lastNominatimRequestAt;
    if (elapsed < 1100) await sleep(1100 - elapsed);
    const result = await task();
    lastNominatimRequestAt = Date.now();
    return result;
  });
  nominatimChain = job.catch(() => {});
  return job;
}

async function fetchJson(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const error = new Error(`External map service returned ${response.status}.`);
      error.statusCode = response.status === 429 ? 503 : 502;
      throw error;
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("External map service timed out.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > 250) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
