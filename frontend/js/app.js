import "./ui-motion.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { getAllDestinations } from "./services/destination-service.js";
import { resolveAssetPath } from "./utils/assets.js";
import { requireAuthenticatedUser } from "./services/session-guard.js";

const currentUser = await requireAuthenticatedUser(".");
await renderNavbar(".", currentUser);
renderFooter();

const slider = document.getElementById("journey-slider");
const contentSurface = document.getElementById("home-content");
const backgroundLayers = [
  document.getElementById("journey-bg-a"),
  document.getElementById("journey-bg-b")
].filter(Boolean);
const cardRail = document.getElementById("journey-cards");
const dotRail = document.getElementById("journey-dots");
const copyBlock = document.getElementById("journey-copy");
const counter = document.getElementById("journey-counter");
const photoCredit = document.getElementById("journey-photo-credit");
const progressFill = document.getElementById("journey-progress-fill");
const searchInput = document.getElementById("destination-search");
const searchButton = document.getElementById("search-button");
const searchMessage = document.getElementById("search-message");
const scrollCue = document.querySelector(".journey-scroll-cue");

const AUTOPLAY_MS = 6500;
const QUEUE_SIZE = 5;
const ACTIVE_SELECTOR_ORDER = Math.floor(QUEUE_SIZE / 2);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let destinations = [];
let activeIndex = 0;
let transitionLocked = false;
let autoplayTimer = null;
let autoplayPaused = false;
let activeBackgroundIndex = 0;

const HANDOFF_DURATION_MS = 980;
const WHEEL_TRIGGER = 18;
const TOUCH_TRIGGER = 34;
let homeHandoffLocked = false;
let handoffCooldownUntil = 0;
let wheelIntent = 0;
let wheelIntentTimer = null;
let touchStartY = null;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

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

function queueIndicesFor(heroIndex) {
  if (!destinations.length) return [];
  const count = Math.min(QUEUE_SIZE, destinations.length);
  const activeOrder = Math.floor(count / 2);
  return Array.from(
    { length: count },
    (_, order) => (heroIndex + order - activeOrder + destinations.length) % destinations.length
  );
}

function populateJourneyCard(button, index, order) {
  const destination = destinations[index];
  const isActive = order === ACTIVE_SELECTOR_ORDER;
  button.className = `journey-card is-reused-motion${isActive ? " is-active" : ""}`;
  button.dataset.index = String(index);
  button.dataset.queueOrder = String(order);
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", isActive ? "true" : "false");
  button.setAttribute("aria-label", isActive ? `Current destination: ${destination.name}` : `Show ${destination.name}`);

  const image = resolveAssetPath(primaryImage(destination), ".");
  const img = button.querySelector("img");
  const small = button.querySelector("small");
  const strong = button.querySelector("strong");

  if (!img) {
    button.innerHTML = `
      <img src="${escapeAttribute(image)}" alt="" />
      <span class="journey-card-shade" aria-hidden="true"></span>
      <span class="journey-card-copy">
        <small>${escapeHtml(destination.category)}</small>
        <strong>${escapeHtml(destination.name)}</strong>
      </span>`;
  } else {
    const absoluteImage = new URL(image, window.location.href).href;
    if (img.src !== absoluteImage) img.src = image;
    if (small) small.textContent = destination.category || "";
    if (strong) strong.textContent = destination.name || "";
  }
}

function createJourneyQueueCard(index, order) {
  const button = document.createElement("button");
  button.type = "button";
  populateJourneyCard(button, index, order);
  button.addEventListener("click", () => {
    const targetIndex = Number(button.dataset.index);
    const orderNow = Number(button.dataset.queueOrder);
    const direction = orderNow < ACTIVE_SELECTOR_ORDER ? -1 : 1;
    changeDestination(targetIndex, button, direction);
  });
  return button;
}

function renderJourneyQueue(heroIndex = activeIndex) {
  if (!cardRail) return;
  cardRail.innerHTML = "";
  queueIndicesFor(heroIndex).forEach((index, order) => {
    cardRail.appendChild(createJourneyQueueCard(index, order));
  });
}

function renderJourneyDots() {
  if (!dotRail) return;
  dotRail.innerHTML = "";

  destinations.forEach((destination, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `journey-dot${index === activeIndex ? " is-active" : ""}`;
    dot.setAttribute("aria-label", `Show ${destination.name}`);
    dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    dot.addEventListener("click", () => changeDestination(index, null, index > activeIndex ? 1 : -1));
    dotRail.appendChild(dot);
  });
}

