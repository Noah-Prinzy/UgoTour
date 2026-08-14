// ============================================================
// BOOKING / TRIP-PLAN CONTROLLER
// Handles the authenticated My Trips endpoints. In UgoTour these records are
// planned visits, not paid or confirmed tourism-company reservations.
// ============================================================

// Authentication, database-facing service functions and response helpers.
import { getAuthenticatedUser } from "../middleware/auth.js";
import {
  createBooking,
  deleteBookingForUser,
  getBookingsForUser
} from "../services/booking-service.js";
import { readJsonBody, sendJson, sendNoContent } from "../utils/http.js";
import { isNonEmptyString, isPositiveInteger } from "../utils/validation.js";

// GET /api/bookings
// Only return trip plans that belong to the currently authenticated user.
export async function listBookings(request, response) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  sendJson(response, 200, {
    data: await getBookingsForUser(user.id)
  });
}

// POST /api/bookings
// Validate destination/date/traveller input before asking the service to store it.
export async function postBooking(request, response) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  const body = await readJsonBody(request);

  if (!isPositiveInteger(body.destinationId)) {
    sendJson(response, 400, { error: "A valid destinationId is required." });
    return;
  }

  if (!isNonEmptyString(body.travelDate)) {
    sendJson(response, 400, { error: "A travelDate is required." });
    return;
  }

  if (!isPositiveInteger(body.travellers)) {
    sendJson(response, 400, { error: "travellers must be a positive whole number." });
    return;
  }

  const booking = await createBooking(user.id, body);
  sendJson(response, 201, { data: booking });
}

// DELETE /api/bookings/:id
// The service includes the user id in the DELETE condition so users cannot
// remove another account's trip plan by guessing an id.
export async function deleteBooking(request, response, params) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  const deleted = await deleteBookingForUser(user.id, params.id);

  if (!deleted) {
    sendJson(response, 404, { error: "Booking not found." });
    return;
  }

  sendNoContent(response);
}
