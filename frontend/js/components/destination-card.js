import { resolveAssetPath } from "../utils/assets.js";

// Reusable destination card built with vanilla JavaScript.
export function createDestinationCard(destination, { detailsPagePath = null, assetBasePath = "." } = {}) {
  const article = document.createElement("article");
  article.className = "destination-card";
  article.dataset.destinationId = destination.id;

  const detailsUrl = detailsPagePath ? `${detailsPagePath}?id=${destination.id}` : null;
  const imageUrl = resolveAssetPath(destination.imageUrl, assetBasePath);

  article.innerHTML = `
    <div class="destination-card-media">
      <img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(destination.name)}" loading="lazy" />
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
        ${detailsUrl ? `<a class="destination-details-button" href="${detailsUrl}" aria-label="View ${escapeAttribute(destination.name)}">→</a>` : ""}
      </div>
    </div>
  `;

  return article;
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
