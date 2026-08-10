import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { createDestinationCard } from "./components/destination-card.js";
import { getStarterDestinations } from "./services/destination-service.js";
import { resolveAssetPath } from "./utils/assets.js";

await renderNavbar(".");
renderFooter();

const grid = document.getElementById("experience-grid");
const searchInput = document.getElementById("destination-search");
const searchButton = document.getElementById("search-button");
const searchMessage = document.getElementById("search-message");
let destinations = [];

function renderDestinations(list) {
  if (!grid) return;
  grid.innerHTML = "";
  list.forEach((destination) => grid.appendChild(createDestinationCard(destination, { detailsPagePath: "./pages/destination-details.html", assetBasePath: "." })));
}

async function loadFeaturedDestinations() {
  if (searchMessage) searchMessage.textContent = "Loading destinations…";
  try {
    destinations = await getStarterDestinations();
    renderDestinations(destinations);

    const hero = destinations[0];
    if (hero) {
      const heroImage = document.getElementById("home-hero-image");
      if (heroImage && hero.imageUrl) {
        heroImage.src = resolveAssetPath(hero.imageUrl, ".");
      }
      setText("hero-featured-name", hero.name);
      setText("hero-featured-region", hero.region);
    }

    if (searchMessage) searchMessage.textContent = "Search the featured escapes below.";
  } catch (error) {
    console.error(error);
    if (searchMessage) searchMessage.textContent = error.message;
  }
}

function searchDestinations() {
  if (!searchInput || !searchMessage) return;
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderDestinations(destinations);
    searchMessage.textContent = "Showing all featured destinations.";
    return;
  }

  const filtered = destinations.filter((destination) => [destination.name, destination.category, destination.region].join(" ").toLowerCase().includes(term));
  renderDestinations(filtered);
  searchMessage.textContent = filtered.length ? `${filtered.length} featured destination${filtered.length === 1 ? "" : "s"} found.` : `No featured result for “${searchInput.value}”. Try the full Explore page.`;
}

searchButton?.addEventListener("click", searchDestinations);
searchInput?.addEventListener("keydown", (event) => { if (event.key === "Enter") searchDestinations(); });
document.getElementById("explore-button")?.addEventListener("click", () => { window.location.href = "./pages/destinations.html"; });
document.getElementById("about-button")?.addEventListener("click", () => { document.querySelector(".section-shell")?.scrollIntoView({ behavior: "smooth" }); });

function setText(id, text) { const element = document.getElementById(id); if (element) element.textContent = text ?? ""; }
await loadFeaturedDestinations();
