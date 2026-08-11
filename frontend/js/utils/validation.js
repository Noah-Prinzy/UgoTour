// ============================================================
// REUSABLE VALIDATION HELPERS
// ============================================================
// Keeping validation rules in one file means signup, login, booking and
// profile forms can share the same rules instead of rewriting them.

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export function isNotEmpty(value) {
  return String(value).trim().length > 0;
}

// The frontend mirrors the backend minimum while the backend remains the final authority.
export function isValidPassword(password, minimumLength = 10) {
  return typeof password === "string" && password.length >= minimumLength && password.length <= 128;
}

export function passwordsMatch(password, confirmation) {
  return password === confirmation;
}

export function isValidTravellerCount(value) {
  const travellers = Number(value);
  return Number.isInteger(travellers) && travellers >= 1 && travellers <= 20;
}

export function isFutureOrToday(dateValue) {
  if (!dateValue) return false;

  const selectedDate = new Date(`${dateValue}T00:00:00`);
  const today = new Date();

  // Reset today's time so we compare calendar dates, not hours/minutes.
  today.setHours(0, 0, 0, 0);

  return selectedDate >= today;
}
