// Small validation helpers used by controllers/services.

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEmail(value) {
  if (!isNonEmptyString(value)) return false;

  // This is intentionally simple for the learning project.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}
