import { renderNavbar } from "../components/navbar.js";
import {
  getMapCapabilities,
  getMapLocations,
  getMapRoute,
  getNearbyMapPlaces,
  searchMapPlaces
} from "../services/map-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { resolveAssetPath } from "../utils/assets.js";
import { getSavedPlaces, toggleSavedPlace } from "../services/saved-service.js";

const currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);

const UGANDA_BOUNDS = [[-1.55, 29.45], [4.35, 35.10]];
const UGANDA_CENTER = [1.3733, 32.2903];
const TILE_URL = window.UGOTOUR_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = window.UGOTOUR_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const searchInput = document.getElementById("map-search-input");
const searchClear = document.getElementById("map-search-clear");
const suggestions = document.getElementById("map-search-suggestions");
const statusToast = document.getElementById("map-status-toast");
const loadingState = document.getElementById("map-loading-state");
const offlineState = document.getElementById("map-offline-state");
const retryButton = document.getElementById("map-retry-button");
const fitButton = document.getElementById("map-fit-uganda");
const locateButton = document.getElementById("map-locate-me");
const nearbyButtons = [...document.querySelectorAll("[data-nearby-category]")];
const discoveryContextLabel = document.getElementById("map-discovery-context");
const commandPanel = document.querySelector(".map-command-panel");
const callout = document.getElementById("map-place-callout");
const calloutClose = document.getElementById("map-place-panel-close");
const connector = document.getElementById("map-callout-connector");
const connectorLine = document.getElementById("map-callout-line");
const connectorLineShadow = document.getElementById("map-callout-line-shadow");
const connectorStart = document.getElementById("map-callout-start");
const connectorEnd = document.getElementById("map-callout-end");
const pinKey = document.getElementById("map-pin-key");
const placeImage = document.getElementById("map-place-image");
const placeType = document.getElementById("map-place-type");
const placeCategory = document.getElementById("map-place-category");
const placeSource = document.getElementById("map-place-source");
const placeName = document.getElementById("map-place-name");
const placeLocation = document.getElementById("map-place-location");
const placeDescription = document.getElementById("map-place-description");
const placeDetails = document.getElementById("map-place-details");
const placeSave = document.getElementById("map-place-save");
const placeRoute = document.getElementById("map-place-route");
const routePanel = document.getElementById("map-route-panel");
const routeDestination = document.getElementById("map-route-destination");
const routeDistance = document.getElementById("map-route-distance");
const routeDuration = document.getElementById("map-route-duration");
const routeClear = document.getElementById("map-route-clear");
const routeModeButtons = [...document.querySelectorAll("[data-route-mode]")];
const routeModes = document.getElementById("map-route-modes");
const routeKicker = document.getElementById("map-route-kicker");
const routeNote = document.getElementById("map-route-note");
const navigationStart = document.getElementById("map-navigation-start");
const navigationLive = document.getElementById("map-navigation-live");
const navigationEnd = document.getElementById("map-navigation-end");
const navigationVoice = document.getElementById("map-nav-voice");
const navInstruction = document.getElementById("map-nav-instruction");
const navStepDistance = document.getElementById("map-nav-step-distance");
const navManeuverIcon = document.getElementById("map-nav-maneuver-icon");
const navProgressBar = document.getElementById("map-nav-progress-bar");
const navRemainingDistance = document.getElementById("map-nav-remaining-distance");
const navRemainingTime = document.getElementById("map-nav-remaining-time");
const navUpcomingSteps = document.getElementById("map-nav-upcoming-steps");

let map = null;
let boundaryLayer = null;
let features = [];
let selectedFeature = null;
let selectedKey = null;
let positionFrame = null;
let destinationLayer = null; // retained for reset compatibility; curated markers are now contextual only
let attractionLayer = null; // retained for reset compatibility
let discoveryLayer = null;
let routeLayer = null;
let userLocationMarker = null;
let userAccuracyCircle = null;
let userLocation = null;
let routeTargetFeature = null;
let selectedRouteMode = "driving";
let discoveryContext = null;
let capabilities = { smartSearch: true, nearbyDiscovery: true, currentLocation: true, routing: false };
const markerByKey = new Map();
const contextMarkerKeys = new Set();
let savedKeys = new Set();
let lastRouteResult = null;
let navigationWatchId = null;
let navigationActive = false;
let navigationStepIndex = 0;
let navigationVoiceEnabled = true;
let lastSpokenStep = -1;
let lastRerouteAt = 0;
let navigationRerouteInFlight = false;

function featureKey(feature) {
  const p = feature?.properties || {};
  if (p.externalId) return String(p.externalId);
  return `${p.placeType}:${Number(p.id)}`;
}

