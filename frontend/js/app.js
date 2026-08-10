import "./ui-motion.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { createDestinationCard } from "./components/destination-card.js";
import { getAllDestinations } from "./services/destination-service.js";
import { resolveAssetPath } from "./utils/assets.js";

await renderNavbar(".");
renderFooter();

const slider = document.getElementById("journey-slider");
const background = document.getElementById("journey-bg");
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

  if (scroll && cards[activeIndex]) {
    cards[activeIndex].scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest"
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

  copyBlock.animate(
    [
      { opacity: 0, transform: "translateY(24px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 470, easing: "cubic-bezier(.18,.82,.2,1)", fill: "forwards" }
  );
}

async function morphCardIntoBackground(sourceCard, destination) {
  const nextSrc = resolveAssetPath(primaryImage(destination), ".");

  if (!slider || !background || !sourceCard || reduceMotion || !sourceCard.animate) {
    if (background) background.src = nextSrc;
    return;
  }

  const heroRect = slider.getBoundingClientRect();
  const cardRect = sourceCard.getBoundingClientRect();
  const clone = document.createElement("img");

  clone.className = "journey-morph-layer";
  clone.src = nextSrc;
  clone.alt = "";
  clone.style.left = `${cardRect.left - heroRect.left}px`;
  clone.style.top = `${cardRect.top - heroRect.top}px`;
  clone.style.width = `${cardRect.width}px`;
  clone.style.height = `${cardRect.height}px`;
  slider.appendChild(clone);

  // Put the final image behind the expanding clone. This gives the same visual
  // continuity as the supplied reference: the chosen card appears to become
  // the next full-screen destination instead of cutting abruptly.
  background.src = nextSrc;

  try {
    await clone.animate(
      [
        {
          left: `${cardRect.left - heroRect.left}px`,
          top: `${cardRect.top - heroRect.top}px`,
          width: `${cardRect.width}px`,
          height: `${cardRect.height}px`,
          borderRadius: "24px",
          filter: "brightness(.92)"
        },
        {
          left: "0px",
          top: "0px",
          width: `${heroRect.width}px`,
          height: `${heroRect.height}px`,
          borderRadius: "0px",
          filter: "brightness(1)"
        }
      ],
      {
        duration: 900,
        easing: "cubic-bezier(.68,0,.18,1)",
        fill: "forwards"
      }
    ).finished;
  } finally {
    clone.remove();
  }
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
  const targetCard = sourceCard || cardRail?.querySelector(`[data-index="${normalized}"]`);

  activeIndex = normalized;
  refreshCardState(true);
  restartAutoplay();

  await Promise.all([
    morphCardIntoBackground(targetCard, destination),
    animateCopyChange(destination)
  ]);

  transitionLocked = false;
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
    if (background) background.src = resolveAssetPath(primaryImage(first), ".");
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
