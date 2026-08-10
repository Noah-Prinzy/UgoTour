import "./ui-motion.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { createDestinationCard } from "./components/destination-card.js";
import { getAllDestinations } from "./services/destination-service.js";
import { resolveAssetPath } from "./utils/assets.js";

await renderNavbar(".");
renderFooter();

const slider = document.getElementById("journey-slider");
const heroTransition = document.getElementById("home-hero-transition");
const contentSurface = document.getElementById("home-content");
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
const scrollCue = document.querySelector(".journey-scroll-cue");

const AUTOPLAY_MS = 6500;
const QUEUE_SIZE = 3;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let destinations = [];
let activeIndex = 0;
let transitionLocked = false;
let autoplayTimer = null;
let autoplayPaused = false;
let activeBackgroundIndex = 0;

// Phase 8.4: the Hero <-> Search handoff is gesture-triggered, not tied to
// every pixel of scroll. A single deliberate wheel/touch gesture starts the
// complete cinematic transition and locks out repeated gestures until it lands.
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
  const count = Math.min(QUEUE_SIZE, Math.max(0, destinations.length - 1));
  return Array.from({ length: count }, (_, offset) => (heroIndex + offset + 1) % destinations.length);
}

function createJourneyQueueCard(index, order) {
  const destination = destinations[index];
  const button = document.createElement("button");
  button.type = "button";
  button.className = `journey-card${order === 0 ? " is-next" : ""}`;
  button.dataset.index = String(index);
  button.dataset.queueOrder = String(order);
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", "false");
  button.setAttribute("aria-label", order === 0 ? `Next destination: ${destination.name}` : `Show ${destination.name}`);

  const image = resolveAssetPath(primaryImage(destination), ".");
  button.innerHTML = `
    <img src="${escapeAttribute(image)}" alt="" />
    <span class="journey-card-shade" aria-hidden="true"></span>
    <span class="journey-card-order">${order === 0 ? "Next" : String(order + 1).padStart(2, "0")}</span>
    <span class="journey-card-copy">
      <small>${escapeHtml(destination.category)}</small>
      <strong>${escapeHtml(destination.name)}</strong>
    </span>
  `;

  button.addEventListener("click", () => changeDestination(index, button, 1));
  return button;
}

function renderJourneyQueue(heroIndex = activeIndex) {
  if (!cardRail) return;
  cardRail.innerHTML = "";
  queueIndicesFor(heroIndex).forEach((index, order) => {
    cardRail.appendChild(createJourneyQueueCard(index, order));
  });
}