// Phase 1.19: reuse the live card nodes instead of deleting/rebuilding the
// entire five-card queue. The Android selector therefore moves as one fluid
// FLIP transition and only the single entering/leaving edge item is created/
// removed. This eliminates the visible queue re-formation in the supplied video.
async function animateJourneyQueue(nextHeroIndex, direction = 1) {
  if (!cardRail) return;

  const nextIndices = queueIndicesFor(nextHeroIndex);
  const liveCards = [...cardRail.querySelectorAll(".journey-card:not(.is-leaving-motion)")];

  if (reduceMotion || !liveCards.length || !Element.prototype.animate) {
    renderJourneyQueue(nextHeroIndex);
    return;
  }

  const railRect = cardRail.getBoundingClientRect();
  const cardByIndex = new Map(liveCards.map((card) => [Number(card.dataset.index), card]));
  const oldRects = new Map(liveCards.map((card) => [card, card.getBoundingClientRect()]));
  const leaving = liveCards.filter((card) => !nextIndices.includes(Number(card.dataset.index)));

  // Freeze only the outgoing edge card in its old physical position. Unlike the
  // old implementation we do not clone every card, so the active circle and its
  // neighbours retain identity throughout the movement.
  leaving.forEach((card) => {
    const rect = oldRects.get(card);
    card.classList.add("is-leaving-motion");
    card.style.left = `${rect.left - railRect.left}px`;
    card.style.top = `${rect.top - railRect.top}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.margin = "0";
    card.style.flex = "none";
  });

  const nextCards = nextIndices.map((index, order) => {
    const reused = cardByIndex.get(index);
    const card = reused || createJourneyQueueCard(index, order);
    card.classList.remove("is-leaving-motion");
    if (reused) populateJourneyCard(card, index, order);
    cardRail.appendChild(card);
    return card;
  });

  // Allow layout to settle after DOM reordering, then invert each reused card
  // from its previous physical location to its new one.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const animations = [];
  const easing = "cubic-bezier(.16,.84,.18,1)";

  nextCards.forEach((card) => {
    const oldRect = oldRects.get(card);
    const newRect = card.getBoundingClientRect();

    if (oldRect) {
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      const sx = newRect.width ? oldRect.width / newRect.width : 1;
      const sy = newRect.height ? oldRect.height / newRect.height : 1;
      const animation = card.animate([
        { transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`, opacity: .96 },
        { transform: "translate3d(0,0,0) scale(1,1)", opacity: 1 }
      ], { duration: 560, easing });
      animations.push(animation.finished.catch(() => {}));
      return;
    }

    const enterDistance = direction >= 0 ? 34 : -34;
    const animation = card.animate([
      { transform: `translate3d(${enterDistance}px,0,0) scale(.9)`, opacity: 0 },
      { transform: "translate3d(0,0,0) scale(1)", opacity: 1 }
    ], { duration: 470, delay: 35, easing });
    animations.push(animation.finished.catch(() => {}));
  });

  leaving.forEach((card) => {
    const leaveDistance = direction >= 0 ? -24 : 24;
    const animation = card.animate([
      { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
      { transform: `translate3d(${leaveDistance}px,0,0) scale(.88)`, opacity: 0 }
    ], { duration: 300, easing: "ease-out", fill: "forwards" });
    animations.push(animation.finished.catch(() => {}));
  });

  await Promise.all(animations);
  leaving.forEach((card) => card.remove());
}

