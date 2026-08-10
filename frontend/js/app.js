import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { createDestinationCard } from "./components/destination-card.js";
import { getStarterDestinations } from "./services/destination-service.js";

// Render the reusable page components.
renderNavbar(".");
renderFooter();

// Get the main destination grid from the HTML page.
const grid = document.getElementById("experience-grid");

// Get a local copy of our temporary starter destination data.
const destinations = getStarterDestinations();

// Reusable rendering function.
// It can display all destinations or only a filtered list.
function renderDestinations(destinationList) {
  if (!grid) {
    return;
  }

  // Remove any destination cards that are currently displayed.
  grid.innerHTML = "";

  // Create one card for every destination in the supplied list.
  destinationList.forEach((destination) => {
    const card = createDestinationCard(destination);
    grid.appendChild(card);
  });
}

// Display all starter destinations when the page first loads.
renderDestinations(destinations);

// Find the search interface elements in index.html.
const searchInput = document.getElementById("destination-search");
const searchButton = document.getElementById("search-button");
const searchMessage = document.getElementById("search-message");

// Search destinations by their name or category.
function searchDestinations() {
  if (!searchInput || !searchMessage) {
    return;
  }

  // trim() removes unnecessary spaces.
  // toLowerCase() makes the search case-insensitive.
  const searchTerm = searchInput.value.trim().toLowerCase();

  // An empty search restores every destination.
  if (searchTerm === "") {
    renderDestinations(destinations);
    searchMessage.textContent = "Showing all destinations.";
    return;
  }

  // filter() creates a new array containing only destinations
  // whose name or category includes the search term.
  const filteredDestinations = destinations.filter((destination) => {
    const name = destination.name.toLowerCase();
    const category = destination.category.toLowerCase();

    return name.includes(searchTerm) || category.includes(searchTerm);
  });

  // Replace the current cards with the matching results.
  renderDestinations(filteredDestinations);

  // Give the user feedback about the search result.
  if (filteredDestinations.length === 0) {
    searchMessage.textContent = `No destinations found for "${searchInput.value}".`;
  } else {
    searchMessage.textContent = `${filteredDestinations.length} destination(s) found.`;
  }
}

// Run the search when the Search button is clicked.
searchButton?.addEventListener("click", searchDestinations);

// Also run the search when Enter is pressed inside the search input.
searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchDestinations();
  }
});

// Home page Explore button.
document.getElementById("explore-button")?.addEventListener("click", () => {
  window.location.href = "./pages/destinations.html";
});

// Temporary explanation button for the starter phase.
document.getElementById("about-button")?.addEventListener("click", () => {
  alert(
    "UgoTour will combine a JavaScript frontend, Node.js REST API and PostgreSQL database."
  );
});
