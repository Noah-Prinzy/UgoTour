// ============================================================
// TRIP PLAN API SERVICE - PHASE 9
// ============================================================
// Trip plans live in PostgreSQL. Browser authentication is handled by the API
// with an HttpOnly session cookie; JavaScript does not store session tokens.

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
