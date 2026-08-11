import { renderNavbar } from "../components/navbar.js";
import { getMapLocations } from "../services/map-service.js";
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
const searchEmpty = document.getElementById("map-search-empty");
const loadingState = document.getElementById("map-loading-state");
const offlineState = document.getElementById("map-offline-state");
const retryButton = document.getElementById("map-retry-button");
const fitButton = document.getElementById("map-fit-uganda");
const callout = document.getElementById("map-place-callout");
const calloutClose = document.getElementById("map-place-panel-close");
const connector = document.getElementById("map-callout-connector");
const connectorLine = document.getElementById("map-callout-line");
const connectorEnd = document.getElementById("map-callout-end");
const placeImage = document.getElementById("map-place-image");
const placeType = document.getElementById("map-place-type");
const placeCategory = document.getElementById("map-place-category");
const placeName = document.getElementById("map-place-name");
const placeLocation = document.getElementById("map-place-location");
const placeDescription = document.getElementById("map-place-description");
const placeDetails = document.getElementById("map-place-details");
const placeSave = document.getElementById("map-place-save");

let map = null;
let boundaryLayer = null;
let features = [];
let selectedFeature = null;
let selectedKey = null;
let positionFrame = null;
const markerByKey = new Map();
let savedKeys = new Set();

function featureKey(feature) {
  return `${feature.properties.placeType}:${Number(feature.properties.id)}`;
}

