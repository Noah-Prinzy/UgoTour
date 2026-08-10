import "./ui-motion.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { createDestinationCard } from "./components/destination-card.js";
import { getAllDestinations } from "./services/destination-service.js";
import { resolveAssetPath } from "./utils/assets.js";

await renderNavbar(".");
renderFooter();

const slider = document.getElementById("journey-slider");
const backgroundLayers = [
  document.getElementById("journey-bg-a"),
  document.getElementById("journey-bg-b")
].filter(Boolean);
const cardRail = document.getElementById("journey-cards");
const copyBlock = document.getElementById("journey-copy");
const counter = document.getElementById("journey-counter");
const photoCredit = document.getElementById("journey-photo-credit");
const progressFill = document.getElementById("journey-progress-fill");
const grid = document.getElementById("experience-grid");
const searchInput = document.getElementById("destination-search");
const searchButton = document.getElementById("search-button");
const searchMessage = document.getElementById("search-message");

const AUTOPLAY_MS = 6500;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let destinations = [];
let activeIndex = 0;
let transitionLocked = false;
let autoplayTimer = null;
let autoplayPaused = false;
let activeBackgroundIndex = 0;

function primaryImage(destination) {
  return destination.galleryImages?.[0]?.url || destination.imageUrl;
}

function primaryPhoto(destination) {
  return destination.galleryImages?.[0] || {
    url: destination.imageUrl,
    credit: destination.photoCredit,
    sourceUrl: destination.photoSourceUrl
  };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? "";
}

function renderEditorialCards() {
  if (!cardRail) return;
  cardRail.innerHTML = "";

  destinations.forEach((destination, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "journey-card";
    button.dataset.index = String(index);
    button.setAttribute("role", "option");
    button.setAttribute("aria-label", `Show ${destination.name}`);

    const image = resolveAssetPath(primaryImage(destination), ".");
    button.innerHTML = `
      <img src="${escapeAttribute(image)}" alt="" />
      <span class="journey-card-shade" aria-hidden="true"></span>
      <span class="journey-card-copy">
        <small>${escapeHtml(destination.category)}</small>
        <strong>${escapeHtml(destination.name)}</strong>
      </span>
    `;

    button.addEventListener("click", () => changeDestination(index, button));
    cardRail.appendChild(button);
  });

  refreshCardState(false);
}

function refreshCardState(scroll = true) {
  const cards = [...(cardRail?.querySelectorAll(".journey-card") ?? [])];

  cards.forEach((card, index) => {
    const isActive = index === activeIndex;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-selected", String(isActive));
  });

  if (scroll && cards[activeIndex] && cardRail) {
    // Move only the horizontal card rail. `scrollIntoView()` could also move the
    // whole document vertically, which caused the Home hero to jump on load/change.
    const activeCard = cards[activeIndex];
    const targetLeft = activeCard.offsetLeft - ((cardRail.clientWidth - activeCard.offsetWidth) / 2);

    cardRail.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }
}

