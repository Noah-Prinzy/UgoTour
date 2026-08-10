// ============================================================
// BOOKINGS PAGE CONTROLLER - PHASE 7
// ============================================================
// Bookings are loaded from PostgreSQL through the authenticated REST API.
// The browser no longer owns a local booking array.

import { ApiError } from "../api.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { cancelBooking, getBookings } from "../services/booking-service.js";
import { getCurrentUser } from "../services/auth-service.js";

await renderNavbar("..");
renderFooter();

const bookingList = document.getElementById("booking-list");
const emptyState = document.getElementById("booking-empty-state");
const authState = document.getElementById("booking-auth-state");
const bookingTotal = document.getElementById("booking-total");
const bookingStatus = document.getElementById("booking-status");

let currentUser = null;
let bookings = [];

async function loadBookings() {
  if (bookingStatus) bookingStatus.textContent = "Loading your bookings...";

  try {
    currentUser = await getCurrentUser();

    if (!currentUser) {
      showAuthenticationState();
      return;
    }

    bookings = await getBookings();
    renderBookings();

    if (bookingStatus) {
      bookingStatus.textContent = `${bookings.length} booking${bookings.length === 1 ? "" : "s"} loaded from PostgreSQL.`;
    }
  } catch (error) {
    console.error("Could not load bookings:", error);

    if (error instanceof ApiError && error.status === 401) {
      showAuthenticationState();
      return;
    }

    if (bookingStatus) bookingStatus.textContent = error.message;
  }
}

function showAuthenticationState() {
  if (bookingList) bookingList.hidden = true;
  if (emptyState) emptyState.hidden = true;
  if (authState) authState.hidden = false;
  if (bookingTotal) bookingTotal.textContent = "0";
  if (bookingStatus) bookingStatus.textContent = "Log in to view your database-backed bookings.";
}

function renderBookings() {
  if (!bookingList || !emptyState || !bookingTotal || !authState) return;

  bookingList.innerHTML = "";
  bookingTotal.textContent = bookings.length;
  authState.hidden = true;
  bookingList.hidden = bookings.length === 0;
  emptyState.hidden = bookings.length !== 0;

  bookings.forEach((booking) => {
    bookingList.appendChild(createBookingCard(booking));
  });
}

function createBookingCard(booking) {
  const article = document.createElement("article");
  article.className = "booking-card";
  article.dataset.bookingId = booking.id;

  article.innerHTML = `
    <div class="booking-card-heading">
      <div>
        <span class="tag">${escapeHtml(booking.destinationCategory || "Destination")}</span>
        <h3>${escapeHtml(booking.destinationName)}</h3>
        <p>${escapeHtml(booking.destinationRegion || "Uganda")}</p>
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
        <dd>${formatDate(booking.travelDate)}</dd>
      </div>

      <div>
        <dt>Travellers</dt>
        <dd>${booking.travellers}</dd>
      </div>

      <div>
        <dt>Status</dt>
        <dd>${escapeHtml(booking.status || "confirmed")}</dd>
      </div>

      <div>
        <dt>Account</dt>
        <dd>${escapeHtml(currentUser?.email || "Current user")}</dd>
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

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

bookingList?.addEventListener("click", async (event) => {
  const cancelButton = event.target.closest("[data-cancel-booking]");
  if (!cancelButton) return;

  cancelButton.disabled = true;
  cancelButton.textContent = "Cancelling...";

  try {
    await cancelBooking(cancelButton.dataset.cancelBooking);
    bookings = bookings.filter(
      (booking) => booking.id !== Number(cancelButton.dataset.cancelBooking)
    );
    renderBookings();

    if (bookingStatus) bookingStatus.textContent = "Booking cancelled successfully.";
  } catch (error) {
    console.error("Cancel booking error:", error);
    cancelButton.disabled = false;
    cancelButton.textContent = "Cancel booking";

    if (bookingStatus) bookingStatus.textContent = error.message;
  }
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

await loadBookings();
