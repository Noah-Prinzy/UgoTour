// ============================================================
// DESTINATION DETAILS PAGE CONTROLLER - PHASE 7
// ============================================================
// The selected destination and current user are loaded from the REST API.
// Booking submission now creates a PostgreSQL booking instead of localStorage.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getDestinationById } from "../services/destination-service.js";
import { createBooking } from "../services/booking-service.js";
import { getCurrentUser } from "../services/auth-service.js";
import {
  isFutureOrToday,
  isValidTravellerCount
} from "../utils/validation.js";

await renderNavbar("..");
renderFooter();

const urlParameters = new URLSearchParams(window.location.search);
const destinationId = urlParameters.get("id");

const detailsShell = document.getElementById("destination-details-shell");
const notFoundSection = document.getElementById("destination-not-found");
const categoryElement = document.getElementById("details-category");
const regionElement = document.getElementById("details-region");
const nameElement = document.getElementById("details-name");
const descriptionElement = document.getElementById("details-description");
const highlightElement = document.getElementById("details-highlight");
const daysElement = document.getElementById("details-days");
const bestForElement = document.getElementById("details-best-for");
const activitiesElement = document.getElementById("details-activities");
const travelTipElement = document.getElementById("details-travel-tip");

const bookingForm = document.getElementById("booking-form");
const bookingName = document.getElementById("booking-name");
const bookingEmail = document.getElementById("booking-email");
const bookingDate = document.getElementById("booking-date");
const bookingTravellers = document.getElementById("booking-travellers");
const bookingMessage = document.getElementById("booking-message");
const bookingSubmit = bookingForm?.querySelector('button[type="submit"]');
const bookingLoginNote = document.getElementById("booking-login-note");

let destination = null;
let currentUser = null;

async function initializePage() {
  try {
    destination = await getDestinationById(destinationId);
  } catch (error) {
    console.error("Could not load destination:", error);
    showBookingMessage(error.message, "error");
  }

  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    // Destination viewing remains available even if the profile check fails.
    console.error("Could not load booking identity:", error);
  }

  if (!destination) {
    if (detailsShell) detailsShell.hidden = true;
    if (notFoundSection) notFoundSection.hidden = false;
    return;
  }

  renderDestinationDetails();
  prepareBookingDateInput();
  prepareBookingIdentity();
}

function renderDestinationDetails() {
  document.title = `${destination.name} | UgoTour`;

  if (categoryElement) categoryElement.textContent = destination.category;
  if (regionElement) regionElement.textContent = destination.region;
  if (nameElement) nameElement.textContent = destination.name;
  if (descriptionElement) descriptionElement.textContent = destination.description;
  if (highlightElement) highlightElement.textContent = destination.highlight;

  const suggestedDays = Number(destination.suggestedDays || 1);
  if (daysElement) {
    daysElement.textContent = `${suggestedDays} day${suggestedDays === 1 ? "" : "s"}`;
  }

  if (bestForElement) {
    bestForElement.textContent = destination.bestFor || "Uganda explorers";
  }

  if (travelTipElement) {
    travelTipElement.textContent = destination.travelTip || "Plan travel time and activities before departure.";
  }

  if (activitiesElement) {
    activitiesElement.innerHTML = "";
    const activities = Array.isArray(destination.activities) ? destination.activities : [];

    activities.forEach((activity) => {
      const listItem = document.createElement("li");
      listItem.textContent = activity;
      activitiesElement.appendChild(listItem);
    });
  }
}

function prepareBookingDateInput() {
  if (!bookingDate) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  bookingDate.min = `${year}-${month}-${day}`;
}

function prepareBookingIdentity() {
  const isLoggedIn = Boolean(currentUser);

  if (bookingName) {
    bookingName.value = currentUser?.name ?? "";
    bookingName.disabled = !isLoggedIn;
  }

  if (bookingEmail) {
    bookingEmail.value = currentUser?.email ?? "";
    bookingEmail.disabled = !isLoggedIn;
  }

  if (bookingDate) bookingDate.disabled = !isLoggedIn;
  if (bookingTravellers) bookingTravellers.disabled = !isLoggedIn;
  if (bookingSubmit) bookingSubmit.disabled = !isLoggedIn;

  if (bookingLoginNote) {
    bookingLoginNote.hidden = isLoggedIn;
  }

  if (!isLoggedIn) {
    showBookingMessage("Log in before creating a booking.", "error");
  }
}

bookingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!destination || !currentUser) {
    showBookingMessage("Log in before creating a booking.", "error");
    return;
  }

  const travelDate = bookingDate?.value ?? "";
  const travellers = Number(bookingTravellers?.value ?? 0);

  if (!isFutureOrToday(travelDate)) {
    showBookingMessage("Please choose today or a future travel date.", "error");
    return;
  }

  if (!isValidTravellerCount(travellers)) {
    showBookingMessage("Travellers must be between 1 and 20.", "error");
    return;
  }

  setBookingBusy(true);

  try {
    await createBooking({
      destinationId: destination.id,
      travelDate,
      travellers
    });

    showBookingMessage(
      `Booking saved to PostgreSQL for ${destination.name}.`,
      "success"
    );

    if (bookingDate) bookingDate.value = "";
    if (bookingTravellers) bookingTravellers.value = "1";
    prepareBookingDateInput();
  } catch (error) {
    console.error("Booking error:", error);
    showBookingMessage(error.message, "error");
  } finally {
    setBookingBusy(false);
  }
});

function setBookingBusy(isBusy) {
  if (!bookingSubmit) return;

  bookingSubmit.disabled = isBusy || !currentUser;
  bookingSubmit.textContent = isBusy ? "Saving booking..." : "Save booking";
}

function showBookingMessage(message, type) {
  if (!bookingMessage) return;

  bookingMessage.textContent = message;
  bookingMessage.classList.remove("is-error", "is-success");
  bookingMessage.classList.add(type === "success" ? "is-success" : "is-error");
}

await initializePage();
