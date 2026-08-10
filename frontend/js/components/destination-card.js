import { resolveAssetPath } from "../utils/assets.js";

// Reusable destination card built with vanilla JavaScript.
// Phase 8.1 uses two exact-location gallery photos so cards feel alive instead
// of repeating one static image everywhere. The second photo crossfades in on
// hover/focus while both files remain local inside frontend/images/.
export function createDestinationCard(destination, { detailsPagePath = null, assetBasePath = "." } = {}) {
  const detailsUrl = detailsPagePath ? `${detailsPagePath}?id=${destination.id}` : null;
  const card = document.createElement(detailsUrl ? "a" : "article");
  card.className = "destination-card";
  card.dataset.destinationId = destination.id;

  if (detailsUrl) {
    card.href = detailsUrl;
  }

  const gallery = Array.isArray(destination.galleryImages) ? destination.galleryImages : [];
  const primaryPhoto = gallery[0]?.url || destination.imageUrl;
  const secondaryPhoto = gallery[1]?.url || primaryPhoto;
  const imageUrl = resolveAssetPath(primaryPhoto, assetBasePath);
  const secondaryImageUrl = resolveAssetPath(secondaryPhoto, assetBasePath);

  card.innerHTML = `
    <div class="destination-card-media">
      <img class="destination-card-image destination-card-image-primary" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(destination.name)}" loading="lazy" />
      <img class="destination-card-image destination-card-image-secondary" src="${escapeAttribute(secondaryImageUrl)}" alt="" loading="lazy" aria-hidden="true" />
      <div class="destination-card-topline">
        <span class="tag">${escapeHtml(destination.category)}</span>
        <p class="destination-region">${escapeHtml(destination.region || "Uganda")}</p>
      </div>
    </div>
    <div class="destination-card-content">
      <h3>${escapeHtml(destination.name)}</h3>
      <p>${escapeHtml(destination.description)}</p>
      <div class="destination-card-footer">
        <span class="destination-highlight">${escapeHtml(destination.highlight || "Explore Uganda")}</span>
        ${detailsUrl ? `<span class="destination-details-button" aria-hidden="true">→</span>` : ""}
      </div>
    </div>
  `;

  return card;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