async function animateJourneyQueue(nextHeroIndex, direction = 1) {
  if (!cardRail) return;

  const nextIndices = queueIndicesFor(nextHeroIndex);
  const oldCards = [...cardRail.querySelectorAll(".journey-card")];

  if (reduceMotion || !oldCards.length || !Element.prototype.animate) {
    renderJourneyQueue(nextHeroIndex);
    return;
  }

  const railRect = cardRail.getBoundingClientRect();
  const oldState = new Map(oldCards.map((card) => [
    Number(card.dataset.index),
    { rect: card.getBoundingClientRect() }
  ]));

  const disappearing = oldCards.filter((card) => !nextIndices.includes(Number(card.dataset.index)));
  const ghosts = disappearing.map((card) => {
    const rect = card.getBoundingClientRect();
    const ghost = card.cloneNode(true);
    ghost.classList.add("journey-card-ghost");
    ghost.style.left = `${rect.left - railRect.left}px`;
    ghost.style.top = `${rect.top - railRect.top}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.margin = "0";
    ghost.setAttribute("aria-hidden", "true");
    ghost.tabIndex = -1;
    cardRail.appendChild(ghost);
    return ghost;
  });

  oldCards.forEach((card) => card.remove());
  nextIndices.forEach((index, order) => cardRail.appendChild(createJourneyQueueCard(index, order)));

  const newCards = [...cardRail.querySelectorAll(".journey-card:not(.journey-card-ghost)")];
  const animations = [];
  const movementEasing = "cubic-bezier(.18,.82,.2,1)";

  newCards.forEach((card) => {
    const destinationIndex = Number(card.dataset.index);
    const previous = oldState.get(destinationIndex);

    if (previous) {
      const newRect = card.getBoundingClientRect();
      const deltaX = previous.rect.left - newRect.left;
      const deltaY = previous.rect.top - newRect.top;
      const animation = card.animate([
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)`, opacity: 0.88 },
        { transform: "translate3d(0, 0, 0)", opacity: 1 }
      ], { duration: 620, easing: movementEasing });
      animations.push(animation.finished.catch(() => {}));
      return;
    }

    const enterX = direction >= 0 ? 58 : -58;
    const animation = card.animate([
      { transform: `translate3d(${enterX}px, 8px, 0) scale(.955)`, opacity: 0 },
      { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 }
    ], { duration: 650, delay: 90, easing: movementEasing });
    animations.push(animation.finished.catch(() => {}));
  });

  ghosts.forEach((ghost) => {
    const exitX = direction >= 0 ? -44 : 44;
    const animation = ghost.animate([
      { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
      { transform: `translate3d(${exitX}px, -18px, 0) scale(.93)`, opacity: 0 }
    ], { duration: 430, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    animations.push(animation.finished.catch(() => {}));
  });

  await Promise.all(animations);
  ghosts.forEach((ghost) => ghost.remove());
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
}

async function animateCopyChange(destination) {
  if (!copyBlock || reduceMotion || !copyBlock.animate) {
    updateHeroContent(destination);
    return;
  }

  await copyBlock.animate([
    { opacity: 1, transform: "translateY(0)" },
    { opacity: 0, transform: "translateY(-18px)" }
  ], { duration: 210, easing: "ease-in", fill: "forwards" }).finished;

  updateHeroContent(destination);

  await copyBlock.animate([
    { opacity: 0, transform: "translateY(24px)" },
    { opacity: 1, transform: "translateY(0)" }
  ], { duration: 470, easing: "cubic-bezier(.18,.82,.2,1)", fill: "forwards" }).finished;
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
  const targetCard = sourceCard || cardRail?.querySelector(`[data-index="${normalized}"]`);
  targetCard?.classList.add("is-transition-source");

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
  window.location.href = `./pages/destinations.html?q=${encodeURIComponent(term)}`;
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

  // main.css enables smooth scrolling globally. For this one cinematic handoff
  // JavaScript owns the motion, so temporarily force frame-by-frame scrolling.
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

  // The whole photographic hero fades while the content surface rises/falls
  // into place. The final content keyframe has a tiny overshoot so the section
  // visibly settles — the soft snap the user requested.
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
    const copyFrames = down
      ? [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: .82, transform: "translateY(-8px)", offset: .25 },
          { opacity: 0, transform: "translateY(-34px)" }
        ]
      : [
          { opacity: 0, transform: "translateY(-30px)" },
          { opacity: .78, transform: "translateY(7px)", offset: .72 },
          { opacity: 1, transform: "translateY(0)" }
        ];
    animations.push(copyBlock.animate(copyFrames, { duration: duration * .78, easing, fill: "both" }));
  }

  if (cardRail?.animate) {
    const queueFrames = down
      ? [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(34px)", offset: 1 }
        ]
      : [
          { opacity: 0, transform: "translateY(32px)" },
          { opacity: 1, transform: "translateY(0)", offset: 1 }
        ];
    animations.push(cardRail.animate(queueFrames, { duration: duration * .72, easing, fill: "both" }));
  }

  return animations;
}

async function runHomeHandoff(direction) {
  if (homeHandoffLocked || !slider || !contentSurface) return;

  const contentTop = getContentSnapTop();
  if (contentTop <= 0) return;

  const down = direction === "down";
  const targetY = down ? contentTop : 0;
  homeHandoffLocked = true;
  document.documentElement.classList.add("home-handoff-running", `home-handoff-${direction}`);

  const animations = createHandoffAnimations(direction);

  try {
    if (reduceMotion) {
      window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
    } else {
      await Promise.all([
        animateWindowScroll(targetY),
        ...animations.map((animation) => animation.finished.catch(() => {}))
      ]);
    }
  } finally {
    // Always finish on an exact resting point. Cancelling the temporary WAAPI
    // animations restores normal CSS once the hero is fully off/on screen.
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

  // Touchpads often keep emitting momentum events after the user's initial
  // gesture. Briefly swallow that tail so the Search section stays perfectly
  // snapped instead of immediately drifting farther down the page.
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
  const gesture = touchStartY - currentY; // positive = finger moved up = scroll down
  const y = window.scrollY;
  const contentTop = getContentSnapTop();
  const atHero = y <= 10;
  const atContentBoundary = y >= contentTop - 8 && y <= contentTop + 54;

  if (atHero && gesture > 0) {
    // Hold the fullscreen hero still until the swipe is deliberate, then play
    // the full handoff rather than partially dragging the page.
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

    if (grid) {
      grid.innerHTML = "";
      destinations.slice(0, 3).forEach((destination) => {
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

document.getElementById("journey-prev")?.addEventListener("click", () => changeDestination(activeIndex - 1, null, -1));
document.getElementById("journey-next")?.addEventListener("click", () => changeDestination(activeIndex + 1, null, 1));
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

function escapeAttribute(value) {
  return escapeHtml(value);
}

await initialize();
