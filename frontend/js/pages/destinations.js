// ============================================================
// DESTINATIONS PAGE CONTROLLER - PHASE 2
// ============================================================
// This file controls the functional behavior of destinations.html.
// No React/Vue/Angular is used: search, filtering, rendering and the
// details dialog are all handled with vanilla JavaScript.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createDestinationCard } from "../components/destination-card.js";
import {
  getAllDestinations,
  getDestinationCategories
} from "../services/destination-service.js";

// Render shared layout components first.
renderNavbar("..");
renderFooter();

// ============================================================
// 1. LOAD LOCAL DATA
// ============================================================

const destinations = getAllDestinations();
const categories = getDestinationCategories();

// ============================================================
// 2. FIND HTML ELEMENTS WE NEED TO CONTROL
// ============================================================

const destinationList = document.getElementById("destination-list");
const searchInput = document.getElementById("catalog-search-input");
const categoryFilters = document.getElementById("category-filters");
const destinationSummary = document.getElementById("destination-summary");
const emptyState = document.getElementById("destination-empty-state");
const resetButton = document.getElementById("reset-filters");
const catalogTotal = document.getElementById("catalog-total");

// Details dialog elements.
const destinationDialog = document.getElementById("destination-dialog");
const dialogCategory = document.getElementById("dialog-category");
const dialogRegion = document.getElementById("dialog-region");
const dialogName = document.getElementById("dialog-name");
const dialogDescription = document.getElementById("dialog-description");
const dialogHighlight = document.getElementById("dialog-highlight");
const closeDialogButton = document.getElementById("close-destination-dialog");

// Show the total number of destinations in the page hero.
if (catalogTotal) {
  catalogTotal.textContent = destinations.length;
}

// ============================================================
// 3. SIMPLE PAGE STATE
// ============================================================
// State means the values that describe the user's current choices.
// In this phase we only need a search term and selected category.

const catalogState = {
  searchTerm: "",
  category: "All"
};

// ============================================================
// 4. BUILD CATEGORY FILTER BUTTONS
// ============================================================

function renderCategoryFilters() {
  if (!categoryFilters) {
    return;
  }

  categoryFilters.innerHTML = "";

  // Add "All" before our real data categories.
  const filterOptions = ["All", ...categories];

  filterOptions.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.dataset.category = category;
    button.textContent = category;

    // The active class gives the currently selected filter its design.
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
    // Category condition: either All is selected, or categories must match.
    const matchesCategory =
      catalogState.category === "All" ||
      destination.category === catalogState.category;

    // Search several destination properties, not only its name.
    const searchableText = [
      destination.name,
      destination.category,
      destination.region,
      destination.description,
      destination.highlight
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(normalizedSearch);

    // A destination must satisfy BOTH the category and search conditions.
    return matchesCategory && matchesSearch;
  });
}

// ============================================================
// 6. RENDER DESTINATION CARDS
// ============================================================

function renderDestinations() {
  if (!destinationList || !destinationSummary || !emptyState) {
    return;
  }

  const filteredDestinations = getFilteredDestinations();

  // Clear previous cards before creating the new result set.
  destinationList.innerHTML = "";

  filteredDestinations.forEach((destination) => {
    const card = createDestinationCard(destination, {
      showDetailsButton: true
    });

    destinationList.appendChild(card);
  });

  // Update result feedback for the user.
  destinationSummary.textContent = `${filteredDestinations.length} of ${destinations.length} destinations shown`;

  // The hidden property keeps the empty state invisible until needed.
  emptyState.hidden = filteredDestinations.length !== 0;
  destinationList.hidden = filteredDestinations.length === 0;
}

// ============================================================
// 7. APPLY FILTERS
// ============================================================
// Keeping rendering in one function prevents us from duplicating logic
// whenever the search term or category changes.

function applyFilters() {
  renderCategoryFilters();
  renderDestinations();
}

// ============================================================
// 8. SEARCH EVENT
// ============================================================
// "input" runs every time the user types, deletes or pastes text.

searchInput?.addEventListener("input", (event) => {
  catalogState.searchTerm = event.target.value.trim();
  renderDestinations();
});

// ============================================================
// 9. CATEGORY FILTER EVENT
// ============================================================
// Event delegation lets one listener manage every generated filter button.

categoryFilters?.addEventListener("click", (event) => {
  const clickedButton = event.target.closest("[data-category]");

  if (!clickedButton) {
    return;
  }

  catalogState.category = clickedButton.dataset.category;
  applyFilters();
});

// ============================================================
// 10. RESET FILTERS
// ============================================================

resetButton?.addEventListener("click", () => {
  catalogState.searchTerm = "";
  catalogState.category = "All";

  if (searchInput) {
    searchInput.value = "";
  }

  applyFilters();
});

// ============================================================
// 11. DESTINATION DETAILS DIALOG
// ============================================================

function openDestinationDetails(destinationId) {
  const destination = destinations.find(
    (item) => item.id === Number(destinationId)
  );

  if (!destination || !destinationDialog) {
    return;
  }

  // Fill the dialog with the selected destination's data.
  if (dialogCategory) dialogCategory.textContent = destination.category;
  if (dialogRegion) dialogRegion.textContent = destination.region;
  if (dialogName) dialogName.textContent = destination.name;
  if (dialogDescription) dialogDescription.textContent = destination.description;
  if (dialogHighlight) dialogHighlight.textContent = destination.highlight;

  destinationDialog.showModal();
}

// Again we use event delegation because the cards are generated dynamically.
destinationList?.addEventListener("click", (event) => {
  const detailsButton = event.target.closest("[data-view-destination]");

  if (!detailsButton) {
    return;
  }

  openDestinationDetails(detailsButton.dataset.viewDestination);
});

closeDialogButton?.addEventListener("click", () => {
  destinationDialog?.close();
});

// Clicking the dark backdrop outside the dialog content closes it too.
destinationDialog?.addEventListener("click", (event) => {
  if (event.target === destinationDialog) {
    destinationDialog.close();
  }
});

// ============================================================
// 12. INITIAL PAGE RENDER
// ============================================================

applyFilters();
