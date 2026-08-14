// ============================================================
// FAVORITES PAGE CONTROLLER
// Loads the signed-in user's saved destinations/attractions, renders one unified
// card collection and lets the user remove a place from Favorites.
// ============================================================

import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getSavedPlaces, removeSavedPlace } from "../services/saved-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { resolveAssetPath } from "../utils/assets.js";

// Favorites are private account data, so validate the session before rendering.
const user = await requireAuthenticatedUser("..");
await renderNavbar("..", user);
renderFooter();

const list = document.getElementById("saved-list");
const empty = document.getElementById("saved-empty");
const status = document.getElementById("saved-status");
let places = [];

// Both destinations and attractions can be focused with the same map query format.
function detailMapUrl(place) {
  return `./map.html?focus=${place.placeType}:${Number(place.id)}`;
}

// Escape API text before using it in a card's innerHTML template.
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// Rebuild the visible Favorite-card collection from the current local array.
function render() {
  list.innerHTML = "";
  empty.hidden = places.length !== 0;
  list.hidden = places.length === 0;
  status.textContent = `${places.length} favorite place${places.length === 1 ? "" : "s"}`;

  places.forEach((place) => {
    const card = document.createElement("article");
    card.className = "saved-card";
    card.innerHTML = `
      <a class="saved-card-link" href="${detailMapUrl(place)}">
        <img src="${escapeHtml(resolveAssetPath(place.imageUrl, ".."))}" alt="${escapeHtml(place.name)}" loading="lazy"/>
        <div>
          <span class="tag">${escapeHtml(place.category || place.placeType)}</span>
          <h2>${escapeHtml(place.name)}</h2>
          <p>${escapeHtml(place.destinationName ? `Near ${place.destinationName}` : (place.region || "Uganda"))}</p>
          <span>Find on map →</span>
        </div>
      </a>
      <button class="saved-remove" type="button" aria-label="Remove ${escapeHtml(place.name)} from favorites">♥</button>`;

    // Remove the server record, update the local array and redraw without a reload.
    card.querySelector(".saved-remove").addEventListener("click", async () => {
      const button = card.querySelector(".saved-remove");
      button.disabled = true;
      await removeSavedPlace(place.placeType, place.id);
      places = places.filter((candidate) => !(candidate.placeType === place.placeType && candidate.id === place.id));
      render();
    });

    list.appendChild(card);
  });
}

// Initial Favorites load; display API errors in the existing status element.
try {
  places = await getSavedPlaces();
  render();
} catch (error) {
  status.textContent = error.message;
}
