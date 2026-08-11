import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getDestinationById } from "../services/destination-service.js";
import { getAttractionById, getAttractionsByDestinationId } from "../services/attraction-service.js";
import { createBooking } from "../services/booking-service.js";
import { isFutureOrToday, isValidTravellerCount } from "../utils/validation.js";
import { resolveAssetPath } from "../utils/assets.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { getSavedStatus, toggleSavedPlace } from "../services/saved-service.js";

let currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const params = new URLSearchParams(window.location.search);
const destinationId = Number(params.get("id")) || null;
const standaloneAttractionId = destinationId ? null : (Number(params.get("attraction")) || null);
const bookingForm = document.getElementById("booking-form");
const bookingDate = document.getElementById("booking-date");
const bookingTravellers = document.getElementById("booking-travellers");
const bookingName = document.getElementById("booking-name");
const bookingEmail = document.getElementById("booking-email");
const bookingSubmit = document.getElementById("booking-submit");
const bookingMessage = document.getElementById("booking-message");
const bookingLoginNote = document.getElementById("booking-login-note");
const experience = document.getElementById("details-experience");
const gallery = document.getElementById("details-gallery");
const galleryDots = document.getElementById("details-gallery-dots");
const galleryCounter = document.getElementById("details-gallery-counter");
const progressFill = document.getElementById("details-progress-fill");
const backgroundLayers = [
  document.getElementById("details-bg-a"),
  document.getElementById("details-bg-b")
].filter(Boolean);

const AUTOPLAY_MS = 6200;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let destination = null;
let photos = [];
let activePhotoIndex = 0;
let activeBackgroundIndex = 0;
let galleryLocked = false;
let autoplayPaused = false;
let autoplayTimer = null;

async function initializePage() {
  prepareBookingDateInput();
  try {
    // Independent attractions (those without a parent destination) still use
    // this full-page details experience. This avoids sending map users into a
    // modal while keeping every map callout's "View details" action useful.
    if (standaloneAttractionId) {
      const attraction = await getAttractionById(standaloneAttractionId);
      if (!attraction) {
        setText("details-name", "Attraction not found");
        setText("details-description", "This attraction could not be loaded from the UgoTour API.");
        document.querySelector(".booking-panel")?.setAttribute("hidden", "");
        return;
      }

      destination = {
        ...attraction,
        activities: [attraction.highlight || `Explore ${attraction.name}`],
        bestFor: attraction.category || "Uganda explorers",
        suggestedDays: 1,
        travelTip: "Use the UgoTour map to understand the surrounding region and confirm current visitor arrangements before travelling."
      };

      renderDestination(destination);
      document.querySelector(".booking-panel")?.setAttribute("hidden", "");
      document.getElementById("details-attractions-section")?.setAttribute("hidden", "");
      return;
    }

    destination = await getDestinationById(destinationId);

    if (!destination) {
      setText("details-name", "Destination not found");
      setText("details-description", "This destination could not be loaded from the UgoTour API.");
      bookingForm?.setAttribute("hidden", "");
      return;
    }

    renderDestination(destination);
    // Attraction data is an enhancement. Keep the destination and booking
    // experience usable while an older local API process is still running.
    try {
      const attractions = await getAttractionsByDestinationId(destinationId);
      renderAttractions(attractions);
    } catch (error) {
      console.warn("Attractions are not available from this API process yet.", error);
    }
    prepareBookingIdentity();
  } catch (error) {
    console.error(error);
    setText("details-name", "Could not load destination");
    setText("details-description", error.message);
  }
}

function renderAttractions(attractions) {
  const section = document.getElementById("details-attractions-section");
  const list = document.getElementById("details-attractions");
  if (!section || !list || !attractions.length) return;

  section.hidden = false;
  list.innerHTML = "";
  attractions.forEach((attraction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "attraction-card";
    button.innerHTML = `
      <img src="${escapeAttribute(resolveAssetPath(attraction.imageUrl, ".."))}" alt="${escapeAttribute(attraction.name)}" loading="lazy" />
      <span class="attraction-card-copy">
        <small>${escapeHtml(attraction.category)}</small>
        <strong>${escapeHtml(attraction.name)}</strong>
        <span>${escapeHtml(attraction.description)}</span>
      </span>
    `;
    button.addEventListener("click", () => openAttraction(attraction));
    list.appendChild(button);
  });
}

