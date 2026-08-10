// ============================================================
// DESTINATIONS PAGE CONTROLLER - PHASE 7
// ============================================================
// Search/filter behavior remains vanilla JavaScript. The destination records
// now arrive asynchronously from the Node.js REST API and PostgreSQL.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createDestinationCard } from "../components/destination-card.js";
import {
  getAllDestinations,
  getDestinationCategories
} from "../services/destination-service.js";

await renderNavbar("..");
renderFooter();

const destinationList = document.getElementById("destination-list");
const searchInput = document.getElementById("catalog-search-input");
const categoryFilters = document.getElementById("category-filters");
const destinationSummary = document.getElementById("destination-summary");
const emptyState = document.getElementById("destination-empty-state");
const resetButton = document.getElementById("reset-filters");
const catalogTotal = document.getElementById("catalog-total");

let destinations = [];
let categories = [];

const catalogState = {
  searchTerm: "",
  category: "All"
};

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
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesCategory && searchableText.includes(normalizedSearch);
  });
}

function renderDestinations() {
  if (!destinationList || !destinationSummary || !emptyState) return;

  const filteredDestinations = getFilteredDestinations();
  destinationList.innerHTML = "";

  filteredDestinations.forEach((destination) => {
    destinationList.appendChild(
      createDestinationCard(destination, {
        detailsPagePath: "./destination-details.html"
      })
    );
  });

  destinationSummary.textContent = `${filteredDestinations.length} of ${destinations.length} destinations shown`;
  emptyState.hidden = filteredDestinations.length !== 0;
  destinationList.hidden = filteredDestinations.length === 0;
}

function applyFilters() {
  renderCategoryFilters();
  renderDestinations();
}

async function loadCatalog() {
  if (destinationSummary) {
    destinationSummary.textContent = "Loading destinations from the API...";
  }

  try {
    destinations = await getAllDestinations();
    categories = getDestinationCategories(destinations);

    if (catalogTotal) {
      catalogTotal.textContent = destinations.length;
    }

    applyFilters();
  } catch (error) {
    console.error("Could not load destinations:", error);

    if (destinationSummary) {
      destinationSummary.textContent = error.message;
    }

    if (destinationList) destinationList.hidden = true;
    if (emptyState) {
      emptyState.hidden = false;
      const message = emptyState.querySelector("p");
      if (message) message.textContent = "Start the Node.js backend, then refresh this page.";
    }
  }
}

searchInput?.addEventListener("input", (event) => {
  catalogState.searchTerm = event.target.value.trim();
  renderDestinations();
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

await loadCatalog();
