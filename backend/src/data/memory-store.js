// Phase 5 temporary application store.
// Users, bookings and login sessions live only in RAM for now.
// Restarting the Node.js server clears these arrays/maps.

export const users = [];
export const bookings = [];

// Map token -> userId. This gives us a simple server-side login session system
// without adding a framework or external authentication package.
export const sessions = new Map();

let nextUserId = 1;
let nextBookingId = 1;

export function createUserId() {
  return nextUserId++;
}

export function createBookingId() {
  return nextBookingId++;
}
