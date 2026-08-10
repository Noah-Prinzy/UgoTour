// ============================================================
// BOOKINGS PAGE CONTROLLER - PHASE 3
// ============================================================
// This page reads the temporary bookings from localStorage, renders
// them with JavaScript and allows a user to cancel a saved booking.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { cancelBooking, getBookings } from "../services/booking-service.js";

renderNavbar("..");
renderFooter();

const bookingList = document.getElementById("booking-list");
const emptyState = document.getElementById("booking-empty-state");
const bookingTotal = document.getElementById("booking-total");

// ============================================================
// 1. RENDER ALL SAVED BOOKINGS
// ============================================================

function renderBookings() {
  if (!bookingList || !emptyState || !bookingTotal) return;

  const bookings = getBookings();
  bookingList.innerHTML = "";
  bookingTotal.textContent = bookings.length;

  // Show either the list or the empty-state message.
  bookingList.hidden = bookings.length === 0;
  emptyState.hidden = bookings.length !== 0;

  bookings.forEach((booking) => {
    bookingList.appendChild(createBookingCard(booking));
  });
}

// ============================================================
// 2. BUILD ONE BOOKING CARD
// ============================================================

function createBookingCard(booking) {
  const article = document.createElement("article");
  article.className = "booking-card";
  article.dataset.bookingId = booking.id;

  article.innerHTML = `
    <div class="booking-card-heading">
      <div>
        <span class="tag">${booking.destinationCategory}</span>
        <h3>${booking.destinationName}</h3>
        <p>${booking.destinationRegion}</p>
      </div>

      <a
        class="booking-details-link"
        href="./destination-details.html?id=${booking.destinationId}"
      >
        Destination details
      </a>
    </div>

    <dl class="booking-meta-grid">
      <div>
        <dt>Travel date</dt>
        <dd>${formatDate(booking.date)}</dd>
      </div>

      <div>
        <dt>Travellers</dt>
        <dd>${booking.travellers}</dd>
      </div>

      <div>
        <dt>Booked for</dt>
        <dd>${booking.name}</dd>
      </div>

      <div>
        <dt>Email</dt>
        <dd>${booking.email}</dd>
      </div>
    </dl>

    <button
      class="cancel-booking-button"
      type="button"
      data-cancel-booking="${booking.id}"
    >
      Cancel booking
    </button>
  `;

  return article;
}

// Format YYYY-MM-DD into a friendlier date using the browser's Intl API.
function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

// ============================================================
// 3. CANCEL A BOOKING
// ============================================================
// Event delegation means one listener can manage every dynamically
// created Cancel button.

bookingList?.addEventListener("click", (event) => {
  const cancelButton = event.target.closest("[data-cancel-booking]");

  if (!cancelButton) return;

  cancelBooking(cancelButton.dataset.cancelBooking);
  renderBookings();
});

// Initial page render.
renderBookings();
