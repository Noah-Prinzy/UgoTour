import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getMapLocations } from "../services/map-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { resolveAssetPath } from "../utils/assets.js";

const currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const UGANDA_BOUNDS = [[-1.55, 29.45], [4.35, 35.10]];
const UGANDA_CENTER = [1.3733, 32.2903];
const TILE_URL = window.UGOTOUR_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = window.UGOTOUR_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const searchInput = document.getElementById("map-search-input");
const typeFilters = document.getElementById("map-type-filters");
const categoryFilter = document.getElementById("map-category-filter");
const regionFilter = document.getElementById("map-region-filter");
const resetButton = document.getElementById("map-reset-filters");
const resultsList = document.getElementById("map-results-list");
const resultCount = document.getElementById("map-result-count");
const emptyState = document.getElementById("map-empty-state");
const loadingState = document.getElementById("map-loading-state");
const offlineState = document.getElementById("map-offline-state");
const retryButton = document.getElementById("map-retry-button");
const fitButton = document.getElementById("map-fit-uganda");
const destinationCount = document.getElementById("map-destination-count");
const attractionCount = document.getElementById("map-attraction-count");
const placePanel = document.getElementById("map-place-panel");
const placePanelClose = document.getElementById("map-place-panel-close");
const placeImage = document.getElementById("map-place-image");
const placeType = document.getElementById("map-place-type");
const placeCategory = document.getElementById("map-place-category");
const placeName = document.getElementById("map-place-name");
const placeLocation = document.getElementById("map-place-location");
const placeDescription = document.getElementById("map-place-description");
const placeHighlight = document.getElementById("map-place-highlight");
const placeDetails = document.getElementById("map-place-details");
const placeRecenter = document.getElementById("map-place-recenter");

let geojson = null;
let features = [];
let filteredFeatures = [];
let map = null;
let markerCluster = null;
let boundaryLayer = null;
let selectedFeature = null;
const markerByKey = new Map();

const state = {
  searchTerm: "",
  placeType: "all",
  category: "all",
  region: "all"
};

function featureKey(feature) {
  return `${feature.properties.placeType}:${Number(feature.properties.id)}`;
}

function cleanRegion(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/^(Central|Western|Eastern|Northern)/i);
  return match ? `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} Uganda` : text || "Other";
}

