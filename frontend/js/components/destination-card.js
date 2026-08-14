import { resolveAssetPath } from "../utils/assets.js";

// Reusable destination card. Discovery pages can opt into a database-backed
// favorite button without nesting a button inside an anchor.
export function createDestinationCard(
  destination,
  { detailsPagePath = null, linkUrl = null, assetBasePath = ".", showSaveButton = false, saved = false, onToggleSave = null } = {}
) {
  const detailsUrl = linkUrl || (detailsPagePath ? `${detailsPagePath}?id=${destination.id}` : null);
  const gallery = Array.isArray(destination.galleryImages) ? destination.galleryImages : [];
  const primaryPhoto = gallery[0]?.url || destination.imageUrl;
  const secondaryPhoto = gallery[1]?.url || primaryPhoto;
  const imageUrl = resolveAssetPath(primaryPhoto, assetBasePath);
  const secondaryImageUrl = resolveAssetPath(secondaryPhoto, assetBasePath);

  if (!showSaveButton) {
    const card = document.createElement(detailsUrl ? "a" : "article");
    card.className = "destination-card";
    card.dataset.destinationId = destination.id;
    if (detailsUrl) card.href = detailsUrl;
    card.innerHTML = cardMarkup(destination, imageUrl, secondaryImageUrl, Boolean(detailsUrl));
    return card;
  }

  const shell = document.createElement("article");
  shell.className = "destination-card destination-card-saveable";
  shell.dataset.destinationId = destination.id;
  shell.innerHTML = `
    <a class="destination-card-anchor" href="${escapeAttribute(detailsUrl || "#")}" aria-label="Find ${escapeAttribute(destination.name)} on the Uganda map">
      ${cardMarkup(destination, imageUrl, secondaryImageUrl, Boolean(detailsUrl))}
    </a>
    <button class="place-save-button" type="button" aria-pressed="${saved}" aria-label="${escapeAttribute(favoriteLabel(destination.name, saved))}">${saved ? "♥" : "♡"}</button>
  `;

  const button = shell.querySelector(".place-save-button");
  button?.addEventListener("click", async () => {
    if (!onToggleSave || button.disabled) return;
    button.disabled = true;
    try {
      const nextSaved = await onToggleSave(destination, button.getAttribute("aria-pressed") === "true");
      button.textContent = nextSaved ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(nextSaved));
      button.setAttribute("aria-label", favoriteLabel(destination.name, nextSaved));
    } finally {
      button.disabled = false;
    }
  });
  return shell;
}

function favoriteLabel(name, saved) {
  return saved
    ? `Remove ${name} from Favorites`
    : `Add ${name} to Favorites`;
}

function cardMarkup(destination, imageUrl, secondaryImageUrl, hasLink) {
  return `
    <div class="destination-card-media">
      <img class="destination-card-image destination-card-image-primary" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(destination.name)}" loading="lazy" decoding="async" />
      <img class="destination-card-image destination-card-image-secondary" src="${escapeAttribute(secondaryImageUrl)}" alt="" loading="lazy" decoding="async" aria-hidden="true" />
      <div class="destination-card-topline"><span class="tag">${escapeHtml(destination.category)}</span><p class="destination-region">${escapeHtml(destination.region || "Uganda")}</p></div>
    </div>
    <div class="destination-card-content"><h3>${escapeHtml(destination.name)}</h3><p>${escapeHtml(destination.description)}</p><div class="destination-card-footer"><span class="destination-highlight">${escapeHtml(destination.highlight || "Explore Uganda")}</span>${hasLink ? `<span class="destination-details-button" aria-hidden="true">→</span>` : ""}</div></div>`;
}

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function escapeAttribute(value) { return escapeHtml(value); }
