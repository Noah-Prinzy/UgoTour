/* ============================================================
   UgoTour Phase 1.22 — Map interaction polish
   ------------------------------------------------------------
   This module deliberately layers on top of map.js instead of duplicating its
   map/search/routing business logic. It keeps the existing location button and
   search suggestions, then improves their placement and presentation.
   ============================================================ */

const mapStage = document.querySelector(".map-stage");
const mapElement = document.getElementById("uganda-map");
const input = document.getElementById("map-search-input");
const suggestions = document.getElementById("map-search-suggestions");
const locateButton = document.getElementById("map-locate-me");
const callout = document.getElementById("map-place-callout");
const connector = document.getElementById("map-callout-connector");
const connectorLine = document.getElementById("map-callout-line");
const connectorLineShadow = document.getElementById("map-callout-line-shadow");
const connectorStart = document.getElementById("map-callout-start");
const connectorEnd = document.getElementById("map-callout-end");

let controlPlacementTimer = null;
let suggestionTimer = null;
let connectorFrame = null;
let currentConnector = null;
let targetConnector = null;

function placeLocationBesideZoom() {
  if (!locateButton || locateButton.closest(".ugotour-location-control")) return true;
  const zoomControl = document.querySelector("#uganda-map .leaflet-control-zoom");
  const corner = zoomControl?.parentElement;
  if (!zoomControl || !corner) return false;

  const wrapper = document.createElement("div");
  wrapper.className = "leaflet-control ugotour-location-control";
  wrapper.setAttribute("aria-label", "Current location map control");
  wrapper.addEventListener("click", (event) => event.stopPropagation());
  wrapper.addEventListener("dblclick", (event) => event.stopPropagation());

  locateButton.classList.remove("map-inline-location-in-search");
  wrapper.appendChild(locateButton);
  corner.insertBefore(wrapper, zoomControl);
  return true;
}

function waitForLeafletControls() {
  if (placeLocationBesideZoom()) return;
  window.clearTimeout(controlPlacementTimer);
  controlPlacementTimer = window.setTimeout(waitForLeafletControls, 120);
}

function syncSuggestionAccessibility() {
  if (!input || !suggestions) return;
  input.setAttribute("aria-controls", "map-search-suggestions");
  input.setAttribute("aria-autocomplete", "list");
  const open = !suggestions.hidden && suggestions.childElementCount > 0;
  input.setAttribute("aria-expanded", String(open));
  suggestions.setAttribute("role", "listbox");
}

const commandMatchers = [
  { pattern: /\bhot(?:e|el|els)?|\blodg|\bstay/i, label: "Hotels near me" },
  { pattern: /\bfoo|\brest|\bcaf|\beat|\bdin/i, label: "Food near me" },
  { pattern: /\bfue|\bpet|\bgas|\bfill/i, label: "Fuel near me" },
  { pattern: /\bhos|\bhea|\bcli|\bmed|\bpharm/i, label: "Health services near me" },
  { pattern: /\battr|\bsite|\bvisit|\bthing/i, label: "Attractions near me" }
];

function commandSuggestionFor(query) {
  const clean = String(query || "").trim();
  if (clean.length < 2) return null;
  return commandMatchers.find((item) => item.pattern.test(clean))?.label || null;
}

function injectCommandSuggestion() {
  if (!input || !suggestions) return;
  suggestions.querySelectorAll("[data-ugotour-command-suggestion]").forEach((node) => node.remove());

  const label = commandSuggestionFor(input.value);
  if (!label || input.value.trim().toLowerCase() === label.toLowerCase()) {
    syncSuggestionAccessibility();
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-suggestion is-command-suggestion";
  button.dataset.ugotourCommandSuggestion = "true";
  button.setAttribute("role", "option");
  button.innerHTML = `
    <span class="map-suggestion-command-icon" aria-hidden="true">↗</span>
    <span><strong>${escapeHtml(label)}</strong><small>Quick nearby search using your current location</small></span>
  `;
  button.addEventListener("click", () => {
    input.value = label;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true
    }));
    input.focus({ preventScroll: true });
  });

  suggestions.prepend(button);
  suggestions.hidden = false;
  syncSuggestionAccessibility();
}

function scheduleSuggestionEnhancement() {
  window.clearTimeout(suggestionTimer);
  suggestionTimer = window.setTimeout(injectCommandSuggestion, 0);
}

