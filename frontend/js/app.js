// ============================================================
// HOME PAGE CONTROLLER - PHASE 7
// ============================================================
// The Home page now gets featured destinations through fetch() from the real
// Node.js/PostgreSQL API instead of importing a local JavaScript data array.

import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { createDestinationCard } from "./components/destination-card.js";
import { getStarterDestinations } from "./services/destination-service.js";

await renderNavbar(".");
renderFooter();

const grid = document.getElementById("experience-grid");
const searchInput = document.getElementById("destination-search");
const searchButton = document.getElementById("search-button");
const searchMessage = document.getElementById("search-message");

let destinations = [];

function renderDestinations(destinationList) {
  if (!grid) return;

  grid.innerHTML = "";

  destinationList.forEach((destination) => {
    const card = createDestinationCard(destination, {
      detailsPagePath: "./pages/destination-details.html"
    });
    grid.appendChild(card);
  });
}

async function loadFeaturedDestinations() {
  if (searchMessage) {
    searchMessage.textContent = "Loading destinations from UgoTour...";
  }

  try {
    destinations = await getStarterDestinations();
    renderDestinations(destinations);

    if (searchMessage) {
      searchMessage.textContent = "Featured destinations loaded from the UgoTour API.";
    }
  } catch (error) {
    console.error("Could not load Home destinations:", error);

    if (searchMessage) {
      searchMessage.textContent = error.message;
    }
  }
}

function searchDestinations() {
  if (!searchInput || !searchMessage) return;

  const searchTerm = searchInput.value.trim().toLowerCase();

  if (searchTerm === "") {
    renderDestinations(destinations);
    searchMessage.textContent = "Showing all featured destinations.";
    return;
  }

  const filteredDestinations = destinations.filter((destination) => {
    const searchableText = [
      destination.name,
      destination.category,
      destination.region
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm);
  });

  renderDestinations(filteredDestinations);

  searchMessage.textContent = filteredDestinations.length === 0
    ? `No featured destinations found for "${searchInput.value}".`
    : `${filteredDestinations.length} destination(s) found.`;
}

searchButton?.addEventListener("click", searchDestinations);
searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchDestinations();
  }
});

document.getElementById("explore-button")?.addEventListener("click", () => {
  window.location.href = "./pages/destinations.html";
});

document.getElementById("about-button")?.addEventListener("click", () => {
  alert(
    "UgoTour now connects its vanilla JavaScript frontend to a Node.js REST API backed by PostgreSQL."
  );
});

await loadFeaturedDestinations();
