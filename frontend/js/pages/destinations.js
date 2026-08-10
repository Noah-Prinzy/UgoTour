import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createDestinationCard } from "../components/destination-card.js";
import { getStarterDestinations } from "../services/destination-service.js";

renderNavbar("..");
renderFooter();

const list = document.getElementById("destination-list");
getStarterDestinations().forEach((destination) => list?.appendChild(createDestinationCard(destination)));
