import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createDestinationCard } from "../components/destination-card.js";
import { getAllDestinations, getDestinationCategories } from "../services/destination-service.js";
import { getAllAttractions } from "../services/attraction-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { resolveAssetPath } from "../utils/assets.js";
import { getSavedPlaces, toggleSavedPlace } from "../services/saved-service.js";

const currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const destinationList = document.getElementById("destination-list");
const searchInput = document.getElementById("catalog-search-input");
const categoryFilters = document.getElementById("category-filters");
const emptyState = document.getElementById("destination-empty-state");
const resetButton = document.getElementById("reset-filters");
const carouselPrevious = document.getElementById("destination-carousel-previous");
const carouselNext = document.getElementById("destination-carousel-next");
const carouselStatus = document.getElementById("destination-carousel-status");
const filterToggle = document.getElementById("destination-filter-toggle");
const searchToggle = document.getElementById("destination-search-toggle");
const filterLabel = document.getElementById("destination-filter-label");
const filterOverlay = document.getElementById("destination-filter-overlay");
const filterPanel = document.getElementById("destination-filter-panel");
const filterClose = document.getElementById("destination-filter-close");
const filterApply = document.getElementById("destination-filter-apply");
const sectionKicker = document.getElementById("destination-section-kicker");
const pageParams = new URLSearchParams(window.location.search);
const pageQuery = pageParams.get("q")?.trim() ?? "";
const resultsRequested = pageParams.get("results") === "1";
const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
const isReload = navigationEntry?.type === "reload";
const initialSearchMode = !isReload && Boolean(pageQuery || resultsRequested);

let destinations = [];
let attractions = [];
let categories = [];
let savedKeys = new Set();
let carouselIndex = 0;
let carouselItemCount = 0;
let carouselCycleWidth = 0;
let carouselTimer = 0;
let carouselPanelOpen = false;
let carouselInteractionPauseUntil = 0;
let carouselResizeTimer = 0;
let filterReturnFocus = null;
let resultsMode = initialSearchMode; // Home/mood searches enter list mode; a refresh restores discovery carousel.
const reduceCarouselMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const initialSearchTerm = initialSearchMode ? pageQuery : "";
const catalogState = { searchTerm: initialSearchTerm, category: "All" };
const draftState = { searchTerm: initialSearchTerm, category: "All" };
if (searchInput && initialSearchTerm) searchInput.value = initialSearchTerm;

// Search state is intentionally session-scoped. After arriving from Home/mood
// search, remove the query string so a browser refresh restores the default
// animated discovery carousel exactly as designed.
if (pageQuery || resultsRequested) {
  window.history.replaceState(window.history.state, "", window.location.pathname);
}

function matchesSearch(place, term = catalogState.searchTerm) {
  const normalizedSearch = String(term || "").toLowerCase();
  if (!normalizedSearch) return true;
  return [place.name, place.category, place.region, place.district, place.destinationName, place.description, place.highlight, place.bestFor]
    .filter(Boolean).join(" ").toLowerCase().includes(normalizedSearch);
}
function matchesCategory(place, category = catalogState.category) {
  return category === "All" || place.category === category;
}
function getFilteredPlaces() {
  const destinationItems = destinations
    .filter((place) => matchesCategory(place) && matchesSearch(place))
    .map((place) => ({ type: "destination", place }));
  const attractionItems = attractions
    .filter((place) => matchesCategory(place) && matchesSearch(place))
    .map((place) => ({ type: "attraction", place }));
  return [...destinationItems, ...attractionItems];
}

function renderCategoryFilters() {
  if (!categoryFilters) return;
  categoryFilters.innerHTML = "";
  ["All", ...categories].forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-filter-button${category === draftState.category ? " is-active" : ""}`;
    button.dataset.category = category;
    button.textContent = category;
    categoryFilters.appendChild(button);
  });
}

function syncSaveButtons(type, id, saved) {
  const key = `${type}:${Number(id)}`;
  destinationList?.querySelectorAll(`[data-place-key="${key}"] .place-save-button`).forEach((button) => {
    button.textContent = saved ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(saved));
    const name = button.closest("[data-place-name]")?.dataset.placeName || "place";
    button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${name}`);
  });
}

