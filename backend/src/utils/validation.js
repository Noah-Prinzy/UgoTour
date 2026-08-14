// ============================================================
// SHARED VALIDATION HELPERS
// Tiny reusable checks keep controller validation readable without introducing a
// validation framework into this learning-focused project.
// ============================================================

// True only for strings containing at least one non-whitespace character.
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// A deliberately simple email-shape check suitable for this project.
export function isEmail(value) {
  if (!isNonEmptyString(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Convert numeric-looking input and require a whole number greater than zero.
export function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}
