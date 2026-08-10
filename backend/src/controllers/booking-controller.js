import { getAuthenticatedUser } from "../middleware/auth.js";
import {
  createBooking,
  deleteBookingForUser,
  getBookingsForUser
} from "../services/booking-service.js";
import { readJsonBody, sendJson, sendNoContent } from "../utils/http.js";
import { isNonEmptyString, isPositiveInteger } from "../utils/validation.js";

export function listBookings(request, response) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  sendJson(response, 200, {
    data: getBookingsForUser(user.id)
  });
}

export async function postBooking(request, response) {
  const user = getAuthenticatedUser(request);

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

  const booking = createBooking(user.id, body);
  sendJson(response, 201, { data: booking });
}

export function deleteBooking(request, response, params) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  const deleted = deleteBookingForUser(user.id, params.id);

  if (!deleted) {
    sendJson(response, 404, { error: "Booking not found." });
    return;
  }

  sendNoContent(response);
}