function searchableText(feature) {
  const p = feature.properties;
  return [p.name, p.category, p.region, p.district, p.destinationName, p.description, p.highlight]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function populateSelect(select, values, firstLabel) {
  if (!select) return;
  select.innerHTML = `<option value="all">${firstLabel}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function setupFilters() {
  const categories = [...new Set(features.map((feature) => feature.properties.category).filter(Boolean))].sort();
  const regions = [...new Set(features.map((feature) => cleanRegion(feature.properties.region)).filter(Boolean))].sort();
  populateSelect(categoryFilter, categories, "All categories");
  populateSelect(regionFilter, regions, "All Uganda");
}

function getFilteredFeatures() {
  const query = state.searchTerm.trim().toLowerCase();
  return features.filter((feature) => {
    const p = feature.properties;
    if (state.placeType !== "all" && p.placeType !== state.placeType) return false;
    if (state.category !== "all" && p.category !== state.category) return false;
    if (state.region !== "all" && cleanRegion(p.region) !== state.region) return false;
    return !query || searchableText(feature).includes(query);
  });
}

function createMarkerIcon(feature) {
  const isDestination = feature.properties.placeType === "destination";
  const label = isDestination ? "D" : "A";
  return window.L.divIcon({
    className: "ugotour-marker-shell",
    html: `<span class="ugotour-marker ${isDestination ? "is-destination" : "is-attraction"}" aria-hidden="true"><b>${label}</b></span>`,
    iconSize: isDestination ? [42, 42] : [34, 34],
    iconAnchor: isDestination ? [21, 21] : [17, 17]
  });
}

function createClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const destinationMarkers = markers.filter((marker) => marker.feature?.properties?.placeType === "destination").length;
  return window.L.divIcon({
    className: "ugotour-cluster-shell",
    html: `<span class="ugotour-cluster"><strong>${cluster.getChildCount()}</strong><small>${destinationMarkers ? `${destinationMarkers}D` : "places"}</small></span>`,
    iconSize: [52, 52],
    iconAnchor: [26, 26]
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
    maxBoundsViscosity: 0.65
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

  markerCluster = window.L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 54,
    iconCreateFunction: createClusterIcon
  });
  map.addLayer(markerCluster);

  try {
    const response = await fetch("../data/uganda-boundary.geojson");
    if (response.ok) {
      const boundary = await response.json();
      boundaryLayer = window.L.geoJSON(boundary, {
        interactive: false,
        style: {
          color: "#314d2d",
          weight: 1.6,
          opacity: 0.82,
          fillColor: "#8fa081",
          fillOpacity: 0.055
        }
      }).addTo(map);
    }
  } catch (error) {
    console.warn("Uganda boundary could not load:", error);
  }

  buildMarkers();
  fitUganda();
  return true;
}

function showMapUnavailable(recreate = false) {
  loadingState.hidden = true;
  offlineState.hidden = false;
  if (recreate && map) {
    map.remove();
    map = null;
    markerCluster = null;
    markerByKey.clear();
  }
}

function buildMarkers() {
  if (!map || !markerCluster) return;
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
    marker.on("click", () => selectFeature(feature, { recenter: false, fromMarker: true }));
    markerByKey.set(featureKey(feature), marker);
  });

  updateMapMarkers();
}

function updateMapMarkers() {
  if (!markerCluster) return;
  markerCluster.clearLayers();
  filteredFeatures.forEach((feature) => {
    const marker = markerByKey.get(featureKey(feature));
    if (marker) markerCluster.addLayer(marker);
  });
}

function renderResults() {
  if (!resultsList || !emptyState) return;
  resultsList.innerHTML = "";
  resultCount.textContent = String(filteredFeatures.length);
  emptyState.hidden = filteredFeatures.length !== 0;

  filteredFeatures.forEach((feature) => {
    const p = feature.properties;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-result-card${selectedFeature && featureKey(selectedFeature) === featureKey(feature) ? " is-selected" : ""}`;
    button.dataset.featureKey = featureKey(feature);
    button.innerHTML = `
      <img src="${escapeAttribute(resolveAssetPath(p.imageUrl, ".."))}" alt="" />
      <span class="map-result-copy">
        <span class="map-result-topline"><small>${escapeHtml(p.placeType === "destination" ? "Destination" : "Attraction")}</small><small>${escapeHtml(p.category)}</small></span>
        <strong>${escapeHtml(p.name)}</strong>
        <span>${escapeHtml(p.district || p.region || "Uganda")}</span>
      </span>
      <span class="map-result-arrow" aria-hidden="true">↗</span>
    `;
    button.addEventListener("click", () => selectFeature(feature, { recenter: true }));
    resultsList.appendChild(button);
  });
}

function updateFiltersAndResults({ keepSelection = true } = {}) {
  filteredFeatures = getFilteredFeatures();
  if (selectedFeature && !filteredFeatures.some((feature) => featureKey(feature) === featureKey(selectedFeature))) {
    if (!keepSelection) closePlacePanel();
  }
  updateMapMarkers();
  renderResults();
}

function detailsHref(feature) {
  const p = feature.properties;
  if (p.placeType === "destination") {
    return `./destination-details.html?id=${Number(p.id)}`;
  }
  if (p.destinationId) {
    return `./destination-details.html?id=${Number(p.destinationId)}&attraction=${Number(p.id)}`;
  }
  return "";
}

