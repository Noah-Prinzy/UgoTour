import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { createDestinationCard } from "./components/destination-card.js";
import { getStarterDestinations } from "./services/destination-service.js";

renderNavbar(".");
renderFooter();

const grid = document.getElementById("experience-grid");
getStarterDestinations().forEach((destination) => {
  grid?.appendChild(createDestinationCard(destination));
});

document.getElementById("explore-button")?.addEventListener("click", () => {
  window.location.href = "./pages/destinations.html";
});

document.getElementById("about-button")?.addEventListener("click", () => {
  alert("UgoTour will combine a JavaScript frontend, Node.js REST API and PostgreSQL database.");
});
