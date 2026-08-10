// ============================================================
// BOOKING SERVICE - PHASE 3
// ============================================================
// Bookings are temporarily stored in browser localStorage.
// localStorage survives a page refresh on the same browser/device,
// but it is NOT a real multi-user database.
//
// Later, these functions will call our Node.js REST API instead.

import { readLocal, saveLocal } from "../utils/storage.js";

const BOOKINGS_KEY = "ugotour_bookings";

// Always return an array so page code can safely loop over bookings.
export function getBookings() {
  return readLocal(BOOKINGS_KEY, []);
}

export function createBooking(bookingData) {
  const bookings = getBookings();

  // Date.now() gives us a simple unique-enough id for this learning phase.
  const booking = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...bookingData
  };

  bookings.push(booking);
  saveLocal(BOOKINGS_KEY, bookings);

  return { ...booking };
}

export function cancelBooking(bookingId) {
  const bookings = getBookings();
  const numericId = Number(bookingId);

  const remainingBookings = bookings.filter(
    (booking) => booking.id !== numericId
  );

  saveLocal(BOOKINGS_KEY, remainingBookings);
  return remainingBookings;
}