function createDestinationDiscoveryCard(destination, index) {
  const key = `destination:${Number(destination.id)}`;
  const card = createDestinationCard(destination, {
    linkUrl: `./map.html?focus=destination:${Number(destination.id)}`,
    assetBasePath: "..",
    showSaveButton: true,
    saved: savedKeys.has(key),
    onToggleSave: async (_item, currentSaved) => {
      const next = await toggleSavedPlace("destination", destination.id, currentSaved);
      if (next) savedKeys.add(key); else savedKeys.delete(key);
      syncSaveButtons("destination", destination.id, next);
      return next;
    }
  });
  card.style.setProperty("--card-order", String(index));
  card.dataset.placeKey = key;
  card.dataset.placeName = destination.name;
  card.classList.add("destination-carousel-item", "destination-carousel-destination");
  return card;
}

function createAttractionDiscoveryCard(attraction, index) {
  const shell = document.createElement("article");
  shell.className = "attraction-discovery-card attraction-discovery-card-saveable destination-carousel-item destination-carousel-attraction";
  shell.style.setProperty("--card-order", String(index));
  shell.dataset.attractionId = attraction.id;
  const imageUrl = resolveAssetPath(attraction.imageUrl, "..");
  const parentLabel = attraction.destinationName ? `Near ${attraction.destinationName}` : (attraction.district || attraction.region || "Uganda");
  const key = `attraction:${Number(attraction.id)}`;
  const isSaved = savedKeys.has(key);
  shell.dataset.placeKey = key;
  shell.dataset.placeName = attraction.name;
  shell.innerHTML = `
    <a class="attraction-discovery-anchor" href="./map.html?focus=attraction:${Number(attraction.id)}" aria-label="Find ${escapeAttribute(attraction.name)} on the Uganda map">
      <div class="attraction-discovery-media"><img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(attraction.name)}" loading="lazy" decoding="async" /><span class="attraction-discovery-type">${escapeHtml(attraction.category || "Attraction")}</span></div>
      <div class="attraction-discovery-copy"><p>${escapeHtml(parentLabel)}</p><h3>${escapeHtml(attraction.name)}</h3><span>${escapeHtml(attraction.description || attraction.highlight || "Explore this place in Uganda.")}</span><strong>Find on map <span aria-hidden="true">→</span></strong></div>
    </a>
    <button class="place-save-button" type="button" aria-pressed="${isSaved}" aria-label="${isSaved ? "Remove" : "Save"} ${escapeAttribute(attraction.name)}">${isSaved ? "♥" : "♡"}</button>`;
  shell.querySelector(".place-save-button")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    try {
      const currentSaved = button.getAttribute("aria-pressed") === "true";
      const next = await toggleSavedPlace("attraction", attraction.id, currentSaved);
      if (next) savedKeys.add(key); else savedKeys.delete(key);
      syncSaveButtons("attraction", attraction.id, next);
    } finally { button.disabled = false; }
  });
  return shell;
}

function prepareLoopCard(card, cycle, index, total, name) {
  card.dataset.carouselCycle = cycle;
  card.dataset.logicalIndex = String(index);
  if (cycle === "original") {
    card.setAttribute("role", "group");
    card.setAttribute("aria-roledescription", "slide");
    card.setAttribute("aria-label", `${index + 1} of ${total}: ${name}`);
    return card;
  }
  card.dataset.loopClone = "true";
  card.setAttribute("aria-hidden", "true");
  card.inert = true;
  card.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach((control) => control.setAttribute("tabindex", "-1"));
  return card;
}

function createPlaceCard(item, index) {
  return item.type === "destination" ? createDestinationDiscoveryCard(item.place, index) : createAttractionDiscoveryCard(item.place, index);
}

function renderPlaces() {
  if (!destinationList) return [];
  const filteredPlaces = getFilteredPlaces();
  destinationList.innerHTML = "";
  carouselItemCount = filteredPlaces.length;

  if (resultsMode) {
    stopCarouselRotation();
    document.body.classList.add("destination-results-mode");
    filteredPlaces.forEach((item, index) => destinationList.appendChild(createPlaceCard(item, index)));
    if (carouselStatus) carouselStatus.textContent = "Search results";
    if (sectionKicker) sectionKicker.textContent = "Search results";
  } else {
    document.body.classList.remove("destination-results-mode");
    if (sectionKicker) sectionKicker.textContent = "One continuous collection";
    ["before", "original", "after"].forEach((cycle) => {
      filteredPlaces.forEach((item, index) => {
        destinationList.appendChild(prepareLoopCard(createPlaceCard(item, index), cycle, index, filteredPlaces.length, item.place.name));
      });
    });
    carouselIndex = 0;
    requestAnimationFrame(initializeCarouselLoop);
  }

  destinationList.hidden = filteredPlaces.length === 0;
  if (emptyState) emptyState.hidden = filteredPlaces.length !== 0;
  updateFilterToggle();
  return filteredPlaces;
}