function activeMarkerRect() {
  const pin = document.querySelector("#uganda-map .ugotour-map-pin.is-active");
  const marker = pin?.closest(".leaflet-marker-icon") || pin;
  return marker?.getBoundingClientRect?.() || null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function nearestCardEdge(marker, card) {
  const inset = 22;
  const leftDistance = Math.abs(marker.x - card.left);
  const rightDistance = Math.abs(marker.x - card.right);
  const topDistance = Math.abs(marker.y - card.top);
  const bottomDistance = Math.abs(marker.y - card.bottom);
  const smallest = Math.min(leftDistance, rightDistance, topDistance, bottomDistance);

  if (smallest === leftDistance) {
    return { x: card.left, y: clamp(marker.y, card.top + inset, card.bottom - inset) };
  }
  if (smallest === rightDistance) {
    return { x: card.right, y: clamp(marker.y, card.top + inset, card.bottom - inset) };
  }
  if (smallest === bottomDistance) {
    return { x: clamp(marker.x, card.left + inset, card.right - inset), y: card.bottom };
  }
  return { x: clamp(marker.x, card.left + inset, card.right - inset), y: card.top };
}

function measureConnector() {
  if (!mapStage || !callout || callout.hidden || !connector?.classList.contains("is-visible")) return null;
  const markerRect = activeMarkerRect();
  if (!markerRect) return null;

  const stageRect = mapStage.getBoundingClientRect();
  const cardRect = callout.getBoundingClientRect();
  const marker = {
    x: markerRect.left + markerRect.width / 2,
    y: markerRect.top + markerRect.height * .86
  };
  const card = {
    left: cardRect.left,
    right: cardRect.right,
    top: cardRect.top,
    bottom: cardRect.bottom
  };
  const markerUnderCard = marker.x >= card.left && marker.x <= card.right
    && marker.y >= card.top && marker.y <= card.bottom;
  if (markerUnderCard) return null;

  const edge = nearestCardEdge(marker, card);

  return {
    startX: marker.x - stageRect.left,
    startY: marker.y - stageRect.top,
    endX: edge.x - stageRect.left,
    endY: edge.y - stageRect.top
  };
}

function setConnectorGeometry(values) {
  if (!values || !connectorLine || !connectorStart || !connectorEnd) return;
  const dx = values.endX - values.startX;
  const dy = values.endY - values.startY;
  const length = Math.hypot(dx, dy);
  const bend = clamp(length * .12, 14, 54);
  const horizontalBias = Math.abs(dx) > Math.abs(dy);
  const controlX = (values.startX + values.endX) / 2 + (horizontalBias ? 0 : Math.sign(dx || 1) * bend);
  const controlY = (values.startY + values.endY) / 2 + (horizontalBias ? Math.sign(dy || 1) * bend : 0);
  const path = `M ${values.startX.toFixed(1)} ${values.startY.toFixed(1)} Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${values.endX.toFixed(1)} ${values.endY.toFixed(1)}`;

  connectorLine.setAttribute("d", path);
  connectorLineShadow?.setAttribute("d", path);
  connectorStart.setAttribute("cx", values.startX.toFixed(1));
  connectorStart.setAttribute("cy", values.startY.toFixed(1));
  connectorEnd.setAttribute("cx", values.endX.toFixed(1));
  connectorEnd.setAttribute("cy", values.endY.toFixed(1));
}

function interpolateConnector(current, target, amount) {
  if (!current) return { ...target };
  return {
    startX: current.startX + (target.startX - current.startX) * amount,
    startY: current.startY + (target.startY - current.startY) * amount,
    endX: current.endX + (target.endX - current.endX) * amount,
    endY: current.endY + (target.endY - current.endY) * amount
  };
}

function connectorDistance(a, b) {
  if (!a || !b) return Infinity;
  return Math.max(
    Math.abs(a.startX - b.startX),
    Math.abs(a.startY - b.startY),
    Math.abs(a.endX - b.endX),
    Math.abs(a.endY - b.endY)
  );
}

function runConnectorFrame() {
  connectorFrame = null;
  targetConnector = measureConnector();
  if (!targetConnector) {
    currentConnector = null;
    connectorLine?.setAttribute("d", "");
    connectorLineShadow?.setAttribute("d", "");
    connectorStart?.setAttribute("cx", "0");
    connectorStart?.setAttribute("cy", "0");
    connectorEnd?.setAttribute("cx", "0");
    connectorEnd?.setAttribute("cy", "0");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  currentConnector = reduceMotion
    ? { ...targetConnector }
    : interpolateConnector(currentConnector, targetConnector, .34);
  setConnectorGeometry(currentConnector);

  if (!reduceMotion && connectorDistance(currentConnector, targetConnector) > .45) {
    connectorFrame = requestAnimationFrame(runConnectorFrame);
  }
}

function scheduleConnectorSync() {
  if (connectorFrame) return;
  connectorFrame = requestAnimationFrame(runConnectorFrame);
}

function keepConnectorAliveBriefly() {
  let frames = 0;
  const tick = () => {
    scheduleConnectorSync();
    frames += 1;
    if (frames < 18) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

input?.addEventListener("input", scheduleSuggestionEnhancement);
input?.addEventListener("focus", scheduleSuggestionEnhancement);

suggestions && new MutationObserver(() => {
  syncSuggestionAccessibility();
}).observe(suggestions, { childList: true, attributes: true, attributeFilter: ["hidden"] });

callout && new MutationObserver(() => {
  currentConnector = null;
  keepConnectorAliveBriefly();
}).observe(callout, { attributes: true, attributeFilter: ["hidden", "style", "class"] });

const mapMutationTarget = document.querySelector("#uganda-map .leaflet-map-pane") || mapElement;
mapMutationTarget && new MutationObserver(scheduleConnectorSync).observe(mapMutationTarget, {
  subtree: true,
  attributes: true,
  attributeFilter: ["style", "class"]
});

if (window.ResizeObserver) {
  const resizeObserver = new ResizeObserver(() => {
    currentConnector = null;
    scheduleConnectorSync();
  });
  if (callout) resizeObserver.observe(callout);
  if (mapStage) resizeObserver.observe(mapStage);
}

["pointerdown", "pointermove", "pointerup", "wheel", "touchmove"].forEach((eventName) => {
  mapElement?.addEventListener(eventName, () => {
    scheduleConnectorSync();
    if (eventName === "pointerdown" || eventName === "wheel") keepConnectorAliveBriefly();
  }, { passive: true });
});

window.addEventListener("resize", () => {
  currentConnector = null;
  scheduleConnectorSync();
});
window.visualViewport?.addEventListener("resize", () => {
  currentConnector = null;
  scheduleConnectorSync();
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

waitForLeafletControls();
syncSuggestionAccessibility();
scheduleSuggestionEnhancement();
keepConnectorAliveBriefly();
