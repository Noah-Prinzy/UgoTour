// ============================================================
// DESTINATION DETAILS PAGE CONTROLLER - PHASE 3
// ============================================================
// This page demonstrates URLSearchParams, .find()-style data access,
// DOM rendering, form validation, JavaScript objects and localStorage.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getDestinationById } from "../services/destination-service.js";
import { createBooking } from "../services/booking-service.js";
import {
  isFutureOrToday,
  isNotEmpty,
  isValidEmail,
  isValidTravellerCount
} from "../utils/validation.js";

renderNavbar("..");
renderFooter();

// ============================================================
// 1. READ THE DESTINATION ID FROM THE URL
// ============================================================
// Example URL: destination-details.html?id=3
// URLSearchParams lets JavaScript read the ?id=3 query parameter.

const urlParameters = new URLSearchParams(window.location.search);
const destinationId = urlParameters.get("id");
const destination = getDestinationById(destinationId);

// ============================================================
// 2. FIND PAGE ELEMENTS
// ============================================================

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

// ============================================================
// 3. HANDLE AN INVALID DESTINATION ID
// ============================================================

if (!destination) {
  if (detailsShell) detailsShell.hidden = true;
  if (notFoundSection) notFoundSection.hidden = false;
} else {
  renderDestinationDetails();
  prepareBookingDateInput();
}

// ============================================================
// 4. RENDER THE SELECTED DESTINATION
// ============================================================

function renderDestinationDetails() {
  if (!destination) return;

  document.title = `${destination.name} | UgoTour`;

  if (categoryElement) categoryElement.textContent = destination.category;
  if (regionElement) regionElement.textContent = destination.region;
  if (nameElement) nameElement.textContent = destination.name;
  if (descriptionElement) descriptionElement.textContent = destination.description;
  if (highlightElement) highlightElement.textContent = destination.highlight;
  if (daysElement) daysElement.textContent = `${destination.suggestedDays} day${destination.suggestedDays === 1 ? "" : "s"}`;
  if (bestForElement) bestForElement.textContent = destination.bestFor;
  if (travelTipElement) travelTipElement.textContent = destination.travelTip;

  // Activities are an array, so JavaScript creates one <li> for each item.
  if (activitiesElement) {
    activitiesElement.innerHTML = "";

    destination.activities.forEach((activity) => {
      const listItem = document.createElement("li");
      listItem.textContent = activity;
      activitiesElement.appendChild(listItem);
    });
  }
}

// ============================================================
// 5. PREPARE THE DATE FIELD
// ============================================================
// Setting min prevents most browsers from selecting dates before today.

function prepareBookingDateInput() {
  if (!bookingDate) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  bookingDate.min = `${year}-${month}-${day}`;
}

// ============================================================
// 6. VALIDATE AND SAVE A BOOKING
// ============================================================

bookingForm?.addEventListener("submit", (event) => {
  // Prevent the browser's normal form submission/page refresh.
  event.preventDefault();

  if (!destination || !bookingMessage) return;

  const name = bookingName?.value.trim() ?? "";
  const email = bookingEmail?.value.trim() ?? "";
  const date = bookingDate?.value ?? "";
  const travellers = Number(bookingTravellers?.value ?? 0);

  // Validate one rule at a time so the user receives useful feedback.
  if (!isNotEmpty(name)) {
    showBookingMessage("Please enter your full name.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showBookingMessage("Please enter a valid email address.", "error");
    return;
  }

  if (!isFutureOrToday(date)) {
    showBookingMessage("Please choose today or a future travel date.", "error");
    return;
  }

  if (!isValidTravellerCount(travellers)) {
    showBookingMessage("Travellers must be between 1 and 20.", "error");
    return;
  }

  // Build a plain JavaScript object representing the booking.
  const newBooking = {
    destinationId: destination.id,
    destinationName: destination.name,
    destinationRegion: destination.region,
    destinationCategory: destination.category,
    name,
    email,
    date,
    travellers
  };

  createBooking(newBooking);

  showBookingMessage(
    `Booking saved for ${destination.name}. You can view it on the Bookings page.`,
    "success"
  );

  bookingForm.reset();
  prepareBookingDateInput();

  // Reset traveller count because form.reset() restores the HTML default,
  // but being explicit makes the intended state easy to understand.
  if (bookingTravellers) bookingTravellers.value = "1";
});

function showBookingMessage(message, type) {
  if (!bookingMessage) return;

  bookingMessage.textContent = message;
  bookingMessage.classList.remove("is-error", "is-success");
  bookingMessage.classList.add(type === "success" ? "is-success" : "is-error");
}
