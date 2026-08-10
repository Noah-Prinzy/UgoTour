// ============================================================
// REUSABLE VALIDATION HELPERS
// ============================================================
// Keeping small validation rules here avoids rewriting them in every form.

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isNotEmpty(value) {
  return String(value).trim().length > 0;
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