function openAttraction(attraction) {
  const dialog = document.getElementById("attraction-dialog");
  const image = document.getElementById("attraction-dialog-image");
  if (!dialog || !image) return;
  image.src = resolveAssetPath(attraction.imageUrl, "..");
  image.alt = attraction.name;
  setText("attraction-dialog-category", attraction.category);
  setText("attraction-dialog-name", attraction.name);
  setText("attraction-dialog-location", [attraction.district, attraction.region].filter(Boolean).join(" · "));
  setText("attraction-dialog-description", attraction.description);
  setText("attraction-dialog-highlight", attraction.highlight || "A place worth exploring");
  const mapLink = document.getElementById("attraction-dialog-map-link");
  if (mapLink) mapLink.href = `./map.html?focus=attraction:${Number(attraction.id)}`;
  dialog.showModal();
}

document.getElementById("attraction-dialog-close")?.addEventListener("click", () => {
  document.getElementById("attraction-dialog")?.close();
});

document.getElementById("attraction-dialog")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

function renderDestination(item) {
  document.title = `${item.name} | UgoTour`;
  setText("details-category", item.category);
  setText("details-region", item.region);
  setText("details-name", item.name);
  setText("details-description", item.description);
  setText("details-highlight", item.highlight || "Explore the destination");
  setText("details-days", item.suggestedDays ? `${item.suggestedDays} day${item.suggestedDays === 1 ? "" : "s"}` : "Flexible");
  setText("details-best-for", item.bestFor || "Curious travellers");
  setText("details-travel-tip", item.travelTip || "Plan ahead and leave room for spontaneous discoveries.");
  initializeDestinationGallery(item);

  const activities = document.getElementById("details-activities");
  if (activities) {
    activities.innerHTML = "";
    (item.activities || []).forEach((activity, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(activity)}</strong>`;
      activities.appendChild(li);
    });
  }
}

function getDestinationPhotos(item) {
  const galleryImages = Array.isArray(item.galleryImages) ? item.galleryImages : [];
  if (galleryImages.length) return galleryImages;

  return [{
    url: item.imageUrl,
    credit: item.photoCredit,
    sourceUrl: item.photoSourceUrl
  }].filter((photo) => photo.url);
}

function initializeDestinationGallery(item) {
  photos = getDestinationPhotos(item);
  activePhotoIndex = 0;

  if (!photos.length) return;

  const firstSource = resolveAssetPath(photos[0].url, "..");
  backgroundLayers.forEach((layer, index) => {
    layer.src = firstSource;
    layer.classList.toggle("is-active", index === 0);
  });
  activeBackgroundIndex = 0;
  updatePhotoMeta();
  renderGalleryQueue();
  renderGalleryDots();
  restartAutoplay();
}

function queueIndicesFor(photoIndex) {
  const activeOrder = Math.floor(photos.length / 2);
  return Array.from(
    { length: photos.length },
    (_, order) => (photoIndex + order - activeOrder + photos.length) % photos.length
  );
}

function createGalleryCard(photoIndex, order) {
  const activeOrder = Math.floor(photos.length / 2);
  const isActive = order === activeOrder;
  const photo = photos[photoIndex];
  const button = document.createElement("button");
  button.type = "button";
  button.className = `details-photo-card${isActive ? " is-active" : ""}`;
  button.dataset.photoIndex = String(photoIndex);
  button.dataset.queueOrder = String(order);
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", isActive ? "true" : "false");
  button.setAttribute("aria-label", `${isActive ? "Current" : "Show"} ${destination.name} photo ${photoIndex + 1}`);
  button.innerHTML = `
    <img src="${escapeAttribute(resolveAssetPath(photo.url, ".."))}" alt="" />
    <span aria-hidden="true">${String(photoIndex + 1).padStart(2, "0")}</span>
  `;

  button.addEventListener("click", () => {
    const direction = order < activeOrder ? -1 : 1;
    changePhoto(photoIndex, direction);
  });
  return button;
}

function renderGalleryQueue() {
  if (!gallery) return;
  gallery.innerHTML = "";
  queueIndicesFor(activePhotoIndex).forEach((photoIndex, order) => {
    gallery.appendChild(createGalleryCard(photoIndex, order));
  });
}

function renderGalleryDots() {
  if (!galleryDots) return;
  galleryDots.innerHTML = "";
  photos.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `details-gallery-dot${index === activePhotoIndex ? " is-active" : ""}`;
    dot.setAttribute("aria-label", `Show photo ${index + 1}`);
    dot.setAttribute("aria-current", index === activePhotoIndex ? "true" : "false");
    dot.addEventListener("click", () => changePhoto(index, index > activePhotoIndex ? 1 : -1));
    galleryDots.appendChild(dot);
  });
}

async function animateGalleryQueue(nextPhotoIndex, direction) {
  if (!gallery) return;
  const nextIndices = queueIndicesFor(nextPhotoIndex);
  const oldCards = [...gallery.querySelectorAll(".details-photo-card")];

  if (reduceMotion || !oldCards.length || !Element.prototype.animate) {
    renderGalleryQueue();
    return;
  }

  const galleryRect = gallery.getBoundingClientRect();
  const oldState = new Map(oldCards.map((card) => [
    Number(card.dataset.photoIndex),
    card.getBoundingClientRect()
  ]));
  const ghosts = oldCards
    .filter((card) => !nextIndices.includes(Number(card.dataset.photoIndex)))
    .map((card) => {
      const rect = card.getBoundingClientRect();
      const ghost = card.cloneNode(true);
      ghost.classList.add("details-photo-card-ghost");
      delete ghost.dataset.queueOrder;
      Object.assign(ghost.style, {
        left: `${rect.left - galleryRect.left}px`,
        top: `${rect.top - galleryRect.top}px`,
        right: "auto",
        bottom: "auto",
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
      ghost.setAttribute("aria-hidden", "true");
      ghost.tabIndex = -1;
      gallery.appendChild(ghost);
      return ghost;
    });

  oldCards.forEach((card) => card.remove());
  nextIndices.forEach((photoIndex, order) => gallery.appendChild(createGalleryCard(photoIndex, order)));

  const animations = [];
  gallery.querySelectorAll(".details-photo-card:not(.details-photo-card-ghost)").forEach((card) => {
    const previousRect = oldState.get(Number(card.dataset.photoIndex));
    if (previousRect) {
      const nextRect = card.getBoundingClientRect();
      animations.push(card.animate([
        { transform: `translate3d(${previousRect.left - nextRect.left}px, ${previousRect.top - nextRect.top}px, 0)`, opacity: .82 },
        { transform: "translate3d(0, 0, 0)", opacity: 1 }
      ], { duration: 650, easing: "cubic-bezier(.18,.82,.2,1)" }).finished.catch(() => {}));
    } else {
      animations.push(card.animate([
        { transform: `translate3d(${direction >= 0 ? 52 : -52}px, 12px, 0) scale(.92)`, opacity: 0 },
        { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 }
      ], { duration: 650, easing: "cubic-bezier(.18,.82,.2,1)" }).finished.catch(() => {}));
    }
  });

  ghosts.forEach((ghost) => {
    animations.push(ghost.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 280,
      easing: "ease-out",
      fill: "forwards"
    }).finished.catch(() => {}));
  });

  await Promise.all(animations);
  ghosts.forEach((ghost) => ghost.remove());
}

async function crossfadeBackground(photo) {
  if (!backgroundLayers.length) return;
  const currentLayer = backgroundLayers[activeBackgroundIndex];
  const nextIndex = backgroundLayers.length > 1 ? (activeBackgroundIndex + 1) % backgroundLayers.length : 0;
  const nextLayer = backgroundLayers[nextIndex];
  const nextSource = resolveAssetPath(photo.url, "..");

  if (nextLayer.src !== new URL(nextSource, window.location.href).href) nextLayer.src = nextSource;
  try { await nextLayer.decode?.(); } catch { /* The browser can still show the source. */ }

  nextLayer.classList.add("is-active");
  currentLayer?.classList.remove("is-active");
  activeBackgroundIndex = nextIndex;
  if (!reduceMotion) await new Promise((resolve) => window.setTimeout(resolve, 900));
}

async function changePhoto(nextIndex, direction = 1) {
  if (galleryLocked || photos.length < 2) return;
  const normalized = (nextIndex + photos.length) % photos.length;
  if (normalized === activePhotoIndex) {
    restartAutoplay();
    return;
  }

  galleryLocked = true;
  activePhotoIndex = normalized;
  renderGalleryDots();
  updatePhotoMeta();
  restartAutoplay();

  try {
    await Promise.all([
      crossfadeBackground(photos[normalized]),
      animateGalleryQueue(normalized, direction)
    ]);
  } finally {
    galleryLocked = false;
  }
}

function updatePhotoMeta() {
  const photo = photos[activePhotoIndex];
  if (!photo) return;
  if (galleryCounter) galleryCounter.textContent = `${String(activePhotoIndex + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;

  const credit = document.getElementById("details-photo-credit");
  if (credit) {
    credit.textContent = photo.credit ? `Photo · ${photo.credit}` : `${destination.name} collection`;
    credit.href = photo.sourceUrl || "https://unsplash.com";
  }
}

function restartAutoplay() {
  clearTimeout(autoplayTimer);
  if (progressFill) {
    progressFill.style.animation = "none";
    void progressFill.offsetWidth;
    progressFill.style.animation = autoplayPaused || reduceMotion || photos.length < 2
      ? "none"
      : `details-progress ${AUTOPLAY_MS}ms linear forwards`;
  }
  if (autoplayPaused || reduceMotion || photos.length < 2) return;
  autoplayTimer = window.setTimeout(() => changePhoto(activePhotoIndex + 1, 1), AUTOPLAY_MS);
}

function setAutoplayPaused(paused) {
  autoplayPaused = paused;
  restartAutoplay();
}

function prepareBookingDateInput() {
  if (!bookingDate) return;
  const today = new Date();
  bookingDate.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function prepareBookingIdentity() {
  const loggedIn = Boolean(currentUser);
  if (bookingName) { bookingName.value = currentUser?.name ?? ""; bookingName.disabled = !loggedIn; }
  if (bookingEmail) { bookingEmail.value = currentUser?.email ?? ""; bookingEmail.disabled = !loggedIn; }
  if (bookingDate) bookingDate.disabled = !loggedIn;
  if (bookingTravellers) bookingTravellers.disabled = !loggedIn;
  if (bookingSubmit) bookingSubmit.disabled = !loggedIn;
  if (bookingLoginNote) bookingLoginNote.hidden = loggedIn;
  if (!loggedIn) showBookingMessage("Login before saving a trip plan.", "error");
}

bookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!destination || !currentUser) return showBookingMessage("Login before saving a trip plan.", "error");

  const travelDate = bookingDate?.value ?? "";
  const travellers = Number(bookingTravellers?.value ?? 0);
  if (!isFutureOrToday(travelDate)) return showBookingMessage("Choose today or a future travel date.", "error");
  if (!isValidTravellerCount(travellers)) return showBookingMessage("Travellers must be between 1 and 20.", "error");

  setBusy(true);
  try {
    await createBooking({ destinationId: destination.id, travelDate, travellers });
    showBookingMessage(`Trip to ${destination.name} saved.`, "success");
    if (bookingDate) bookingDate.value = "";
    if (bookingTravellers) bookingTravellers.value = "1";
  } catch (error) {
    showBookingMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
});

const favoriteButton = document.getElementById("details-favorite");
const favoritePlaceType = standaloneAttractionId ? "attraction" : "destination";
const favoritePlaceId = standaloneAttractionId || destinationId;
let favoriteSaved = false;
try { favoriteSaved = await getSavedStatus(favoritePlaceType, favoritePlaceId); } catch (error) { console.warn("Could not load saved status:", error); }
updateFavoriteButton(favoriteSaved);
favoriteButton?.addEventListener("click", async () => {
  if (favoriteButton.disabled) return;
  favoriteButton.disabled = true;
  try {
    favoriteSaved = await toggleSavedPlace(favoritePlaceType, favoritePlaceId, favoriteSaved);
    updateFavoriteButton(favoriteSaved);
  } catch (error) { console.error("Could not update saved place:", error); }
  finally { favoriteButton.disabled = false; }
});

function updateFavoriteButton(saved) {
  if (!favoriteButton) return;
  favoriteButton.textContent = saved ? "♥" : "♡";
  favoriteButton.setAttribute("aria-pressed", saved ? "true" : "false");
  favoriteButton.setAttribute("aria-label", saved ? "Remove saved place" : "Save place");
}

experience?.addEventListener("pointerenter", () => setAutoplayPaused(true));
experience?.addEventListener("pointerleave", () => setAutoplayPaused(false));
experience?.addEventListener("focusin", () => setAutoplayPaused(true));
experience?.addEventListener("focusout", (event) => {
  if (!experience.contains(event.relatedTarget)) setAutoplayPaused(false);
});
document.addEventListener("visibilitychange", () => setAutoplayPaused(document.hidden));

function setBusy(busy) {
  if (!bookingSubmit) return;
  bookingSubmit.disabled = busy || !currentUser;
  bookingSubmit.textContent = busy ? "Saving…" : "Save this journey";
}

function showBookingMessage(message, type) {
  if (!bookingMessage) return;
  bookingMessage.textContent = message;
  bookingMessage.className = `form-message ${type === "success" ? "is-success" : "is-error"}`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? "";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

await initializePage();