function carouselCards() { return [...(destinationList?.querySelectorAll(".destination-carousel-item") || [])]; }
function carouselStep() {
  const cards = carouselCards();
  if (cards.length < 2) return 0;
  return cards[1].offsetLeft - cards[0].offsetLeft;
}
function visibleCarouselCards() {
  const step = carouselStep();
  return destinationList && step ? Math.max(1, Math.floor(destinationList.clientWidth / step)) : 1;
}
function initializeCarouselLoop() {
  if (resultsMode || !destinationList || !carouselItemCount) {
    carouselCycleWidth = 0;
    updateCarouselStatus();
    return;
  }
  const cards = carouselCards();
  if (cards.length < carouselItemCount * 2) return;
  carouselCycleWidth = cards[carouselItemCount].offsetLeft - cards[0].offsetLeft;
  const step = carouselStep();
  destinationList.scrollLeft = carouselCycleWidth + (carouselIndex * step);
  normalizeCarouselPosition();
  updateCarouselStatus();
  startCarouselRotation();
}
function normalizeCarouselPosition() {
  if (resultsMode || !destinationList || !carouselCycleWidth) return;
  const maximumScroll = destinationList.scrollWidth - destinationList.clientWidth;
  if (maximumScroll <= carouselCycleWidth) return;
  if (destinationList.scrollLeft >= carouselCycleWidth * 2) destinationList.scrollLeft -= carouselCycleWidth;
  else if (destinationList.scrollLeft < carouselCycleWidth) destinationList.scrollLeft += carouselCycleWidth;
}
function updateCarouselStatus() {
  if (!carouselItemCount) {
    if (carouselStatus) carouselStatus.textContent = "No matching places";
    if (carouselPrevious) carouselPrevious.disabled = true;
    if (carouselNext) carouselNext.disabled = true;
    return;
  }
  if (resultsMode) {
    if (carouselPrevious) carouselPrevious.disabled = true;
    if (carouselNext) carouselNext.disabled = true;
    return;
  }
  const step = carouselStep();
  const localOffset = carouselCycleWidth && step ? (destinationList.scrollLeft - carouselCycleWidth) / step : 0;
  carouselIndex = ((Math.round(localOffset) % carouselItemCount) + carouselItemCount) % carouselItemCount;
  if (carouselStatus) carouselStatus.textContent = `Place ${carouselIndex + 1} of ${carouselItemCount} · continuous loop`;
  if (carouselPrevious) carouselPrevious.disabled = carouselItemCount < 2;
  if (carouselNext) carouselNext.disabled = carouselItemCount < 2;
}
function moveCarousel(direction) {
  if (resultsMode || !destinationList || carouselItemCount < 2) return;
  carouselInteractionPauseUntil = performance.now() + 2400;
  destinationList.scrollBy({ left: carouselStep() * visibleCarouselCards() * direction, behavior: reduceCarouselMotion.matches ? "auto" : "smooth" });
  window.setTimeout(() => { normalizeCarouselPosition(); updateCarouselStatus(); }, reduceCarouselMotion.matches ? 0 : 520);
}
function rotateCarouselStep() {
  if (resultsMode) return;
  const timestamp = performance.now();
  if (destinationList && carouselItemCount > 1 && !reduceCarouselMotion.matches && !document.hidden && !destinationList.matches(":hover") && !destinationList.contains(document.activeElement) && !carouselPanelOpen && timestamp >= carouselInteractionPauseUntil) {
    destinationList.scrollLeft += 0.55;
    normalizeCarouselPosition();
    updateCarouselStatus();
  }
}
function stopCarouselRotation() {
  if (carouselTimer) window.clearInterval(carouselTimer);
  carouselTimer = 0;
}
function startCarouselRotation() {
  if (resultsMode || carouselTimer) return;
  carouselTimer = window.setInterval(rotateCarouselStep, 20);
}

function updateFilterToggle() {
  const activeCount = Number(Boolean(catalogState.searchTerm)) + Number(catalogState.category !== "All");
  if (filterLabel) filterLabel.textContent = activeCount ? `Filters (${activeCount})` : "Filters";
  filterToggle?.classList.toggle("has-active-filters", activeCount > 0);
}

