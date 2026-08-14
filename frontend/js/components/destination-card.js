import { resolveAssetPath } from "../utils/assets.js";

ensureCompactCardActionStyles();

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
    card.className = "destination-card destination-card-overlay";
    card.dataset.destinationId = destination.id;
    if (detailsUrl) card.href = detailsUrl;
    card.innerHTML = cardMarkup(destination, imageUrl, secondaryImageUrl, Boolean(detailsUrl));
    applyCompactCardActions(card);
    return card;
  }

  const shell = document.createElement("article");
  shell.className = "destination-card destination-card-saveable destination-card-overlay";
  shell.dataset.destinationId = destination.id;
  shell.innerHTML = `
    <a class="destination-card-anchor" href="${escapeAttribute(detailsUrl || "#")}" aria-label="Find ${escapeAttribute(destination.name)} on the Uganda map">
      ${cardMarkup(destination, imageUrl, secondaryImageUrl, Boolean(detailsUrl))}
    </a>
    <button class="place-save-button" type="button" aria-pressed="${saved}" aria-label="${escapeAttribute(favoriteLabel(destination.name, saved))}">${saved ? "♥" : "♡"}</button>
  `;

  applyCompactCardActions(shell);

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

function applyCompactCardActions(card) {
  const footer = card.querySelector(".destination-card-footer");
  const details = card.querySelector(".destination-details-button");
  const favorite = card.querySelector(":scope > .place-save-button");

  // Give the highlight copy more room while keeping the action cluster on one
  // deliberate lower-right baseline.
  footer?.style.setProperty("padding-right", "98px", "important");

  if (details) {
    details.style.setProperty("width", "38px", "important");
    details.style.setProperty("min-width", "38px", "important");
    details.style.setProperty("max-width", "38px", "important");
    details.style.setProperty("height", "38px", "important");
    details.style.setProperty("min-height", "38px", "important");
    details.style.setProperty("max-height", "38px", "important");
    details.style.setProperty("right", "60px", "important");
    details.style.setProperty("bottom", "14px", "important");
    details.style.setProperty("border-radius", "9px", "important");
    details.style.setProperty("box-shadow", "0 7px 18px rgba(0, 0, 0, 0.20)", "important");
  }

  if (favorite) {
    // The button keeps a 44px hit target; its ::before draws the smaller 38px
    // visible chip centered inside that target.
    favorite.classList.add("ugotour-compact-card-action");
    favorite.style.setProperty("width", "44px", "important");
    favorite.style.setProperty("min-width", "44px", "important");
    favorite.style.setProperty("max-width", "44px", "important");
    favorite.style.setProperty("height", "44px", "important");
    favorite.style.setProperty("min-height", "44px", "important");
    favorite.style.setProperty("max-height", "44px", "important");
    favorite.style.setProperty("right", "11px", "important");
    favorite.style.setProperty("bottom", "11px", "important");
    favorite.style.setProperty("border", "0", "important");
    favorite.style.setProperty("background", "transparent", "important");
    favorite.style.setProperty("box-shadow", "none", "important");
    favorite.style.setProperty("transform", "none", "important");
    favorite.style.setProperty("isolation", "isolate");
  }
}

function ensureCompactCardActionStyles() {
  if (document.querySelector("style[data-ugotour-compact-card-actions]")) return;
  const style = document.createElement("style");
  style.dataset.ugotourCompactCardActions = "1";
  style.textContent = `
    body.destinations-page .place-save-button.ugotour-compact-card-action::before {
      content: "";
      position: absolute;
      z-index: -1;
      inset: 3px;
      border: 1px solid rgba(255,255,255,.66);
      border-radius: 9px;
      background: rgba(249,250,244,.90);
      box-shadow: 0 7px 18px rgba(0,0,0,.20);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
    }
    body.destinations-page .place-save-button.ugotour-compact-card-action[aria-pressed="true"]::before {
      border-color: rgba(220,235,181,.88);
      background: rgba(220,235,181,.94);
    }
    @media (hover:hover) {
      body.destinations-page .place-save-button.ugotour-compact-card-action:hover::before {
        background: rgba(255,255,255,.98);
        transform: translateY(-1px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      body.destinations-page .place-save-button.ugotour-compact-card-action::before {
        transition: none;
        transform: none;
      }
    }
  `;
  document.head.appendChild(style);
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