function updateHeroContent(destination) {
  const photo = primaryPhoto(destination);

  setText("journey-kicker", `${destination.category} · ${destination.region}`);
  setText("journey-title", destination.name);
  setText("journey-description", destination.description);
  setText("journey-highlight", destination.highlight || destination.bestFor || "Discover Uganda");

  const explore = document.getElementById("journey-explore");
  if (explore) explore.href = `./pages/destination-details.html?id=${destination.id}`;

  if (counter) {
    counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(destinations.length).padStart(2, "0")}`;
  }

  if (photoCredit) {
    photoCredit.textContent = photo.credit ? `Photo · ${photo.credit}` : "Destination photo";
    photoCredit.href = photo.sourceUrl || "https://unsplash.com";
  }
}

async function animateCopyChange(destination) {
  if (!copyBlock || reduceMotion || !copyBlock.animate) {
    updateHeroContent(destination);
    return;
  }

  await copyBlock.animate(
    [
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-18px)" }
    ],
    { duration: 210, easing: "ease-in", fill: "forwards" }
  ).finished;

  updateHeroContent(destination);

  await copyBlock.animate(
    [
      { opacity: 0, transform: "translateY(24px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 470, easing: "cubic-bezier(.18,.82,.2,1)", fill: "forwards" }
  ).finished;
}

async function crossfadeBackground(destination) {
  const nextSrc = resolveAssetPath(primaryImage(destination), ".");

  if (!backgroundLayers.length) return;

  const currentLayer = backgroundLayers[activeBackgroundIndex];
  const nextIndex = backgroundLayers.length > 1
    ? (activeBackgroundIndex + 1) % backgroundLayers.length
    : activeBackgroundIndex;
  const nextLayer = backgroundLayers[nextIndex];

  if (!nextLayer) return;

  // Load/decode the destination image before making it visible. This prevents a
  // white/empty flash if a large 2400px photo has not entered the browser cache yet.
  if (nextLayer.src !== new URL(nextSrc, window.location.href).href) {
    nextLayer.src = nextSrc;
  }

  try {
    await nextLayer.decode?.();
  } catch {
    // A failed decode does not stop the browser from attempting to display it.
  }

  if (reduceMotion || backgroundLayers.length === 1) {
    currentLayer?.classList.remove("is-active");
    nextLayer.classList.add("is-active");
    activeBackgroundIndex = nextIndex;
    return;
  }

  // The actual animation is CSS opacity on two full-hero layers. Both layers
  // stay underneath the shade and UI, so destination photography can never
  // cover the title, card rail, navigation or controls.
  nextLayer.classList.add("is-active");
  currentLayer?.classList.remove("is-active");

  await new Promise((resolve) => window.setTimeout(resolve, 920));
  activeBackgroundIndex = nextIndex;
}

async function changeDestination(nextIndex, sourceCard = null) {
  if (!destinations.length || transitionLocked) return;

  const normalized = (nextIndex + destinations.length) % destinations.length;
  if (normalized === activeIndex) {
    restartAutoplay();
    return;
  }

  transitionLocked = true;
  const destination = destinations[normalized];
  // Keep a subtle selected-card response, but the card no longer becomes an
  // overlay image. Destination photography changes only in the hero background.
  const targetCard = sourceCard || cardRail?.querySelector(`[data-index="${normalized}"]`);
  targetCard?.classList.add("is-transition-source");

  activeIndex = normalized;
  refreshCardState(true);
  restartAutoplay();

  try {
    await Promise.all([
      crossfadeBackground(destination),
      animateCopyChange(destination)
    ]);
  } finally {
    targetCard?.classList.remove("is-transition-source");
    transitionLocked = false;
  }
}

function restartProgressAnimation() {
  if (!progressFill) return;
  progressFill.style.animation = "none";
  // Force reflow so restarting autoplay also restarts the thin progress line.
  void progressFill.offsetWidth;
  progressFill.style.animation = autoplayPaused || reduceMotion
    ? "none"
    : `journey-progress ${AUTOPLAY_MS}ms linear forwards`;
}

function restartAutoplay() {
  clearTimeout(autoplayTimer);
  restartProgressAnimation();

  if (autoplayPaused || reduceMotion || destinations.length < 2) return;

  autoplayTimer = setTimeout(() => {
    changeDestination(activeIndex + 1);
  }, AUTOPLAY_MS);
}

function setAutoplayPaused(paused) {
  autoplayPaused = paused;
  restartAutoplay();
}

function submitSearch() {
  const term = searchInput?.value.trim() ?? "";

  if (!term) {
    if (searchMessage) searchMessage.textContent = "Type a place, region or travel style first.";
    searchInput?.focus();
    return;
  }

  window.location.href = `./pages/destinations.html?q=${encodeURIComponent(term)}`;
}

async function initialize() {
  if (searchMessage) searchMessage.textContent = "Loading Uganda destinations…";

  try {
    destinations = await getAllDestinations();

    if (!destinations.length) {
      if (searchMessage) searchMessage.textContent = "No destinations are available yet.";
      return;
    }

    const first = destinations[0];
    const firstSrc = resolveAssetPath(primaryImage(first), ".");
    backgroundLayers.forEach((layer, index) => {
      layer.src = firstSrc;
      layer.classList.toggle("is-active", index === 0);
    });
    activeBackgroundIndex = 0;
    updateHeroContent(first);
    renderEditorialCards();

    if (grid) {
      grid.innerHTML = "";
      destinations.slice(0, 6).forEach((destination) => {
        grid.appendChild(createDestinationCard(destination, {
          detailsPagePath: "./pages/destination-details.html",
          assetBasePath: "."
        }));
      });
    }

    if (searchMessage) searchMessage.textContent = `${destinations.length} destinations ready to explore.`;
    restartAutoplay();
  } catch (error) {
    console.error(error);
    if (searchMessage) searchMessage.textContent = error.message;
    setText("journey-title", "Start the UgoTour API");
    setText("journey-description", "The animated destination experience loads from your PostgreSQL-backed API.");
  }
}

document.getElementById("journey-prev")?.addEventListener("click", () => changeDestination(activeIndex - 1));
document.getElementById("journey-next")?.addEventListener("click", () => changeDestination(activeIndex + 1));
searchButton?.addEventListener("click", submitSearch);
searchInput?.addEventListener("keydown", (event) => { if (event.key === "Enter") submitSearch(); });

slider?.addEventListener("pointerenter", () => setAutoplayPaused(true));
slider?.addEventListener("pointerleave", () => setAutoplayPaused(false));
slider?.addEventListener("focusin", () => setAutoplayPaused(true));
slider?.addEventListener("focusout", (event) => {
  if (!slider.contains(event.relatedTarget)) setAutoplayPaused(false);
});

document.addEventListener("visibilitychange", () => setAutoplayPaused(document.hidden));

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

await initialize();
