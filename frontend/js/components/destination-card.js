// ============================================================
// REUSABLE DESTINATION CARD COMPONENT
// Builds the destination cards used across UgoTour. The component can render a
// simple linked card or a saveable card whose heart button talks to Favorites.
// ============================================================

import { resolveAssetPath } from "../utils/assets.js";

export function createDestinationCard(
  destination,
  { detailsPagePath = null, linkUrl = null, assetBasePath = ".", showSaveButton = false, saved = false, onToggleSave = null } = {}
) {
  // Work out where clicking the card should navigate and which gallery images to use.
  const detailsUrl = linkUrl || (detailsPagePath ? `${detailsPagePath}?id=${destination.id}` : null);
  const gallery = Array.isArray(destination.galleryImages) ? destination.galleryImages : [];
  const primaryPhoto = gallery[0]?.url || destination.imageUrl;
  const secondaryPhoto = gallery[1]?.url || primaryPhoto;
  const imageUrl = resolveAssetPath(primaryPhoto, assetBasePath);
  const secondaryImageUrl = resolveAssetPath(secondaryPhoto, assetBasePath);

  // Pages that do not need Favorites can use one anchor/article as the whole card.
  if (!showSaveButton) {
    const card = document.createElement(detailsUrl ? "a" : "article");
    card.className = "destination-card";
    card.dataset.destinationId = destination.id;
    if (detailsUrl) card.href = detailsUrl;
    card.innerHTML = cardMarkup(destination, imageUrl, secondaryImageUrl, Boolean(detailsUrl));
    return card;
  }

  // Saveable cards use an outer article so the heart button is NOT nested inside
  // the navigation anchor. Nesting a button inside an anchor is invalid/inaccessible.
  const shell = document.createElement("article");
  shell.className = "destination-card destination-card-saveable";
  shell.dataset.destinationId = destination.id;
  shell.innerHTML = `
    <a class="destination-card-anchor" href="${escapeAttribute(detailsUrl || "#")}" aria-label="Find ${escapeAttribute(destination.name)} on the Uganda map">
      ${cardMarkup(destination, imageUrl, secondaryImageUrl, false)}
    </a>
    <button class="place-save-button" type="button" aria-pressed="${saved}" aria-label="${saved ? "Remove" : "Save"} ${escapeAttribute(destination.name)}">${saved ? "♥" : "♡"}</button>
  `;

  // Toggle the server-backed Favorite state while preventing repeated clicks during
  // the async request. The callback is supplied by the page using this component.
  const button = shell.querySelector(".place-save-button");
  button?.addEventListener("click", async () => {
    if (!onToggleSave || button.disabled) return;
    button.disabled = true;
    try {
      const nextSaved = await onToggleSave(destination, button.getAttribute("aria-pressed") === "true");
      button.textContent = nextSaved ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(nextSaved));
      button.setAttribute("aria-label", `${nextSaved ? "Remove" : "Save"} ${destination.name}`);
    } finally {
      button.disabled = false;
    }
  });
  return shell;
}

// Shared HTML template for destination image, metadata, description and highlight.
function cardMarkup(destination, imageUrl, secondaryImageUrl, hasLink) {
  return `
    <div class="destination-card-media">
      <img class="destination-card-image destination-card-image-primary" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(destination.name)}" loading="lazy" decoding="async" />
      <img class="destination-card-image destination-card-image-secondary" src="${escapeAttribute(secondaryImageUrl)}" alt="" loading="lazy" decoding="async" aria-hidden="true" />
      <div class="destination-card-topline"><span class="tag">${escapeHtml(destination.category)}</span><p class="destination-region">${escapeHtml(destination.region || "Uganda")}</p></div>
    </div>
    <div class="destination-card-content"><h3>${escapeHtml(destination.name)}</h3><p>${escapeHtml(destination.description)}</p><div class="destination-card-footer"><span class="destination-highlight">${escapeHtml(destination.highlight || "Explore Uganda")}</span>${hasLink ? `<span class="destination-details-button" aria-hidden="true">→</span>` : ""}</div></div>`;
}

// Escape database/user-facing text before placing it into innerHTML templates.
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escapeAttribute(value) { return escapeHtml(value); }
