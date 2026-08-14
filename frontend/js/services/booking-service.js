// ============================================================
// TRIP PLAN API SERVICE - PHASE 9
// ============================================================
// My Trips records live in PostgreSQL. This browser service contains only the
// API calls needed to list, create and cancel a planned visit. Authentication is
// carried by the HttpOnly session cookie; JavaScript does not store the token.

import { apiRequest } from "../api.js";

// GET the signed-in user's planned visits.
export async function getBookings() {
  const payload = await apiRequest("/bookings", {
    authenticated: true
  });

  return payload.data;
}

// POST a new planned visit after normalizing numeric ids/counts.
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

// DELETE one trip plan by its booking-table id.
export async function cancelBooking(bookingId) {
  await apiRequest(`/bookings/${Number(bookingId)}`, {
    method: "DELETE",
    authenticated: true
  });
}