function searchableText(feature) {
  const p = feature.properties;
  return [p.name, p.category, p.region, p.district, p.destinationName, p.description, p.highlight]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isExternal(feature) {
  return feature?.properties?.placeType === "external" || feature?.properties?.source === "openstreetmap";
}

function createMarkerIcon(feature, isActive = false) {
  const external = isExternal(feature);
  const isDestination = feature.properties.placeType === "destination";
  const baseSize = external ? [28, 37] : (isDestination ? [34, 44] : [29, 38]);
  const size = isActive
    ? [Math.round(baseSize[0] * 1.28), Math.round(baseSize[1] * 1.28)]
    : baseSize;
  const activeClass = isActive ? " is-active" : "";
  const typeClass = external ? "is-discovered" : (isDestination ? "is-destination" : "is-attraction");

  return window.L.divIcon({
    className: "ugotour-marker-shell",
    html: `
      <span class="ugotour-map-pin ${typeClass}${activeClass}" aria-hidden="true">
        <svg viewBox="0 0 32 42" fill="none">
          <path d="M16 40S30 27.2 30 14.8C30 6.8 23.7 1 16 1S2 6.8 2 14.8C2 27.2 16 40 16 40Z" fill="currentColor"/>
          <circle cx="16" cy="15" r="5.2" fill="white" fill-opacity=".96"/>
        </svg>
      </span>
    `,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    tooltipAnchor: [0, -size[1] + 5]
  });
}

async function initializeMap() {
  if (!window.L) {
    showMapUnavailable();
    return false;
  }

  loadingState.hidden = false;
  offlineState.hidden = true;

  map = window.L.map("uganda-map", {
    zoomControl: false,
    minZoom: 5,
    maxZoom: 17,
    maxBounds: UGANDA_BOUNDS,
    maxBoundsViscosity: 0.72,
    zoomSnap: 0.25,
    zoomDelta: 0.5
  }).setView(UGANDA_CENTER, 7);

  window.L.control.zoom({ position: "bottomright" }).addTo(map);
  destinationLayer = window.L.layerGroup();
  attractionLayer = window.L.layerGroup();
  discoveryLayer = window.L.layerGroup().addTo(map);

  const tileLayer = window.L.tileLayer(TILE_URL, {
    maxZoom: 19,
    attribution: TILE_ATTRIBUTION
  });

  let tileSuccess = false;
  tileLayer.on("load", () => {
    tileSuccess = true;
    loadingState.hidden = true;
    offlineState.hidden = true;
  });
  tileLayer.on("tileerror", () => {
    if (!tileSuccess) showMapUnavailable(false);
  });
  tileLayer.addTo(map);

  // The earlier boundary overlay used a heavily simplified polygon that read as
  // an accidental geometric box at country scale. The professional map keeps
  // the OSM administrative labels clean and uses UGANDA_BOUNDS only for fitting.
  boundaryLayer = null;

  buildMarkers();
  fitUganda();

  map.on("move zoom resize", scheduleCalloutPosition);
  map.on("click", (event) => {
    if (event.originalEvent?.target?.closest?.(".leaflet-marker-icon")) return;
    closeCallout();
  });

  requestAnimationFrame(() => map?.invalidateSize({ pan: false }));
  return true;
}

function showMapUnavailable(recreate = false) {
  loadingState.hidden = true;
  offlineState.hidden = false;
  if (recreate && map) {
    map.remove();
    map = null;
    boundaryLayer = null;
    destinationLayer = null;
    attractionLayer = null;
    discoveryLayer = null;
    routeLayer = null;
    userLocationMarker = null;
    userAccuracyCircle = null;
    markerByKey.clear();
    contextMarkerKeys.clear();
  }
}

function buildMarkers() {
  // Phase 1.14: the map opens calm. Tourism markers are created only after
  // a specific selection, an area search, or a nearby-category request.
  clearContextMarkers();
}

function syncCuratedMarkerVisibility() {
  // Curated destinations are no longer rendered globally. Keeping this small
  // compatibility function avoids older call sites from reintroducing clutter.
  updateLegendVisibility();
}

function addFeatureMarker(feature, layer, { contextual = true } = {}) {
  if (!map || !feature?.geometry?.coordinates) return null;
  const [longitude, latitude] = feature.geometry.coordinates;
  const marker = window.L.marker([latitude, longitude], {
    icon: createMarkerIcon(feature),
    title: feature.properties.name,
    keyboard: true,
    riseOnHover: true
  });

  marker.feature = feature;
  marker.bindTooltip(feature.properties.name, {
    className: "ugotour-marker-tooltip",
    direction: "top",
    opacity: 0.96,
    offset: [0, -4]
  });
  marker.on("click", () => selectFeature(feature, { focusMap: false }));
  marker.addTo(layer);

  const key = featureKey(feature);
  markerByKey.set(key, marker);
  if (contextual) contextMarkerKeys.add(key);
  return marker;
}

function setMarkerActive(key, active) {
  if (!key) return;
  const marker = markerByKey.get(key);
  if (!marker?.feature) return;
  marker.setIcon(createMarkerIcon(marker.feature, active));
  marker.setZIndexOffset(active ? 1000 : 0);
}

function detailsHref(feature) {
  const p = feature.properties;
  if (p.placeType === "destination") return `./destination-details.html?id=${Number(p.id)}`;
  if (p.placeType === "attraction" && p.destinationId) return `./destination-details.html?id=${Number(p.destinationId)}`;
  if (p.placeType === "attraction" && p.id) return `./destination-details.html?attraction=${Number(p.id)}`;
  return null;
}

function selectFeature(feature, { focusMap = false } = {}) {
  const key = featureKey(feature);
  if (!markerByKey.has(key)) ensureFeatureMarker(feature, { clearOthers: true });
  if (selectedKey && selectedKey !== key) setMarkerActive(selectedKey, false);

  selectedFeature = feature;
  selectedKey = key;
  setMarkerActive(key, true);

  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;
  const external = isExternal(feature);

  if (p.imageUrl) {
    placeImage.hidden = false;
    placeImage.src = resolveAssetPath(p.imageUrl, "..");
    placeImage.alt = `${p.name} tourism image`;
    callout.classList.remove("is-no-image");
  } else {
    placeImage.hidden = true;
    placeImage.removeAttribute("src");
    placeImage.alt = "";
    callout.classList.add("is-no-image");
  }

  placeType.textContent = external ? "Discovered place" : (p.placeType === "destination" ? "Destination" : "Attraction");
  placeCategory.textContent = p.category || "Tourism";
  placeSource.textContent = p.sourceLabel || (external ? "OpenStreetMap" : "UgoTour Verified");
  placeName.textContent = p.name;
  const locationBits = [];
  const namedLocation = p.address || [p.district, p.region].filter(Boolean).join(" · ");
  if (namedLocation) locationBits.push(namedLocation);
  if (Number.isFinite(Number(p.distanceKm))) locationBits.push(`${p.distanceKm} km away`);
  placeLocation.textContent = locationBits.join(" · ") || "Uganda";
  placeDescription.textContent = p.description || p.highlight || "Explore this tourism location in Uganda.";

  const href = detailsHref(feature);
  placeDetails.hidden = !href;
  if (href) {
    placeDetails.href = href;
    placeDetails.textContent = "View details →";
  }

  placeSave.hidden = external;
  if (!external) {
    const saved = savedKeys.has(key);
    placeSave.textContent = saved ? "♥ Saved" : "♡ Save";
    placeSave.setAttribute("aria-pressed", String(saved));
    placeSave.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${p.name}`);
  }

  placeRoute.hidden = false;
  placeRoute.textContent = "Directions";
  placeRoute.title = `Route from your current location to ${p.name}`;

  callout.hidden = false;
  connector.classList.add("is-visible");

  if (focusMap && map) {
    const targetZoom = external ? 13 : (p.placeType === "destination" ? 10 : 12);
    map.flyTo([latitude, longitude], targetZoom, { duration: 0.72 });
    map.once("moveend", () => {
      keepSelectedMarkerVisible();
      scheduleCalloutPosition();
    });
  } else {
    scheduleCalloutPosition();
  }
}

function scheduleCalloutPosition() {
  if (!selectedFeature || callout.hidden || !map) return;
  if (positionFrame) cancelAnimationFrame(positionFrame);
  positionFrame = requestAnimationFrame(positionCallout);
}

function positionCallout() {
  positionFrame = null;
  if (!selectedFeature || callout.hidden || !map) return;

  const [longitude, latitude] = selectedFeature.geometry.coordinates;
  const markerPoint = map.latLngToContainerPoint([latitude, longitude]);
  const mapSize = map.getSize();
  const cardWidth = callout.offsetWidth;
  const cardHeight = callout.offsetHeight;
  const compact = mapSize.x <= 720;
  // Keep the selected-place card below the unified command panel even while
  // its transient status row expands/collapses. Suggestions are absolutely
  // positioned and intentionally do not change this safe zone.
  const commandSafeTop = commandPanel
    ? commandPanel.offsetTop + commandPanel.offsetHeight + 12
    : (compact ? 198 : 218);

  let left;
  let top;
  let endX;
  let endY;

  if (compact) {
    left = Math.max(10, (mapSize.x - cardWidth) / 2);
    const preferredTop = mapSize.y - cardHeight - 14;
    top = Math.max(commandSafeTop, preferredTop);
    endX = clamp(markerPoint.x, left + 24, left + cardWidth - 24);
    endY = top;
  } else {
    const gap = 44;
    const rightFits = markerPoint.x + gap + cardWidth <= mapSize.x - 24;
    left = rightFits ? markerPoint.x + gap : markerPoint.x - gap - cardWidth;
    left = clamp(left, 24, Math.max(24, mapSize.x - cardWidth - 24));
    const minTop = commandSafeTop;
    const maxTop = Math.max(minTop, mapSize.y - cardHeight - 28);
    top = clamp(markerPoint.y - cardHeight / 2, minTop, maxTop);
    endX = rightFits ? left : left + cardWidth;
    endY = clamp(markerPoint.y, top + 26, top + cardHeight - 26);
  }

  callout.style.left = `${left}px`;
  callout.style.top = `${top}px`;

  connector.setAttribute("viewBox", `0 0 ${mapSize.x} ${mapSize.y}`);
  connector.setAttribute("width", String(mapSize.x));
  connector.setAttribute("height", String(mapSize.y));

  const bend = compact
    ? Math.max(30, Math.abs(markerPoint.y - endY) * 0.45)
    : Math.max(34, Math.abs(markerPoint.x - endX) * 0.45);

  const path = compact
    ? `M ${markerPoint.x} ${markerPoint.y} C ${markerPoint.x} ${markerPoint.y + bend}, ${endX} ${endY - bend}, ${endX} ${endY}`
    : `M ${markerPoint.x} ${markerPoint.y} C ${markerPoint.x + (endX > markerPoint.x ? bend : -bend)} ${markerPoint.y}, ${endX + (endX > markerPoint.x ? -bend : bend)} ${endY}, ${endX} ${endY}`;

  connectorLine.setAttribute("d", path);
  connectorLineShadow?.setAttribute("d", path);
  connectorStart?.setAttribute("cx", String(markerPoint.x));
  connectorStart?.setAttribute("cy", String(markerPoint.y));
  connectorEnd.setAttribute("cx", String(endX));
  connectorEnd.setAttribute("cy", String(endY));
}

function closeCallout() {
  if (selectedKey) setMarkerActive(selectedKey, false);
  selectedFeature = null;
  selectedKey = null;
  callout.hidden = true;
  connector.classList.remove("is-visible");
  connectorLine.setAttribute("d", "");
  connectorLineShadow?.setAttribute("d", "");
}

function fitUganda() {
  if (!map) return;
  closeSuggestions();
  clearRoute(false);
  map.fitBounds(UGANDA_BOUNDS, { paddingTopLeft: [38, 168], paddingBottomRight: [38, 46] });
  scheduleCalloutPosition();
}

function setDiscoveryContext(context) {
  discoveryContext = context && Number.isFinite(Number(context.lat)) && Number.isFinite(Number(context.lng))
    ? { lat: Number(context.lat), lng: Number(context.lng), label: String(context.label || "this area"), source: context.source || "area" }
    : null;

  if (discoveryContextLabel) {
    discoveryContextLabel.textContent = discoveryContext
      ? `Explore near ${shortAreaName(discoveryContext.label)}`
      : "Explore near Uganda";
    discoveryContextLabel.title = discoveryContext?.label || "Uganda";
  }
  locateButton?.classList.toggle("is-active", discoveryContext?.source === "location");
  locateButton?.setAttribute("aria-pressed", String(discoveryContext?.source === "location"));
}

function getSearchMatches(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return features
    .map((feature) => {
      const name = feature.properties.name.toLowerCase();
      let score = 3;
      if (name === normalized) score = 0;
      else if (name.startsWith(normalized)) score = 1;
      else if (name.includes(normalized)) score = 2;
      return { feature, score };
    })
    .filter(({ feature }) => searchableText(feature).includes(normalized))
    .sort((a, b) => a.score - b.score || a.feature.properties.name.localeCompare(b.feature.properties.name))
    .map(({ feature }) => feature);
}

function renderSuggestions(query) {
  const matches = getSearchMatches(query).slice(0, 4);
  suggestions.innerHTML = "";

  if (!query.trim()) {
    closeSuggestions();
    return;
  }

  matches.forEach((feature) => suggestions.appendChild(createSuggestionButton(feature)));

  const areaButton = document.createElement("button");
  areaButton.type = "button";
  areaButton.className = "map-suggestion map-suggestion-area";
  areaButton.innerHTML = `
    <span class="map-suggestion-pin is-discovered"></span>
    <span><strong>Search ${escapeHtml(query)} as an area</strong><small>Find UgoTour places + live tourism sites nearby</small></span>
  `;
  areaButton.addEventListener("click", () => performSmartSearch(query));
  suggestions.appendChild(areaButton);
  suggestions.hidden = false;
}

function createSuggestionButton(feature, secondaryText = null) {
  const p = feature.properties;
  const external = isExternal(feature);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-suggestion";
  button.innerHTML = `
    <span class="map-suggestion-pin ${external ? "is-discovered" : (p.placeType === "destination" ? "is-destination" : "is-attraction")}"></span>
    <span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(
      secondaryText || [p.sourceLabel, p.category, p.district || p.region].filter(Boolean).join(" · ")
    )}</small></span>
  `;
  button.addEventListener("click", () => chooseSearchResult(feature));
  return button;
}

function chooseSearchResult(feature) {
  searchInput.value = feature.properties.name;
  searchClear.hidden = false;
  closeSuggestions();
  clearRoute(false);
  showOnlyFeatureMarker(feature);
  selectFeature(feature, { focusMap: true });
  showStatus(`${feature.properties.name} selected.`);
}

function closeSuggestions() {
  suggestions.hidden = true;
  suggestions.innerHTML = "";
}

async function performSmartSearch(query) {
  const term = String(query || "").trim();
  if (term.length < 2) return;
  closeSuggestions();
  closeCallout();
  clearRoute(false);
  searchClear.hidden = false;
  nearbyButtons.forEach((button) => { button.classList.remove("is-active"); button.setAttribute("aria-pressed", "false"); });
  showStatus(`Searching ${term} and nearby tourism sites…`, { persistent: true });

  try {
    const result = await searchMapPlaces(term);
    renderContextCollection(result.collection);
    if (result.area) {
      setDiscoveryContext({
        lat: result.area.latitude,
        lng: result.area.longitude,
        label: result.area.name || term,
        source: "area"
      });
    }
    closeSuggestions();
    focusDiscoveryArea(result);
    const total = result.collection?.meta?.total ?? result.collection?.features?.length ?? 0;
    const verified = result.collection?.meta?.verified ?? 0;
    const discovered = result.collection?.meta?.discovered ?? 0;
    showStatus(`${total} places found · ${verified} UgoTour verified · ${discovered} discovered`);
  } catch (error) {
    console.error("Smart map search failed:", error);
    showStatus(error.message || "Could not search this area.", { error: true });
  }
}

function renderRemoteSuggestions(resultFeatures, area) {
  suggestions.innerHTML = "";
  if (!resultFeatures.length) {
    suggestions.hidden = true;
    return;
  }

  const heading = document.createElement("div");
  heading.className = "map-suggestion-heading";
  heading.textContent = area?.name ? `Places around ${shortAreaName(area.name)}` : "Search results";
  suggestions.appendChild(heading);

  resultFeatures.slice(0, 8).forEach((feature) => suggestions.appendChild(createSuggestionButton(feature)));
  suggestions.hidden = false;
}

function renderContextCollection(collection) {
  clearContextMarkers();
  const resultFeatures = Array.isArray(collection?.features) ? collection.features : [];
  for (const feature of resultFeatures) addFeatureMarker(feature, discoveryLayer, { contextual: true });
  updateLegendVisibility(resultFeatures.length);
}

function clearContextMarkers() {
  discoveryLayer?.clearLayers();
  contextMarkerKeys.forEach((key) => markerByKey.delete(key));
  contextMarkerKeys.clear();
  updateLegendVisibility(0);
}

function ensureFeatureMarker(feature, { clearOthers = false } = {}) {
  if (clearOthers) clearContextMarkers();
  const key = featureKey(feature);
  const existing = markerByKey.get(key);
  if (existing) return existing;
  const marker = addFeatureMarker(feature, discoveryLayer, { contextual: true });
  updateLegendVisibility(contextMarkerKeys.size);
  return marker;
}

function showOnlyFeatureMarker(feature) {
  clearContextMarkers();
  ensureFeatureMarker(feature);
}

function updateLegendVisibility(markerCount = contextMarkerKeys.size) {
  if (!pinKey) return;
  pinKey.hidden = Number(markerCount || 0) === 0;
}

function focusDiscoveryArea(result) {
  if (!map) return;
  const box = result?.area?.boundingBox;
  if (box) {
    map.fitBounds([[box.south, box.west], [box.north, box.east]], {
      paddingTopLeft: [24, 190],
      paddingBottomRight: [24, 40],
      maxZoom: 13
    });
    return;
  }

  const lat = Number(result?.area?.latitude);
  const lng = Number(result?.area?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) map.flyTo([lat, lng], 11, { duration: 0.7 });
}

async function acquireCurrentLocation({ focus = true, useAsDiscoveryContext = false } = {}) {
  if (userLocation) {
    if (useAsDiscoveryContext) {
      setDiscoveryContext({ ...userLocation, label: "your location", source: "location" });
    }
    if (focus) map?.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    return userLocation;
  }

  if (!navigator.geolocation) throw new Error("This browser does not provide location access.");

  showStatus("Waiting for your location permission…", { persistent: true });
  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        const messages = {
          1: "Location permission was denied.",
          2: "Your current location could not be determined.",
          3: "Location lookup timed out."
        };
        reject(new Error(messages[error.code] || "Could not access your location."));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  });

  userLocation = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy
  };
  renderUserLocation();
  if (useAsDiscoveryContext) {
    setDiscoveryContext({ ...userLocation, label: "your location", source: "location" });
  }
  if (focus) map?.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.7 });
  showStatus(`Your location is ready${Number.isFinite(userLocation.accuracy) ? ` · ±${Math.round(userLocation.accuracy)} m` : ""}.`);
  return userLocation;
}

function renderUserLocation() {
  if (!map || !userLocation) return;
  userLocationMarker?.remove();
  userAccuracyCircle?.remove();

  userAccuracyCircle = window.L.circle([userLocation.lat, userLocation.lng], {
    radius: Math.min(Math.max(userLocation.accuracy || 30, 15), 1000),
    color: "#365f8e",
    fillColor: "#5f8fbe",
    fillOpacity: 0.10,
    weight: 1.5
  }).addTo(map);

  userLocationMarker = window.L.circleMarker([userLocation.lat, userLocation.lng], {
    radius: 8,
    color: "#ffffff",
    fillColor: "#2f6faa",
    fillOpacity: 1,
    weight: 3
  }).addTo(map).bindTooltip("You are here", { direction: "top", className: "ugotour-marker-tooltip" });
}

async function getNearbyOrigin() {
  if (discoveryContext) return discoveryContext;
  if (userLocation) {
    const origin = { ...userLocation, label: "your location", source: "location" };
    setDiscoveryContext(origin);
    return origin;
  }
  const location = await acquireCurrentLocation({ focus: false, useAsDiscoveryContext: true });
  return { ...location, label: "your location", source: "location" };
}

async function showNearby(category) {
  closeSuggestions();
  closeCallout();
  clearRoute(false);
  nearbyButtons.forEach((button) => {
    const active = button.dataset.nearbyCategory === category;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  try {
    const origin = await getNearbyOrigin();
    showStatus(`Finding ${friendlyNearby(category)} near ${shortAreaName(origin.label)}…`, { persistent: true });
    const result = await getNearbyMapPlaces({
      lat: origin.lat,
      lng: origin.lng,
      category,
      radiusKm: 8,
      context: origin.label
    });

    renderContextCollection(result.collection);
    const resultFeatures = result.collection?.features || [];
    closeSuggestions();
    fitFeaturesWithOrigin(resultFeatures, origin);
    showStatus(`${resultFeatures.length} ${friendlyNearby(category)} found near ${shortAreaName(origin.label)}.`);
  } catch (error) {
    console.error("Nearby search failed:", error);
    showStatus(error.message || "Could not find nearby places.", { error: true });
  }
}

function fitFeaturesWithOrigin(resultFeatures, origin) {
  if (!map || !origin) return;
  const points = [[origin.lat, origin.lng]];
  for (const feature of resultFeatures.slice(0, 40)) {
    const [lng, lat] = feature.geometry?.coordinates || [];
    if (Number.isFinite(lat) && Number.isFinite(lng)) points.push([lat, lng]);
  }
  if (points.length > 1) {
    map.fitBounds(points, { paddingTopLeft: [24, 205], paddingBottomRight: [24, 96], maxZoom: 14 });
  } else {
    map.flyTo(points[0], 14, { duration: 0.6 });
  }
}

async function routeToFeature(feature = selectedFeature, mode = selectedRouteMode) {
  if (!feature || placeRoute?.disabled) return;
  const originalLabel = placeRoute?.textContent || "Directions";
  try {
    routeTargetFeature = feature;
    selectedRouteMode = mode;
    routeModeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.routeMode === mode));
    if (placeRoute) {
      placeRoute.disabled = true;
      placeRoute.textContent = "Routing…";
    }

    const location = await acquireCurrentLocation({ focus: false });
    const [lng, lat] = feature.geometry.coordinates;
    showStatus(`Building ${mode} route to ${feature.properties.name}…`, { persistent: true });

    const result = await getMapRoute({
      from: { lat: location.lat, lng: location.lng },
      to: { lat, lng },
      mode
    });
    lastRouteResult = result;
    drawRoute(result, feature);
    showStatus(result?.approximate ? "Route ready · estimate mode" : "Road route ready. Start navigation when ready.");
  } catch (error) {
    console.error("Route request failed:", error);
    showStatus(error.message || "Could not build this route.", { error: true, persistent: true });
  } finally {
    if (placeRoute) {
      placeRoute.disabled = false;
      placeRoute.textContent = originalLabel;
    }
  }
}

function drawRoute(result, feature) {
  if (!map || !result?.geojson) return;
  routeLayer?.remove();
  const directEstimate = result.provider === "direct-estimate";
  routeLayer = window.L.geoJSON(result.geojson, {
    style: {
      color: directEstimate ? "#b78335" : "#315d3b",
      weight: directEstimate ? 4 : 6,
      opacity: 0.94,
      dashArray: directEstimate ? "10 9" : null,
      lineCap: "round",
      lineJoin: "round"
    }
  }).addTo(map);

  const bounds = routeLayer.getBounds();
  if (bounds?.isValid()) {
    map.fitBounds(bounds, { paddingTopLeft: [28, 205], paddingBottomRight: [28, 170] });
  }

  routeDestination.textContent = feature.properties.name;
  routeDistance.textContent = formatDistance(result.distanceMeters);
  routeDuration.textContent = formatDuration(result.durationSeconds);
  if (routeKicker) routeKicker.textContent = "Directions";
  if (navigationStart) {
    navigationStart.hidden = false;
    navigationStart.disabled = !Array.isArray(result.steps) || result.steps.length === 0;
    navigationStart.textContent = result.navigationReady === false ? "Preview guidance" : "Start navigation";
  }
  if (navigationLive) navigationLive.hidden = true;
  if (routeModes) routeModes.hidden = false;
  if (routeNote) {
    routeNote.textContent = result.warning || (result.approximate
      ? "This is an approximate route estimate."
      : `Road route via ${result.providerLabel || result.provider || "routing provider"}.`);
    routeNote.classList.toggle("is-warning", Boolean(result.approximate || result.warning));
  }
  routePanel.hidden = false;
  // Keep the destination marker visible while the route is displayed. The
  // selected information card closes only to make room for navigation UI.
  closeCallout();
  ensureFeatureMarker(feature);
  setMarkerActive(featureKey(feature), true);
}

function clearRoute(resetView = false) {
  endNavigation({ keepRoute: false, silent: true });
  routeLayer?.remove();
  routeLayer = null;
  routeTargetFeature = null;
  lastRouteResult = null;
  routePanel.hidden = true;
  if (navigationLive) navigationLive.hidden = true;
  if (navigationStart) navigationStart.hidden = false;
  if (routeModes) routeModes.hidden = false;
  if (routeNote) { routeNote.textContent = ""; routeNote.classList.remove("is-warning"); }
  if (resetView) fitUganda();
}

function keepSelectedMarkerVisible() {
  if (!map || !selectedFeature || callout.hidden) return;
  const [lng, lat] = selectedFeature.geometry.coordinates;
  const commandBottom = commandPanel ? commandPanel.offsetTop + commandPanel.offsetHeight + 24 : 170;
  const cardHeight = callout.offsetHeight || 190;
  map.panInside([lat, lng], {
    paddingTopLeft: [36, commandBottom + 44],
    paddingBottomRight: [36, cardHeight + 76],
    animate: true
  });
}

async function showPreviouslyGrantedLocation() {
  if (!navigator.geolocation || !navigator.permissions?.query) return;
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state === "granted") await acquireCurrentLocation({ focus: false, useAsDiscoveryContext: false });
  } catch { /* Permissions API is optional. */ }
}

async function startNavigation() {
  if (!routeTargetFeature || !lastRouteResult || navigationActive) return;
  try {
    await acquireCurrentLocation({ focus: false });
  } catch (error) {
    showStatus(error.message || "Location access is required for live navigation.", { error: true });
    return;
  }

  if (!navigator.geolocation?.watchPosition) {
    showStatus("This browser cannot provide continuous GPS navigation.", { error: true });
    return;
  }

  navigationActive = true;
  navigationStepIndex = 0;
  lastSpokenStep = -1;
  lastRerouteAt = 0;
  navigationRerouteInFlight = false;
  if (routeKicker) routeKicker.textContent = "Navigating";
  if (navigationStart) navigationStart.hidden = true;
  if (navigationLive) navigationLive.hidden = false;
  if (routeModes) routeModes.hidden = true;
  if (routeNote) routeNote.textContent = lastRouteResult.approximate
    ? "Live position is active. Route guidance is approximate until a full routing provider is configured."
    : "Live GPS guidance is active. Keep UgoTour open while navigating.";

  showOnlyFeatureMarker(routeTargetFeature);
  setMarkerActive(featureKey(routeTargetFeature), true);
  updateNavigationGuidance(userLocation);
  speakNavigationStep(true);

  navigationWatchId = navigator.geolocation.watchPosition(
    (position) => handleNavigationPosition(position),
    (error) => showStatus(navigationLocationError(error), { error: true, persistent: true }),
    { enableHighAccuracy: true, maximumAge: 2500, timeout: 15_000 }
  );
  showStatus(`Navigation started to ${routeTargetFeature.properties.name}.`);
}

function handleNavigationPosition(position) {
  userLocation = {
    lat: Number(position.coords.latitude),
    lng: Number(position.coords.longitude),
    accuracy: Number(position.coords.accuracy || 0),
    heading: Number(position.coords.heading),
    speed: Number(position.coords.speed)
  };
  renderUserLocation();
  if (!navigationActive) return;
  updateNavigationGuidance(userLocation);
  followNavigationCamera(userLocation);
  maybeRerouteNavigation(userLocation);
}

function updateNavigationGuidance(location) {
  if (!navigationActive || !routeTargetFeature || !location) return;
  const steps = Array.isArray(lastRouteResult?.steps) ? lastRouteResult.steps : [];
  const [destLng, destLat] = routeTargetFeature.geometry.coordinates;
  const destinationDistance = haversineMeters(location.lat, location.lng, destLat, destLng);

  if (destinationDistance <= Math.max(24, Number(location.accuracy || 0) * 1.15)) {
    if (navInstruction) navInstruction.textContent = `You have arrived at ${routeTargetFeature.properties.name}`;
    if (navStepDistance) navStepDistance.textContent = "Destination reached";
    if (navManeuverIcon) navManeuverIcon.textContent = "✓";
    if (navProgressBar) navProgressBar.style.width = "100%";
    if (navRemainingDistance) navRemainingDistance.textContent = "0 m";
    if (navRemainingTime) navRemainingTime.textContent = "Arrived";
    if (navigationVoiceEnabled && lastSpokenStep !== 999999) {
      speakText(`You have arrived at ${routeTargetFeature.properties.name}.`);
      lastSpokenStep = 999999;
    }
    endNavigation({ keepRoute: true, silent: true, arrived: true });
    return;
  }

  if (!steps.length) {
    if (navInstruction) navInstruction.textContent = "Continue toward your destination";
    if (navStepDistance) navStepDistance.textContent = formatDistance(destinationDistance);
    updateNavigationSummary(destinationDistance, lastRouteResult?.durationSeconds || 0);
    return;
  }

  navigationStepIndex = Math.min(navigationStepIndex, steps.length - 1);
  let step = steps[navigationStepIndex];
  let distanceToStep = distanceToNavigationStep(location, step);
  while (navigationStepIndex < steps.length - 1 && distanceToStep <= navigationAdvanceThreshold(location)) {
    navigationStepIndex += 1;
    step = steps[navigationStepIndex];
    distanceToStep = distanceToNavigationStep(location, step);
    speakNavigationStep(true);
  }

  if (navInstruction) navInstruction.textContent = step.instruction || "Continue on the route";
  if (navStepDistance) navStepDistance.textContent = `${formatDistance(distanceToStep)} to maneuver`;
  if (navManeuverIcon) navManeuverIcon.textContent = maneuverIcon(step);

  const remainingAfterStep = steps.slice(navigationStepIndex + 1).reduce((sum, item) => sum + Number(item.distanceMeters || 0), 0);
  const remainingDistance = Math.min(
    Math.max(destinationDistance, distanceToStep + remainingAfterStep),
    Number(lastRouteResult?.distanceMeters || Infinity)
  );
  const remainingSeconds = estimateRemainingNavigationSeconds(remainingDistance);
  updateNavigationSummary(remainingDistance, remainingSeconds);
  renderUpcomingSteps(steps);

  const total = Math.max(1, Number(lastRouteResult?.distanceMeters || remainingDistance));
  const progress = clamp((1 - remainingDistance / total) * 100, 0, 100);
  if (navProgressBar) navProgressBar.style.width = `${progress.toFixed(1)}%`;

  if (distanceToStep <= 220 && lastSpokenStep !== navigationStepIndex) speakNavigationStep(false);
}

function updateNavigationSummary(distanceMeters, seconds) {
  if (navRemainingDistance) navRemainingDistance.textContent = formatDistance(distanceMeters);
  if (navRemainingTime) navRemainingTime.textContent = formatDuration(seconds);
}

function renderUpcomingSteps(steps) {
  if (!navUpcomingSteps) return;
  const upcoming = steps.slice(navigationStepIndex + 1, navigationStepIndex + 4);
  navUpcomingSteps.innerHTML = upcoming.map((step) => `
    <div><span>${escapeHtml(maneuverIcon(step))}</span><strong>${escapeHtml(step.instruction || "Continue")}</strong><small>${escapeHtml(formatDistance(step.distanceMeters || 0))}</small></div>
  `).join("");
  navUpcomingSteps.hidden = upcoming.length === 0;
}

function speakNavigationStep(force = false) {
  if (!navigationVoiceEnabled || !navigationActive) return;
  const steps = Array.isArray(lastRouteResult?.steps) ? lastRouteResult.steps : [];
  const step = steps[navigationStepIndex];
  if (!step) return;
  if (!force && lastSpokenStep === navigationStepIndex) return;
  speakText(step.instruction || "Continue on the route");
  lastSpokenStep = navigationStepIndex;
}

function speakText(text) {
  if (!navigationVoiceEnabled || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.lang = "en-UG";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function followNavigationCamera(location) {
  if (!map || !location) return;
  const targetZoom = Math.max(map.getZoom(), 15.5);
  map.setView([location.lat, location.lng], targetZoom, { animate: true });
}

async function maybeRerouteNavigation(location) {
  if (!navigationActive || navigationRerouteInFlight || !routeTargetFeature || !lastRouteResult?.geojson) return;
  const distanceOffRoute = distanceToRouteMeters(location, lastRouteResult.geojson);
  if (distanceOffRoute < 110) return;
  const now = Date.now();
  if (now - lastRerouteAt < 18_000) return;
  lastRerouteAt = now;
  navigationRerouteInFlight = true;
  showStatus("You appear to be off route. Recalculating…", { persistent: true });
  try {
    const [toLng, toLat] = routeTargetFeature.geometry.coordinates;
    const result = await getMapRoute({
      from: { lat: location.lat, lng: location.lng },
      to: { lat: toLat, lng: toLng },
      mode: selectedRouteMode
    });
    lastRouteResult = result;
    navigationStepIndex = 0;
    lastSpokenStep = -1;
    drawRoute(result, routeTargetFeature);
    navigationActive = true;
    if (navigationStart) navigationStart.hidden = true;
    if (navigationLive) navigationLive.hidden = false;
    if (routeModes) routeModes.hidden = true;
    if (routeKicker) routeKicker.textContent = "Navigating";
    showStatus("Route updated.");
    speakNavigationStep(true);
  } catch (error) {
    showStatus(error.message || "Could not recalculate the route.", { error: true });
  } finally {
    navigationRerouteInFlight = false;
  }
}

function distanceToRouteMeters(location, geojson) {
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  const coordinates = features.flatMap((feature) => feature.geometry?.type === "LineString" ? (feature.geometry.coordinates || []) : []);
  if (!coordinates.length) return 0;
  let nearest = Infinity;
  const stride = Math.max(1, Math.floor(coordinates.length / 350));
  for (let index = 0; index < coordinates.length; index += stride) {
    const [lng, lat] = coordinates[index];
    nearest = Math.min(nearest, haversineMeters(location.lat, location.lng, lat, lng));
  }
  return nearest;
}

function distanceToNavigationStep(location, step) {
  const lat = Number(step?.location?.lat);
  const lng = Number(step?.location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Number(step?.distanceMeters || 0);
  return haversineMeters(location.lat, location.lng, lat, lng);
}

function navigationAdvanceThreshold(location) {
  return Math.max(28, Math.min(70, Number(location?.accuracy || 20) * 1.35));
}

function estimateRemainingNavigationSeconds(distanceMeters) {
  const speedKph = { driving: 48, walking: 4.8, cycling: 15 }[selectedRouteMode] || 48;
  return Math.max(30, (Number(distanceMeters || 0) / 1000) / speedKph * 3600);
}

function maneuverIcon(step) {
  const instruction = String(step?.instruction || "").toLowerCase();
  const modifier = String(step?.modifier || "").toLowerCase();
  if (instruction.includes("arriv")) return "●";
  if (instruction.includes("roundabout")) return "⟳";
  if (modifier.includes("left") || instruction.includes("turn left") || instruction.includes("keep left")) return "↰";
  if (modifier.includes("right") || instruction.includes("turn right") || instruction.includes("keep right")) return "↱";
  if (instruction.includes("u-turn")) return "↶";
  return "↑";
}

function endNavigation({ keepRoute = true, silent = false, arrived = false } = {}) {
  if (navigationWatchId !== null && navigator.geolocation?.clearWatch) navigator.geolocation.clearWatch(navigationWatchId);
  navigationWatchId = null;
  const wasActive = navigationActive;
  navigationActive = false;
  navigationRerouteInFlight = false;
  window.speechSynthesis?.cancel();
  if (navigationLive && !arrived) navigationLive.hidden = true;
  if (navigationStart && !arrived) navigationStart.hidden = false;
  if (routeModes) routeModes.hidden = false;
  if (routeKicker) routeKicker.textContent = arrived ? "Arrived" : "Directions";
  if (!keepRoute) routeLayer?.remove();
  if (wasActive && !silent) showStatus(arrived ? "Destination reached." : "Navigation ended.");
}

function navigationLocationError(error) {
  return ({ 1: "Location permission was denied.", 2: "GPS position is temporarily unavailable.", 3: "GPS update timed out." })[error?.code]
    || "Live location could not be updated.";
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const radius = 6_371_000;
  const toRad = (value) => Number(value) * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function showStatus(message, { error = false, persistent = false } = {}) {
  if (!statusToast) return;
  statusToast.textContent = message;
  statusToast.classList.toggle("is-error", error);
  statusToast.hidden = false;
  scheduleCalloutPosition();
  clearTimeout(showStatus.timer);
  if (!persistent) {
    showStatus.timer = setTimeout(() => {
      statusToast.hidden = true;
      statusToast.classList.remove("is-error");
      scheduleCalloutPosition();
    }, 3600);
  }
}

function parseFocus() {
  const focus = new URLSearchParams(window.location.search).get("focus");
  if (!focus) return null;
  const [placeTypeValue, idValue] = focus.split(":");
  const id = Number(idValue);
  if (!Number.isInteger(id) || !["destination", "attraction"].includes(placeTypeValue)) return null;
  return `${placeTypeValue}:${id}`;
}

function focusFromUrl() {
  const key = parseFocus();
  if (!key) return;
  const feature = features.find((item) => featureKey(item) === key);
  if (feature) window.setTimeout(() => {
    showOnlyFeatureMarker(feature);
    selectFeature(feature, { focusMap: true });
  }, 280);
}

searchInput?.addEventListener("input", (event) => {
  const query = event.target.value;
  searchClear.hidden = !query;
  renderSuggestions(query);
});

searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSuggestions();
    searchInput.blur();
    return;
  }
  if (event.key !== "Enter") return;
  event.preventDefault();
  performSmartSearch(searchInput.value);
});

searchClear?.addEventListener("click", () => {
  searchInput.value = "";
  searchClear.hidden = true;
  closeSuggestions();
  closeCallout();
  clearRoute(false);
  clearContextMarkers();
  setDiscoveryContext(null);
  nearbyButtons.forEach((button) => { button.classList.remove("is-active"); button.setAttribute("aria-pressed", "false"); });
  if (userLocation) map?.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.6 });
  else fitUganda();
  searchInput.focus();
});

fitButton?.addEventListener("click", fitUganda);

locateButton?.addEventListener("click", async () => {
  try {
    closeSuggestions();
    closeCallout();
    clearRoute(false);
    clearContextMarkers();
    await acquireCurrentLocation({ focus: true, useAsDiscoveryContext: true });
    nearbyButtons.forEach((button) => { button.classList.remove("is-active"); button.setAttribute("aria-pressed", "false"); });
  } catch (error) {
    showStatus(error.message || "Could not access your location.", { error: true });
  }
});

nearbyButtons.forEach((button) => {
  button.addEventListener("click", () => showNearby(button.dataset.nearbyCategory));
});

placeRoute?.addEventListener("click", () => routeToFeature(selectedFeature, selectedRouteMode));

placeSave?.addEventListener("click", async () => {
  if (!selectedFeature || placeSave.disabled || isExternal(selectedFeature)) return;
  const key = featureKey(selectedFeature);
  const p = selectedFeature.properties;
  const currentSaved = savedKeys.has(key);
  placeSave.disabled = true;
  try {
    const next = await toggleSavedPlace(p.placeType, p.id, currentSaved);
    if (next) savedKeys.add(key); else savedKeys.delete(key);
    placeSave.textContent = next ? "♥ Saved" : "♡ Save";
    placeSave.setAttribute("aria-pressed", String(next));
  } catch (error) {
    console.error("Could not update saved place:", error);
    showStatus("Could not update your saved places.", { error: true });
  } finally {
    placeSave.disabled = false;
  }
});

routeModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!routeTargetFeature) return;
    routeToFeature(routeTargetFeature, button.dataset.routeMode);
  });
});

navigationStart?.addEventListener("click", startNavigation);
navigationEnd?.addEventListener("click", () => endNavigation({ keepRoute: true }));
navigationVoice?.addEventListener("click", () => {
  navigationVoiceEnabled = !navigationVoiceEnabled;
  navigationVoice.setAttribute("aria-pressed", String(navigationVoiceEnabled));
  navigationVoice.textContent = navigationVoiceEnabled ? "🔊 Voice on" : "🔇 Voice off";
  if (!navigationVoiceEnabled) window.speechSynthesis?.cancel();
});

routeClear?.addEventListener("click", () => clearRoute(false));
calloutClose?.addEventListener("click", closeCallout);
retryButton?.addEventListener("click", async () => {
  if (!window.L) {
    window.location.reload();
    return;
  }
  showMapUnavailable(true);
  await initializeMap();
});

document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".map-command-panel")) closeSuggestions();
});

let resizeFrame = null;
function handleViewportResize() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    map?.invalidateSize({ pan: false });
    scheduleCalloutPosition();
  });
}
window.addEventListener("resize", handleViewportResize);
window.visualViewport?.addEventListener("resize", handleViewportResize);

try {
  const [geojson, saved, capabilityData] = await Promise.all([
    getMapLocations(),
    getSavedPlaces().catch(() => []),
    getMapCapabilities().catch(() => null)
  ]);

  features = Array.isArray(geojson?.features)
    ? geojson.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          source: "ugotour",
          sourceLabel: "UgoTour Verified",
          verified: true
        }
      }))
    : [];
  savedKeys = new Set(saved.map((place) => `${place.placeType}:${Number(place.id)}`));
  if (capabilityData) capabilities = capabilityData;

  const mapReady = await initializeMap();
  setDiscoveryContext(null);
  if (mapReady) {
    focusFromUrl();
    if (!parseFocus()) await showPreviouslyGrantedLocation();
    if (capabilities.routingFallback) {
      showStatus("Map discovery and directions are ready. Add OPENROUTESERVICE_API_KEY later for production-grade mode-specific routing.");
    }
  }
} catch (error) {
  console.error("Could not load UgoTour map locations:", error);
  loadingState.textContent = error.message || "Could not load tourism locations.";
  showMapUnavailable();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function shortAreaName(value) {
  return String(value || "").split(",").slice(0, 2).join(",").trim();
}

function friendlyNearby(category) {
  return {
    attractions: "attractions",
    hotels: "places to stay",
    restaurants: "food spots",
    fuel: "fuel stations",
    hospitals: "health services",
    all: "places"
  }[category] || "places";
}

function formatDistance(meters) {
  const value = Number(meters || 0);
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)} km`;
}

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(Number(seconds || 0) / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
