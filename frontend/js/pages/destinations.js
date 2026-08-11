import "../ui-motion.js";
// ============================================================
// DESTINATIONS + ATTRACTIONS DISCOVERY CONTROLLER - PHASE 8.11
// ============================================================
// Both major destinations and nested attractions are discoverable here.
// Cards deliberately route through the Map first so the user sees the place
// geographically before choosing "View details" from the map callout.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createDestinationCard } from "../components/destination-card.js";
import {
  getAllDestinations,
  getDestinationCategories
} from "../services/destination-service.js";
import { getAllAttractions } from "../services/attraction-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { getBookings } from "../services/booking-service.js";
import { resolveAssetPath } from "../utils/assets.js";

const currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const destinationList = document.getElementById("destination-list");
const attractionList = document.getElementById("attraction-list");
const searchInput = document.getElementById("catalog-search-input");
const categoryFilters = document.getElementById("category-filters");
const destinationSummary = document.getElementById("destination-summary");
const attractionSummary = document.getElementById("attraction-summary");
const emptyState = document.getElementById("destination-empty-state");
const resetButton = document.getElementById("reset-filters");
const catalogTotal = document.getElementById("catalog-total");
const journeyPanel = document.getElementById("journey-panel");
const journeyList = document.getElementById("journey-panel-list");
const pageQuery = new URLSearchParams(window.location.search).get("q")?.trim() ?? "";

let destinations = [];
let attractions = [];
let categories = [];

const catalogState = {
  searchTerm: pageQuery,
  category: "All"
};

if (searchInput && pageQuery) searchInput.value = pageQuery;

function renderCategoryFilters() {
  if (!categoryFilters) return;

  categoryFilters.innerHTML = "";
  const filterOptions = ["All", ...categories];

  filterOptions.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-filter-button";
    button.dataset.category = category;
    button.textContent = category;

    if (category === catalogState.category) button.classList.add("is-active");
    categoryFilters.appendChild(button);
  });
}