function openFilters({ focusSearch = false } = {}) {
  if (!filterOverlay || !filterPanel || carouselPanelOpen) return;
  filterReturnFocus = document.activeElement;
  draftState.searchTerm = catalogState.searchTerm;
  draftState.category = catalogState.category;
  if (searchInput) searchInput.value = draftState.searchTerm;
  renderCategoryFilters();
  carouselPanelOpen = true;
  filterOverlay.hidden = false;
  filterOverlay.setAttribute("aria-hidden", "false");
  filterToggle?.setAttribute("aria-expanded", "true");
  document.body.classList.add("destination-filters-open");
  requestAnimationFrame(() => (focusSearch ? searchInput : filterPanel)?.focus());
}
function closeFilters() {
  if (!filterOverlay) return;
  carouselPanelOpen = false;
  filterOverlay.hidden = true;
  filterOverlay.setAttribute("aria-hidden", "true");
  filterToggle?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("destination-filters-open");
  if (filterReturnFocus instanceof HTMLElement) filterReturnFocus.focus();
}
function applyDraftAndShowPlaces() {
  catalogState.searchTerm = draftState.searchTerm.trim();
  catalogState.category = draftState.category;
  resultsMode = true;
  stopCarouselRotation();
  renderPlaces();
  closeFilters();
}
function handleFilterDialogKeydown(event) {
  if (!carouselPanelOpen || !filterPanel) return;
  if (event.key === "Escape") { event.preventDefault(); closeFilters(); return; }
  if (event.key !== "Tab") return;
  const focusable = [...filterPanel.querySelectorAll("button:not(:disabled), input:not(:disabled), summary, [href], [tabindex]:not([tabindex='-1'])")].filter((element) => !element.closest("[hidden]"));
  if (!focusable.length) return;
  const first = focusable[0]; const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

async function loadCatalog() {
  try {
    const [destinationData, attractionData, savedData] = await Promise.all([getAllDestinations(), getAllAttractions(), getSavedPlaces().catch(() => [])]);
    destinations = destinationData;
    attractions = attractionData;
    savedKeys = new Set(savedData.map((place) => `${place.placeType}:${Number(place.id)}`));
    categories = [...new Set([...getDestinationCategories(destinations), ...attractions.map((item) => item.category).filter(Boolean)])].sort((a,b) => a.localeCompare(b));
    renderCategoryFilters();
    renderPlaces();
  } catch (error) {
    console.error("Could not load tourism library:", error);
    if (destinationList) destinationList.hidden = true;
    if (emptyState) { emptyState.hidden = false; const message = emptyState.querySelector("p"); if (message) message.textContent = "Start the Node.js backend, then refresh this page."; }
  }
}

searchInput?.addEventListener("input", (event) => { draftState.searchTerm = event.target.value; });
searchInput?.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); applyDraftAndShowPlaces(); } });
categoryFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  draftState.category = button.dataset.category;
  renderCategoryFilters();
});
resetButton?.addEventListener("click", () => {
  draftState.searchTerm = "";
  draftState.category = "All";
  if (searchInput) searchInput.value = "";
  renderCategoryFilters();
});
filterApply?.addEventListener("click", applyDraftAndShowPlaces);
searchToggle?.addEventListener("click", () => openFilters({ focusSearch: true }));
filterToggle?.addEventListener("click", () => openFilters({ focusSearch: false }));
filterClose?.addEventListener("click", closeFilters);
filterOverlay?.querySelectorAll("[data-filter-cancel]").forEach((control) => control.addEventListener("click", closeFilters));
document.addEventListener("keydown", handleFilterDialogKeydown);
carouselPrevious?.addEventListener("click", () => moveCarousel(-1));
carouselNext?.addEventListener("click", () => moveCarousel(1));
destinationList?.addEventListener("scroll", () => { if (!resultsMode) { normalizeCarouselPosition(); updateCarouselStatus(); } }, { passive: true });
window.addEventListener("resize", () => {
  if (resultsMode) return;
  window.clearTimeout(carouselResizeTimer);
  carouselResizeTimer = window.setTimeout(initializeCarouselLoop, 160);
});
reduceCarouselMotion.addEventListener?.("change", () => { stopCarouselRotation(); startCarouselRotation(); });
window.addEventListener("beforeunload", stopCarouselRotation, { once: true });

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function escapeAttribute(value) { return escapeHtml(value); }

await loadCatalog();
