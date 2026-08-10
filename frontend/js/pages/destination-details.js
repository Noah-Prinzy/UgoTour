import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getDestinationById } from "../services/destination-service.js";
import { createBooking } from "../services/booking-service.js";
import { isFutureOrToday, isValidTravellerCount } from "../utils/validation.js";
import { resolveAssetPath } from "../utils/assets.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";

let currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const params = new URLSearchParams(window.location.search);
const destinationId = Number(params.get("id"));
const bookingForm = document.getElementById("booking-form");
const bookingDate = document.getElementById("booking-date");
const bookingTravellers = document.getElementById("booking-travellers");
const bookingName = document.getElementById("booking-name");
const bookingEmail = document.getElementById("booking-email");
const bookingSubmit = document.getElementById("booking-submit");
const bookingMessage = document.getElementById("booking-message");
const bookingLoginNote = document.getElementById("booking-login-note");
let destination = null;

async function initializePage() {
  prepareBookingDateInput();
  try {
    destination = await getDestinationById(destinationId);

    if (!destination) {
      setText("details-name", "Destination not found");
      setText("details-description", "This destination could not be loaded from the UgoTour API.");
      bookingForm?.setAttribute("hidden", "");
      return;
    }

    renderDestination(destination);
    prepareBookingIdentity();
  } catch (error) {
    console.error(error);
    setText("details-name", "Could not load destination");
    setText("details-description", error.message);
  }
}

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

  renderDestinationGallery(item);

  const activities = document.getElementById("details-activities");
  if (activities) {
    activities.innerHTML = "";
    (item.activities || []).forEach((activity) => {
      const li = document.createElement("li");
      li.textContent = activity;
      activities.appendChild(li);
    });
  }
}

function getDestinationPhotos(item) {
  const gallery = Array.isArray(item.galleryImages) ? item.galleryImages : [];
  if (gallery.length) return gallery;

  return [{
    url: item.imageUrl,
    credit: item.photoCredit,
    sourceUrl: item.photoSourceUrl
  }].filter((photo) => photo.url);
}

function renderDestinationGallery(item) {
  const gallery = document.getElementById("details-gallery");
  const photos = getDestinationPhotos(item);

  if (!photos.length) return;

  setDetailsPhoto(photos[0], item, false);

  if (!gallery) return;
  gallery.innerHTML = "";

  photos.forEach((photo, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `details-gallery-thumb${index === 0 ? " is-active" : ""}`;
    button.setAttribute("aria-label", `Show ${item.name} photo ${index + 1}`);
    button.innerHTML = `<img src="${resolveAssetPath(photo.url, "..")}" alt="" loading="lazy" />`;

    button.addEventListener("click", () => {
      gallery.querySelectorAll(".details-gallery-thumb").forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
      setDetailsPhoto(photo, item, true);
    });

    gallery.appendChild(button);
  });
}

function setDetailsPhoto(photo, item, animate = true) {
  const image = document.getElementById("details-image");
  const credit = document.getElementById("details-photo-credit");
  const nextSrc = resolveAssetPath(photo.url, "..");

  if (image) {
    const swap = () => {
      image.src = nextSrc;
      image.alt = item.name;
    };

    if (animate && image.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const out = image.animate(
        [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.035)" }],
        { duration: 180, easing: "ease-in", fill: "forwards" }
      );

      out.finished.then(() => {
        swap();
        image.animate(
          [{ opacity: 0, transform: "scale(.985)" }, { opacity: 1, transform: "scale(1)" }],
          { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
        );
      });
    } else {
      swap();
    }
  }

  if (credit) {
    credit.textContent = photo.credit ? `Photo: ${photo.credit} · Unsplash` : "Photo via Unsplash";
    credit.href = photo.sourceUrl || "https://unsplash.com";
  }
}

function prepareBookingDateInput() {
  if (!bookingDate) return;
  const today = new Date();
  bookingDate.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
}

function prepareBookingIdentity() {
  const loggedIn = Boolean(currentUser);
  if (bookingName) { bookingName.value = currentUser?.name ?? ""; bookingName.disabled = !loggedIn; }
  if (bookingEmail) { bookingEmail.value = currentUser?.email ?? ""; bookingEmail.disabled = !loggedIn; }
  if (bookingDate) bookingDate.disabled = !loggedIn;
  if (bookingTravellers) bookingTravellers.disabled = !loggedIn;
  if (bookingSubmit) bookingSubmit.disabled = !loggedIn;
  if (bookingLoginNote) bookingLoginNote.hidden = loggedIn;
  if (!loggedIn) showBookingMessage("Login before creating a booking.", "error");
}

bookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!destination || !currentUser) return showBookingMessage("Login before creating a booking.", "error");

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

// A lightweight visual favourite toggle. It is intentionally a device-only
// preference; account data and bookings still live on the backend.
document.getElementById("details-favorite")?.addEventListener("click", (event) => {
  const key = `ugotour_favourite_${destinationId}`;
  const saved = localStorage.getItem(key) === "1";
  localStorage.setItem(key, saved ? "0" : "1");
  event.currentTarget.textContent = saved ? "♡" : "♥";
});

function setBusy(busy) {
  if (!bookingSubmit) return;
  bookingSubmit.disabled = busy || !currentUser;
  bookingSubmit.textContent = busy ? "Saving…" : "Save booking";
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

await initializePage();
