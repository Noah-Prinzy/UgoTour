/*
 * Phase 1.8 — Home journey cards are now navigation affordances.
 * The animated hero/dots still control the visual sequence; clicking a circular
 * journey card opens that exact destination on the Uganda map. The user can
 * then choose View details from the map callout.
 */
import { getAllDestinations } from "./services/destination-service.js";

const destinationsPromise = getAllDestinations().catch((error) => {
  console.error("Could not prepare Home → Map routing:", error);
  return [];
});

function cardFromEvent(event) {
  const target = event.target;
  return target instanceof Element ? target.closest(".journey-card") : null;
}

async function destinationForCard(card) {
  const destinations = await destinationsPromise;
  const index = Number(card?.dataset.index);
  if (!Number.isInteger(index) || !destinations[index]) return null;
  return destinations[index];
}

// Capture before app.js' card click listener so a deliberate click routes to
// the map rather than merely changing the hero selection.
document.addEventListener("click", async (event) => {
  const card = cardFromEvent(event);
  if (!card || !card.closest("#journey-cards")) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const destination = await destinationForCard(card);
  if (!destination?.id) return;
  window.location.assign(`./pages/map.html?focus=destination:${encodeURIComponent(destination.id)}`);
}, true);

async function refreshCardAccessibility() {
  const rail = document.getElementById("journey-cards");
  if (!rail) return;
  const destinations = await destinationsPromise;
  rail.querySelectorAll(".journey-card").forEach((card) => {
    const destination = destinations[Number(card.dataset.index)];
    if (!destination) return;
    card.setAttribute("aria-label", `Open ${destination.name} on the Uganda map`);
    card.title = `Open ${destination.name} on map`;
  });
}

const rail = document.getElementById("journey-cards");
if (rail) {
  const observer = new MutationObserver(() => refreshCardAccessibility());
  observer.observe(rail, { childList: true });
  refreshCardAccessibility();
}
