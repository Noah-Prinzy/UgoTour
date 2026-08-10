// ============================================================
// DESTINATIONS PAGE CONTROLLER - PHASE 3
// ============================================================
// Search, category filtering and dynamic rendering are still handled
// with vanilla JavaScript. In Phase 3, each card now links to ONE
// reusable details page using the destination id in the URL.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createDestinationCard } from "../components/destination-card.js";
import {
  getAllDestinations,
  getDestinationCategories
} from "../services/destination-service.js";

renderNavbar("..");
renderFooter();

// ============================================================
// 1. LOAD LOCAL DATA
// ============================================================

const destinations = getAllDestinations();
const categories = getDestinationCategories();

// ============================================================
// 2. FIND THE HTML ELEMENTS JAVASCRIPT CONTROLS
// ============================================================

const destinationList = document.getElementById("destination-list");
const searchInput = document.getElementById("catalog-search-input");
const categoryFilters = document.getElementById("category-filters");
const destinationSummary = document.getElementById("destination-summary");
const emptyState = document.getElementById("destination-empty-state");
const resetButton = document.getElementById("reset-filters");
const catalogTotal = document.getElementById("catalog-total");

if (catalogTotal) {
  catalogTotal.textContent = destinations.length;
}

// ============================================================
// 3. SIMPLE PAGE STATE
// ============================================================

const catalogState = {
  searchTerm: "",
  category: "All"
};

// ============================================================
// 4. BUILD CATEGORY FILTER BUTTONS
// ============================================================

function renderCategoryFilters() {
  if (!categoryFilters) return;

  categoryFilters.innerHTML = "";
  const filterOptions = ["All", ...categories];

  filterOptions.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.dataset.category = category;
    button.textContent = category;

    if (category === catalogState.category) {
      button.classList.add("is-active");
    }

    categoryFilters.appendChild(button);
  });
}

// ============================================================
// 5. FILTER THE DESTINATION ARRAY
// ============================================================

function getFilteredDestinations() {
  const normalizedSearch = catalogState.searchTerm.toLowerCase();

  return destinations.filter((destination) => {
    const matchesCategory =
      catalogState.category === "All" ||
      destination.category === catalogState.category;

    const searchableText = [
      destination.name,
      destination.category,
      destination.region,
      destination.description,
      destination.highlight,
      destination.bestFor
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
}

// ============================================================
// 6. RENDER DESTINATION CARDS
// ============================================================

function renderDestinations() {
  if (!destinationList || !destinationSummary || !emptyState) return;

  const filteredDestinations = getFilteredDestinations();
  destinationList.innerHTML = "";

  filteredDestinations.forEach((destination) => {
    // The card component creates a link containing ?id=<destination id>.
    const card = createDestinationCard(destination, {
      detailsPagePath: "./destination-details.html"
    });

    destinationList.appendChild(card);
  });

  destinationSummary.textContent = `${filteredDestinations.length} of ${destinations.length} destinations shown`;
  emptyState.hidden = filteredDestinations.length !== 0;
  destinationList.hidden = filteredDestinations.length === 0;
}

function applyFilters() {
  renderCategoryFilters();
  renderDestinations();
}

// ============================================================
// 7. USER EVENTS
// ============================================================

// Live search: runs every time the input value changes.
searchInput?.addEventListener("input", (event) => {
  catalogState.searchTerm = event.target.value.trim();
  renderDestinations();
});

// Event delegation lets one listener control all generated filters.
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

// ============================================================
// 8. INITIAL PAGE RENDER
// ============================================================

applyFilters();
