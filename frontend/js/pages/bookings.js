import "../ui-motion.js";
import { ApiError } from "../api.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { cancelBooking, getBookings } from "../services/booking-service.js";
import { resolveAssetPath } from "../utils/assets.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";

let currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const bookingList = document.getElementById("booking-list");
const emptyState = document.getElementById("booking-empty-state");
const authState = document.getElementById("booking-auth-state");
const bookingTotal = document.getElementById("booking-total");
const bookingStatus = document.getElementById("booking-status");
let bookings = [];

async function loadBookings() {
  if (bookingStatus) bookingStatus.textContent = "Loading your trips…";
  try {
    bookings = await getBookings();
    renderBookings();
    if (bookingStatus) bookingStatus.textContent = `${bookings.length} planned visit${bookings.length === 1 ? "" : "s"}.`;
  } catch (error) {
    console.error(error);
    if (error instanceof ApiError && error.status === 401) return showAuthenticationState();
    if (bookingStatus) bookingStatus.textContent = error.message;
  }
}

function showAuthenticationState() {
  if (bookingList) bookingList.hidden = true;
  if (emptyState) emptyState.hidden = true;
  if (authState) authState.hidden = false;
  if (bookingTotal) bookingTotal.textContent = "0";
  if (bookingStatus) bookingStatus.textContent = "Login to see your planned trips.";
}

function renderBookings() {
  if (!bookingList || !emptyState || !bookingTotal || !authState) return;
  bookingList.innerHTML = "";
  bookingTotal.textContent = bookings.length;
  authState.hidden = true;
  bookingList.hidden = bookings.length === 0;
  emptyState.hidden = bookings.length !== 0;
  bookings.forEach((booking) => bookingList.appendChild(createBookingCard(booking)));
}

function createBookingCard(booking) {
  const article = document.createElement("article");
  article.className = "booking-card";
  article.dataset.bookingId = booking.id;
  const imageUrl = resolveAssetPath(booking.destinationImageUrl, "..");
  article.innerHTML = `
    <div class="booking-card-image"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(booking.destinationName)}" loading="lazy" /></div>
    <div class="booking-card-body">
      <div class="booking-card-heading">
        <div><span class="tag">${escapeHtml(booking.destinationCategory || "Destination")}</span><h3>${escapeHtml(booking.destinationName)}</h3><p>${escapeHtml(booking.destinationRegion || "Uganda")}</p></div>
        <a class="booking-details-link" href="./destination-details.html?id=${booking.destinationId}">View destination →</a>
      </div>
      <dl class="booking-meta-grid">
        <div><dt>Travel date</dt><dd>${formatDate(booking.travelDate)}</dd></div>
        <div><dt>Travellers</dt><dd>${booking.travellers}</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(booking.status || "confirmed")}</dd></div>
        <div><dt>Account</dt><dd>${escapeHtml(currentUser?.email || "Current user")}</dd></div>
      </dl>
      <button class="cancel-booking-button" type="button" data-cancel-booking="${booking.id}">Cancel booking</button>
    </div>`;
  return article;
}

function formatDate(value) { return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }

bookingList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-cancel-booking]");
  if (!button) return;
  button.disabled = true; button.textContent = "Cancelling…";
  try {
    await cancelBooking(button.dataset.cancelBooking);
    bookings = bookings.filter((booking) => booking.id !== Number(button.dataset.cancelBooking));
    renderBookings();
    if (bookingStatus) bookingStatus.textContent = "Booking cancelled.";
  } catch (error) {
    button.disabled = false; button.textContent = "Cancel booking";
    if (bookingStatus) bookingStatus.textContent = error.message;
  }
});

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
await loadBookings();