function selectFeature(feature, { recenter = true, fromMarker = false } = {}) {
  selectedFeature = feature;
  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;

  placePanel.hidden = false;
  placeImage.src = resolveAssetPath(p.imageUrl, "..");
  placeImage.alt = `${p.name} tourism image`;
  placeType.textContent = p.placeType === "destination" ? "Major destination" : "Attraction";
  placeCategory.textContent = p.category || "Tourism";
  placeName.textContent = p.name;
  placeLocation.textContent = [p.district, p.region].filter(Boolean).join(" · ");
  placeDescription.textContent = p.description || "Explore this Uganda tourism location.";
  placeHighlight.textContent = p.highlight || "";

  const href = detailsHref(feature);
  placeDetails.hidden = !href;
  if (href) {
    placeDetails.href = href;
    placeDetails.textContent = p.placeType === "destination" ? "View destination" : `Explore ${p.destinationName || "destination"}`;
  }

  placeRecenter.onclick = () => map?.flyTo([latitude, longitude], p.placeType === "destination" ? 10 : 12, { duration: 0.7 });

  resultsList?.querySelectorAll(".map-result-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.featureKey === featureKey(feature));
  });

  if (recenter && map) {
    const marker = markerByKey.get(featureKey(feature));
    if (markerCluster && marker && markerCluster.hasLayer(marker)) {
      markerCluster.zoomToShowLayer(marker, () => {
        map.flyTo([latitude, longitude], p.placeType === "destination" ? 10 : 12, { duration: 0.7 });
      });
    } else {
      map.flyTo([latitude, longitude], p.placeType === "destination" ? 10 : 12, { duration: 0.7 });
    }
  }

  if (!fromMarker && window.innerWidth <= 760) {
    placePanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function closePlacePanel() {
  selectedFeature = null;
  placePanel.hidden = true;
  resultsList?.querySelectorAll(".map-result-card").forEach((card) => card.classList.remove("is-selected"));
}

function fitUganda() {
  if (!map) return;
  if (boundaryLayer) {
    map.fitBounds(boundaryLayer.getBounds(), { padding: [26, 26] });
  } else {
    map.fitBounds(UGANDA_BOUNDS, { padding: [24, 24] });
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
  if (feature) window.setTimeout(() => selectFeature(feature, { recenter: true }), 320);
}

searchInput?.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  updateFiltersAndResults({ keepSelection: false });
});

typeFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-type]");
  if (!button) return;
  state.placeType = button.dataset.type;
  typeFilters.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
  updateFiltersAndResults({ keepSelection: false });
});

categoryFilter?.addEventListener("change", (event) => {
  state.category = event.target.value;
  updateFiltersAndResults({ keepSelection: false });
});

regionFilter?.addEventListener("change", (event) => {
  state.region = event.target.value;
  updateFiltersAndResults({ keepSelection: false });
});

resetButton?.addEventListener("click", () => {
  state.searchTerm = "";
  state.placeType = "all";
  state.category = "all";
  state.region = "all";
  if (searchInput) searchInput.value = "";
  if (categoryFilter) categoryFilter.value = "all";
  if (regionFilter) regionFilter.value = "all";
  typeFilters?.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button.dataset.type === "all"));
  closePlacePanel();
  updateFiltersAndResults();
  fitUganda();
});

fitButton?.addEventListener("click", fitUganda);
placePanelClose?.addEventListener("click", closePlacePanel);
retryButton?.addEventListener("click", async () => {
  if (!window.L) {
    window.location.reload();
    return;
  }
  showMapUnavailable(true);
  await initializeMap();
});

try {
  geojson = await getMapLocations();
  features = Array.isArray(geojson?.features) ? geojson.features : [];
  filteredFeatures = features;
  destinationCount.textContent = String(geojson?.meta?.destinations ?? features.filter((f) => f.properties.placeType === "destination").length);
  attractionCount.textContent = String(geojson?.meta?.attractions ?? features.filter((f) => f.properties.placeType === "attraction").length);
  setupFilters();
  renderResults();
  const mapReady = await initializeMap();
  if (mapReady) focusFromUrl();
} catch (error) {
  console.error("Could not load UgoTour map locations:", error);
  loadingState.textContent = error.message || "Could not load tourism locations.";
  showMapUnavailable();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
