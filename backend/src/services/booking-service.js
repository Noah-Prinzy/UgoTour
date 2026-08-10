import { bookings, createBookingId } from "../data/memory-store.js";
import { getDestinationById } from "./destination-service.js";

export function createBooking(userId, input) {
  const destination = getDestinationById(input.destinationId);

  if (!destination) {
    const error = new Error("Destination not found.");
    error.statusCode = 404;
    throw error;
  }

  const booking = {
    id: createBookingId(),
    userId: Number(userId),
    destinationId: destination.id,
    destinationName: destination.name,
    travelDate: input.travelDate,
    travellers: Number(input.travellers),
    status: "confirmed",
    createdAt: new Date().toISOString()
  };

  bookings.push(booking);
  return { ...booking };
}

export function getBookingsForUser(userId) {
  return bookings
    .filter((booking) => booking.userId === Number(userId))
    .map((booking) => ({ ...booking }));
}

export function deleteBookingForUser(userId, bookingId) {
  const index = bookings.findIndex(
    (booking) =>
      booking.id === Number(bookingId) && booking.userId === Number(userId)
  );

  if (index === -1) return false;

  bookings.splice(index, 1);
  return true;
}