function searchableText(feature) {
  const p = feature.properties;
  return [p.name, p.category, p.region, p.district, p.destinationName, p.description, p.highlight]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function createMarkerIcon(feature, isActive = false) {
  const isDestination = feature.properties.placeType === "destination";
  const size = isDestination ? [34, 44] : [29, 38];
  const activeClass = isActive ? " is-active" : "";
  const typeClass = isDestination ? "is-destination" : "is-attraction";

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

  try {
    const response = await fetch("../data/uganda-boundary.geojson");
    if (response.ok) {
      const boundary = await response.json();
      boundaryLayer = window.L.geoJSON(boundary, {
        interactive: false,
        style: {
          color: "#355c35",
          weight: 1.7,
          opacity: 0.75,
          fillColor: "#76936f",
          fillOpacity: 0.035
        }
      }).addTo(map);
    }
  } catch (error) {
    console.warn("Uganda boundary could not load:", error);
  }

  buildMarkers();
  fitUganda();

  map.on("move zoom resize", scheduleCalloutPosition);
  map.on("click", (event) => {
    if (event.originalEvent?.target?.closest?.(".leaflet-marker-icon")) return;
    closeCallout();
  });

  return true;
}

function showMapUnavailable(recreate = false) {
  loadingState.hidden = true;
  offlineState.hidden = false;
  if (recreate && map) {
    map.remove();
    map = null;
    boundaryLayer = null;
    markerByKey.clear();
  }
}

function buildMarkers() {
  if (!map) return;
  markerByKey.clear();

  features.forEach((feature) => {
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
    marker.addTo(map);
    markerByKey.set(featureKey(feature), marker);
  });
}

function setMarkerActive(key, active) {
  if (!key) return;
  const marker = markerByKey.get(key);
  if (!marker?.feature) return;
  marker.setIcon(createMarkerIcon(marker.feature, active));
  if (active) marker.setZIndexOffset(1000);
  else marker.setZIndexOffset(0);
}

function detailsHref(feature) {
  const p = feature.properties;
  if (p.placeType === "destination") {
    return `./destination-details.html?id=${Number(p.id)}`;
  }
  if (p.destinationId) {
    return `./destination-details.html?id=${Number(p.destinationId)}`;
  }
  // Independent attractions do not have a parent destination, so the same
  // Destination Details page renders them in a standalone attraction mode.
  return `./destination-details.html?attraction=${Number(p.id)}`;
}

function selectFeature(feature, { focusMap = false } = {}) {
  const key = featureKey(feature);
  if (selectedKey && selectedKey !== key) setMarkerActive(selectedKey, false);

  selectedFeature = feature;
  selectedKey = key;
  setMarkerActive(key, true);

  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;

  placeImage.src = resolveAssetPath(p.imageUrl, "..");
  placeImage.alt = `${p.name} tourism image`;
  placeType.textContent = p.placeType === "destination" ? "Destination" : "Attraction";
  placeCategory.textContent = p.category || "Tourism";
  placeName.textContent = p.name;
  placeLocation.textContent = [p.district, p.region].filter(Boolean).join(" · ") || "Uganda";
  placeDescription.textContent = p.description || p.highlight || "Explore this tourism location in Uganda.";

  const href = detailsHref(feature);
  placeDetails.hidden = !href;
  if (href) {
    placeDetails.href = href;
    placeDetails.textContent = "View details →";
  }

  if (placeSave) {
    const saved = savedKeys.has(key);
    placeSave.textContent = saved ? "♥ Saved" : "♡ Save";
    placeSave.setAttribute("aria-pressed", String(saved));
    placeSave.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${p.name}`);
  }

  callout.hidden = false;
  connector.classList.add("is-visible");

  if (focusMap && map) {
    const targetZoom = p.placeType === "destination" ? 10 : 12;
    map.flyTo([latitude, longitude], targetZoom, { duration: 0.72 });
    map.once("moveend", scheduleCalloutPosition);
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

  let left;
  let top;
  let endX;
  let endY;

  if (compact) {
    left = Math.max(12, (mapSize.x - cardWidth) / 2);
    top = Math.max(112, mapSize.y - cardHeight - 84);
    endX = clamp(markerPoint.x, left + 24, left + cardWidth - 24);
    endY = top;
  } else {
    const gap = 48;
    const rightFits = markerPoint.x + gap + cardWidth <= mapSize.x - 24;
    left = rightFits ? markerPoint.x + gap : markerPoint.x - gap - cardWidth;
    left = clamp(left, 24, mapSize.x - cardWidth - 24);
    top = clamp(markerPoint.y - cardHeight / 2, 174, mapSize.y - cardHeight - 34);
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
}

function fitUganda() {
  if (!map) return;
  closeSuggestions();
  if (boundaryLayer) {
    map.fitBounds(boundaryLayer.getBounds(), { paddingTopLeft: [38, 110], paddingBottomRight: [38, 46] });
  } else {
    map.fitBounds(UGANDA_BOUNDS, { paddingTopLeft: [38, 110], paddingBottomRight: [38, 46] });
  }
  scheduleCalloutPosition();
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
  const matches = getSearchMatches(query).slice(0, 6);
  suggestions.innerHTML = "";
  searchEmpty.hidden = true;

  if (!query.trim()) {
    closeSuggestions();
    return;
  }

  if (matches.length === 0) {
    suggestions.hidden = true;
    searchEmpty.hidden = false;
    window.setTimeout(() => { searchEmpty.hidden = true; }, 1800);
    return;
  }

  matches.forEach((feature) => {
    const p = feature.properties;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-suggestion";
    button.innerHTML = `
      <span class="map-suggestion-pin ${p.placeType === "destination" ? "is-destination" : "is-attraction"}"></span>
      <span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml([p.category, p.district || p.region].filter(Boolean).join(" · "))}</small></span>
    `;
    button.addEventListener("click", () => chooseSearchResult(feature));
    suggestions.appendChild(button);
  });

  suggestions.hidden = false;
}

function chooseSearchResult(feature) {
  searchInput.value = feature.properties.name;
  searchClear.hidden = false;
  closeSuggestions();
  selectFeature(feature, { focusMap: true });
}

function closeSuggestions() {
  suggestions.hidden = true;
  suggestions.innerHTML = "";
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
  if (feature) window.setTimeout(() => selectFeature(feature, { focusMap: true }), 280);
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
  const match = getSearchMatches(searchInput.value)[0];
  if (match) chooseSearchResult(match);
  else {
    closeSuggestions();
    searchEmpty.hidden = false;
    window.setTimeout(() => { searchEmpty.hidden = true; }, 1800);
  }
});

searchClear?.addEventListener("click", () => {
  searchInput.value = "";
  searchClear.hidden = true;
  searchEmpty.hidden = true;
  closeSuggestions();
  closeCallout();
  fitUganda();
  searchInput.focus();
});

fitButton?.addEventListener("click", fitUganda);

placeSave?.addEventListener("click", async () => {
  if (!selectedFeature || placeSave.disabled) return;
  const key = featureKey(selectedFeature);
  const p = selectedFeature.properties;
  const currentSaved = savedKeys.has(key);
  placeSave.disabled = true;
  try {
    const next = await toggleSavedPlace(p.placeType, p.id, currentSaved);
    if (next) savedKeys.add(key); else savedKeys.delete(key);
    placeSave.textContent = next ? "♥ Saved" : "♡ Save";
    placeSave.setAttribute("aria-pressed", String(next));
  } catch (error) { console.error("Could not update saved place:", error); }
  finally { placeSave.disabled = false; }
});
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
  if (!event.target.closest(".map-search-dock")) closeSuggestions();
});

window.addEventListener("resize", scheduleCalloutPosition);

try {
  const geojson = await getMapLocations();
  features = Array.isArray(geojson?.features) ? geojson.features : [];
  const saved = await getSavedPlaces().catch(() => []);
  savedKeys = new Set(saved.map((place) => `${place.placeType}:${Number(place.id)}`));
  const mapReady = await initializeMap();
  if (mapReady) focusFromUrl();
} catch (error) {
  console.error("Could not load UgoTour map locations:", error);
  loadingState.textContent = error.message || "Could not load tourism locations.";
  showMapUnavailable();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