function updateHeroContent(destination) {
  const photo = primaryPhoto(destination);
  setText("journey-kicker", `${destination.category} · ${destination.region}`);
  setText("journey-title", destination.name);
  setText("journey-description", destination.description);
  setText("journey-highlight", destination.highlight || destination.bestFor || "Discover Uganda");

  const explore = document.getElementById("journey-explore");
  if (explore) explore.href = `./pages/destination-details.html?id=${destination.id}`;

  if (counter) counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(destinations.length).padStart(2, "0")}`;
  if (photoCredit) {
    photoCredit.textContent = photo.credit ? `Photo · ${photo.credit}` : "Destination photo";
    photoCredit.href = photo.sourceUrl || "https://unsplash.com";
  }
  renderJourneyDots();
}

async function animateCopyChange(destination) {
  if (!copyBlock || reduceMotion || !copyBlock.animate) {
    updateHeroContent(destination);
    return;
  }

  await copyBlock.animate([
    { opacity: 1, transform: "translateY(0)" },
    { opacity: 0, transform: "translateY(-16px)" }
  ], { duration: 190, easing: "ease-in", fill: "forwards" }).finished;

  updateHeroContent(destination);

  await copyBlock.animate([
    { opacity: 0, transform: "translateY(20px)" },
    { opacity: 1, transform: "translateY(0)" }
  ], { duration: 420, easing: "cubic-bezier(.18,.82,.2,1)", fill: "forwards" }).finished;
}

async function crossfadeBackground(destination) {
  const nextSrc = resolveAssetPath(primaryImage(destination), ".");
  if (!backgroundLayers.length) return;

  const currentLayer = backgroundLayers[activeBackgroundIndex];
  const nextIndex = backgroundLayers.length > 1 ? (activeBackgroundIndex + 1) % backgroundLayers.length : activeBackgroundIndex;
  const nextLayer = backgroundLayers[nextIndex];
  if (!nextLayer) return;

  if (nextLayer.src !== new URL(nextSrc, window.location.href).href) nextLayer.src = nextSrc;
  try { await nextLayer.decode?.(); } catch { /* browser can still display it */ }

  if (reduceMotion || backgroundLayers.length === 1) {
    currentLayer?.classList.remove("is-active");
    nextLayer.classList.add("is-active");
    activeBackgroundIndex = nextIndex;
    return;
  }

  nextLayer.classList.add("is-active");
  currentLayer?.classList.remove("is-active");
  await new Promise((resolve) => window.setTimeout(resolve, 920));
  activeBackgroundIndex = nextIndex;
}

async function changeDestination(nextIndex, sourceCard = null, directionHint = 1) {
  if (!destinations.length || transitionLocked) return;
  const normalized = (nextIndex + destinations.length) % destinations.length;
  if (normalized === activeIndex) {
    restartAutoplay();
    return;
  }

  transitionLocked = true;
  const destination = destinations[normalized];
  sourceCard?.classList.add("is-transition-source");

  const queueAnimation = animateJourneyQueue(normalized, directionHint);
  activeIndex = normalized;
  restartAutoplay();

  try {
    await Promise.all([
      crossfadeBackground(destination),
      animateCopyChange(destination),
      queueAnimation
    ]);
  } finally {
    sourceCard?.classList.remove("is-transition-source");
    transitionLocked = false;
  }
}

function restartProgressAnimation() {
  if (!progressFill) return;
  progressFill.style.animation = "none";
  void progressFill.offsetWidth;
  progressFill.style.animation = autoplayPaused || reduceMotion ? "none" : `journey-progress ${AUTOPLAY_MS}ms linear forwards`;
}

function restartAutoplay() {
  clearTimeout(autoplayTimer);
  restartProgressAnimation();
  if (autoplayPaused || reduceMotion || destinations.length < 2) return;
  autoplayTimer = setTimeout(() => changeDestination(activeIndex + 1, null, 1), AUTOPLAY_MS);
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
  window.location.href = `./pages/destinations.html?q=${encodeURIComponent(term)}&results=1`;
}

function getContentSnapTop() {
  if (!contentSurface) return 0;
  return contentSurface.getBoundingClientRect().top + window.scrollY;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateWindowScroll(targetY, duration = HANDOFF_DURATION_MS) {
  const startY = window.scrollY;
  const distance = targetY - startY;

  if (reduceMotion || Math.abs(distance) < 2) {
    window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
    return Promise.resolve();
  }

  const root = document.documentElement;
  const body = document.body;
  const previousRootBehavior = root.style.scrollBehavior;
  const previousBodyBehavior = body.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";

  return new Promise((resolve) => {
    const startedAt = performance.now();
    function frame(now) {
      const progress = clamp((now - startedAt) / duration);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + (distance * eased));
      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }
      window.scrollTo(0, targetY);
      root.style.scrollBehavior = previousRootBehavior;
      body.style.scrollBehavior = previousBodyBehavior;
      resolve();
    }
    requestAnimationFrame(frame);
  });
}

function createHandoffAnimations(direction) {
  if (reduceMotion || !slider?.animate || !contentSurface?.animate) return [];

  const down = direction === "down";
  const easing = "cubic-bezier(.22,.78,.18,1)";
  const duration = HANDOFF_DURATION_MS;

  const heroFrames = down
    ? [
        { opacity: 1, transform: "translate3d(0,0,0) scale(1)", filter: "blur(0px)", offset: 0 },
        { opacity: .96, transform: "translate3d(0,-6px,0) scale(.997)", filter: "blur(0px)", offset: .28 },
        { opacity: .38, transform: "translate3d(0,-42px,0) scale(.988)", filter: "blur(1.2px)", offset: .78 },
        { opacity: .08, transform: "translate3d(0,-58px,0) scale(.982)", filter: "blur(1.8px)", offset: 1 }
      ]
    : [
        { opacity: .08, transform: "translate3d(0,-58px,0) scale(.982)", filter: "blur(1.8px)", offset: 0 },
        { opacity: .42, transform: "translate3d(0,-36px,0) scale(.989)", filter: "blur(1px)", offset: .42 },
        { opacity: .96, transform: "translate3d(0,5px,0) scale(1.002)", filter: "blur(0px)", offset: .88 },
        { opacity: 1, transform: "translate3d(0,0,0) scale(1)", filter: "blur(0px)", offset: 1 }
      ];

  const contentFrames = down
    ? [
        { opacity: .12, transform: "translate3d(0,120px,0) scale(.992)", offset: 0 },
        { opacity: .42, transform: "translate3d(0,70px,0) scale(.995)", offset: .46 },
        { opacity: 1, transform: "translate3d(0,-12px,0) scale(1)", offset: .9 },
        { opacity: 1, transform: "translate3d(0,0,0) scale(1)", offset: 1 }
      ]
    : [
        { opacity: 1, transform: "translate3d(0,0,0) scale(1)", offset: 0 },
        { opacity: .96, transform: "translate3d(0,10px,0) scale(.999)", offset: .18 },
        { opacity: .4, transform: "translate3d(0,78px,0) scale(.994)", offset: .7 },
        { opacity: .1, transform: "translate3d(0,120px,0) scale(.992)", offset: 1 }
      ];

  const animations = [
    slider.animate(heroFrames, { duration, easing, fill: "both" }),
    contentSurface.animate(contentFrames, { duration, easing, fill: "both" })
  ];

  if (copyBlock?.animate) {
    animations.push(copyBlock.animate(down
      ? [{ opacity: 1, transform: "translateY(0)" }, { opacity: .82, transform: "translateY(-8px)", offset: .25 }, { opacity: 0, transform: "translateY(-34px)" }]
      : [{ opacity: 0, transform: "translateY(-30px)" }, { opacity: .78, transform: "translateY(7px)", offset: .72 }, { opacity: 1, transform: "translateY(0)" }],
    { duration: duration * .78, easing, fill: "both" }));
  }

  if (cardRail?.animate) {
    animations.push(cardRail.animate(down
      ? [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(34px)" }]
      : [{ opacity: 0, transform: "translateY(32px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: duration * .72, easing, fill: "both" }));
  }

  return animations;
}

async function runHomeHandoff(direction) {
  if (homeHandoffLocked || !slider || !contentSurface) return;

  const contentTop = getContentSnapTop();
  if (contentTop <= 0) return;

  const targetY = direction === "down" ? contentTop : 0;
  homeHandoffLocked = true;
  document.documentElement.classList.add("home-handoff-running", `home-handoff-${direction}`);
  const animations = createHandoffAnimations(direction);

  try {
    if (reduceMotion) window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
    else {
      await Promise.all([
        animateWindowScroll(targetY),
        ...animations.map((animation) => animation.finished.catch(() => {}))
      ]);
    }
  } finally {
    window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
    animations.forEach((animation) => animation.cancel());
    document.documentElement.classList.remove("home-handoff-running", "home-handoff-down", "home-handoff-up");
    homeHandoffLocked = false;
    handoffCooldownUntil = performance.now() + 320;
    wheelIntent = 0;
  }
}

function resetWheelIntentSoon() {
  clearTimeout(wheelIntentTimer);
  wheelIntentTimer = window.setTimeout(() => { wheelIntent = 0; }, 150);
}

function handleHomeWheel(event) {
  if (!slider || !contentSurface) return;
  if (homeHandoffLocked || performance.now() < handoffCooldownUntil) {
    event.preventDefault();
    return;
  }

  const y = window.scrollY;
  const contentTop = getContentSnapTop();
  const atHero = y <= 10;
  const atContentBoundary = y >= contentTop - 8 && y <= contentTop + 64;

  if (atHero && event.deltaY > 0) {
    event.preventDefault();
    wheelIntent += Math.abs(event.deltaY);
    resetWheelIntentSoon();
    if (wheelIntent >= WHEEL_TRIGGER) runHomeHandoff("down");
    return;
  }

  if (atContentBoundary && event.deltaY < 0) {
    event.preventDefault();
    wheelIntent += Math.abs(event.deltaY);
    resetWheelIntentSoon();
    if (wheelIntent >= WHEEL_TRIGGER) runHomeHandoff("up");
    return;
  }

  wheelIntent = 0;
}

function handleTouchStart(event) {
  if (event.touches.length !== 1) return;
  touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
  if (touchStartY == null || !slider || !contentSurface) return;
  if (homeHandoffLocked) {
    event.preventDefault();
    return;
  }

  const currentY = event.touches[0]?.clientY;
  if (currentY == null) return;
  const gesture = touchStartY - currentY;
  const y = window.scrollY;
  const contentTop = getContentSnapTop();
  const atHero = y <= 10;
  const atContentBoundary = y >= contentTop - 8 && y <= contentTop + 54;

  if (atHero && gesture > 0) {
    event.preventDefault();
    if (gesture >= TOUCH_TRIGGER) {
      touchStartY = null;
      runHomeHandoff("down");
    }
    return;
  }

  if (atContentBoundary && gesture < 0) {
    event.preventDefault();
    if (Math.abs(gesture) >= TOUCH_TRIGGER) {
      touchStartY = null;
      runHomeHandoff("up");
    }
  }
}

function handleHomeKeydown(event) {
  if (homeHandoffLocked || event.altKey || event.ctrlKey || event.metaKey) return;
  const activeTag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) return;

  const y = window.scrollY;
  const contentTop = getContentSnapTop();
  const atHero = y <= 10;
  const atContentBoundary = y >= contentTop - 8 && y <= contentTop + 50;
  const downKeys = new Set(["ArrowDown", "PageDown", " "]);
  const upKeys = new Set(["ArrowUp", "PageUp"]);

  if (atHero && downKeys.has(event.key)) {
    event.preventDefault();
    runHomeHandoff("down");
  } else if (atContentBoundary && upKeys.has(event.key)) {
    event.preventDefault();
    runHomeHandoff("up");
  }
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
    renderJourneyQueue();

    if (searchMessage) searchMessage.textContent = `${destinations.length} destinations ready to explore.`;
    restartAutoplay();
  } catch (error) {
    console.error(error);
    if (searchMessage) searchMessage.textContent = error.message;
    setText("journey-title", "Start the UgoTour API");
    setText("journey-description", "The animated destination experience loads from your PostgreSQL-backed API.");
  }
}


// Phase 1.20: mood cards are quick filters that use the same results mode as
// Home/Destinations search. The destination page owns the actual filtering.
document.querySelectorAll(".travel-mood-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    const target = new URL(card.href, window.location.href);
    target.searchParams.set("results", "1");
    window.location.assign(target.href);
  });
});

searchButton?.addEventListener("click", submitSearch);
searchInput?.addEventListener("keydown", (event) => { if (event.key === "Enter") submitSearch(); });
slider?.addEventListener("pointerenter", () => setAutoplayPaused(true));
slider?.addEventListener("pointerleave", () => setAutoplayPaused(false));
slider?.addEventListener("focusin", () => setAutoplayPaused(true));
slider?.addEventListener("focusout", (event) => {
  if (!slider.contains(event.relatedTarget)) setAutoplayPaused(false);
});
document.addEventListener("visibilitychange", () => setAutoplayPaused(document.hidden));
window.addEventListener("wheel", handleHomeWheel, { passive: false });
window.addEventListener("touchstart", handleTouchStart, { passive: true });
window.addEventListener("touchmove", handleTouchMove, { passive: false });
window.addEventListener("touchend", () => { touchStartY = null; }, { passive: true });
window.addEventListener("keydown", handleHomeKeydown);
scrollCue?.addEventListener("click", (event) => {
  event.preventDefault();
  runHomeHandoff("down");
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttribute(value) { return escapeHtml(value); }

await initialize();