function matchesSearch(place) {
  const normalizedSearch = catalogState.searchTerm.toLowerCase();
  const searchableText = [
    place.name,
    place.category,
    place.region,
    place.district,
    place.destinationName,
    place.description,
    place.highlight,
    place.bestFor
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

function matchesCategory(place) {
  return catalogState.category === "All" || place.category === catalogState.category;
}

function getFilteredDestinations() {
  return destinations.filter((destination) => matchesCategory(destination) && matchesSearch(destination));
}

function getFilteredAttractions() {
  return attractions.filter((attraction) => matchesCategory(attraction) && matchesSearch(attraction));
}

function renderDestinations() {
  if (!destinationList) return [];
  const filteredDestinations = getFilteredDestinations();
  destinationList.innerHTML = "";

  filteredDestinations.forEach((destination, index) => {
    const card = createDestinationCard(destination, {
      linkUrl: `./map.html?focus=destination:${Number(destination.id)}`,
      assetBasePath: ".."
    });
    card.style.setProperty("--card-order", String(index));
    card.setAttribute("aria-label", `Find ${destination.name} on the Uganda map`);
    destinationList.appendChild(card);
  });

  if (destinationSummary) {
    destinationSummary.textContent = `${filteredDestinations.length} of ${destinations.length} destinations shown`;
  }
  destinationList.hidden = filteredDestinations.length === 0;
  return filteredDestinations;
}

function createAttractionDiscoveryCard(attraction, index) {
  const card = document.createElement("a");
  card.className = "attraction-discovery-card";
  card.href = `./map.html?focus=attraction:${Number(attraction.id)}`;
  card.style.setProperty("--card-order", String(index));
  card.dataset.attractionId = attraction.id;
  card.setAttribute("aria-label", `Find ${attraction.name} on the Uganda map`);

  const imageUrl = resolveAssetPath(attraction.imageUrl, "..");
  const parentLabel = attraction.destinationName
    ? `Near ${attraction.destinationName}`
    : (attraction.district || attraction.region || "Uganda");

  card.innerHTML = `
    <div class="attraction-discovery-media">
      <img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(attraction.name)}" loading="lazy" />
      <span class="attraction-discovery-type">${escapeHtml(attraction.category || "Attraction")}</span>
    </div>
    <div class="attraction-discovery-copy">
      <p>${escapeHtml(parentLabel)}</p>
      <h3>${escapeHtml(attraction.name)}</h3>
      <span>${escapeHtml(attraction.description || attraction.highlight || "Explore this place in Uganda.")}</span>
      <strong>Find on map <span aria-hidden="true">→</span></strong>
    </div>
  `;

  return card;
}

function renderAttractions() {
  if (!attractionList) return [];
  const filteredAttractions = getFilteredAttractions();
  attractionList.innerHTML = "";

  filteredAttractions.forEach((attraction, index) => {
    attractionList.appendChild(createAttractionDiscoveryCard(attraction, index));
  });

  if (attractionSummary) {
    attractionSummary.textContent = `${filteredAttractions.length} of ${attractions.length} attractions shown`;
  }
  attractionList.hidden = filteredAttractions.length === 0;
  return filteredAttractions;
}

function updateEmptyState(filteredDestinations, filteredAttractions) {
  if (!emptyState) return;
  emptyState.hidden = filteredDestinations.length + filteredAttractions.length !== 0;
}

async function loadJourneyPanel() {
  if (!journeyPanel || !journeyList) return;
  try {
    const bookings = await getBookings();
    if (!bookings.length) return;
    journeyList.innerHTML = bookings.slice(0, 3).map((booking) => `
      <a href="./map.html?focus=destination:${Number(booking.destinationId)}">
        <span>${escapeHtml(booking.destinationName)}</span>
        <small>${formatDate(booking.travelDate)} · ${Number(booking.travellers)} traveller${Number(booking.travellers) === 1 ? "" : "s"}</small>
      </a>
    `).join("");
    journeyPanel.hidden = false;
  } catch (error) {
    console.error("Could not load journey summary:", error);
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function applyFilters() {
  renderCategoryFilters();
  const filteredDestinations = renderDestinations();
  const filteredAttractions = renderAttractions();
  updateEmptyState(filteredDestinations, filteredAttractions);
}

async function loadCatalog() {
  if (destinationSummary) destinationSummary.textContent = "Loading tourism library from the API...";
  if (attractionSummary) attractionSummary.textContent = "Loading attractions...";

  try {
    [destinations, attractions] = await Promise.all([
      getAllDestinations(),
      getAllAttractions()
    ]);

    // Keep existing destination categories and add attraction-only categories
    // without duplicates so one filter controls both discovery sections.
    categories = [...new Set([
      ...getDestinationCategories(destinations),
      ...attractions.map((item) => item.category).filter(Boolean)
    ])].sort((a, b) => a.localeCompare(b));

    if (catalogTotal) catalogTotal.textContent = destinations.length + attractions.length;
    applyFilters();
  } catch (error) {
    console.error("Could not load tourism library:", error);
    if (destinationSummary) destinationSummary.textContent = error.message;
    if (attractionSummary) attractionSummary.textContent = "Attractions could not be loaded.";
    if (destinationList) destinationList.hidden = true;
    if (attractionList) attractionList.hidden = true;
    if (emptyState) {
      emptyState.hidden = false;
      const message = emptyState.querySelector("p");
      if (message) message.textContent = "Start the Node.js backend, then refresh this page.";
    }
  }
}

searchInput?.addEventListener("input", (event) => {
  catalogState.searchTerm = event.target.value.trim();
  applyFilters();
});

categoryFilters?.addEventListener("click", (event) => {
  const clickedButton = event.target.closest("[data-category]");
  if (!clickedButton) return;
  catalogState.category = clickedButton.dataset.category;
  applyFilters();
});

resetButton?.addEventListener("click", () => {
  catalogState.searchTerm = "";
  catalogState.category = "All";
  if (searchInput) searchInput.value = "";
  applyFilters();
});

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

await Promise.all([loadCatalog(), loadJourneyPanel()]);
