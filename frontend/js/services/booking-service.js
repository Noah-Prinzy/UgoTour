// ============================================================
// BOOKING API SERVICE - PHASE 7
// ============================================================
// Bookings now live in PostgreSQL. localStorage is no longer used to persist
// booking records; it holds only the current bearer token through api.js.

import { apiRequest } from "../api.js";

export async function getBookings() {
  const payload = await apiRequest("/bookings", {
    authenticated: true
  });

  return payload.data;
}

export async function createBooking({ destinationId, travelDate, travellers }) {
  const payload = await apiRequest("/bookings", {
    method: "POST",
    authenticated: true,
    body: {
      destinationId: Number(destinationId),
      travelDate,
      travellers: Number(travellers)
    }
  });

  return payload.data;
}

export async function cancelBooking(bookingId) {
  await apiRequest(`/bookings/${Number(bookingId)}`, {
    method: "DELETE",
    authenticated: true
  });
}
