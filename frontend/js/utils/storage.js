// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
// These helpers keep JSON conversion in one place instead of repeating
// JSON.stringify() and JSON.parse() throughout the application.

export function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// fallbackValue is returned when nothing has been saved yet or if the
// stored JSON cannot be read. This makes our pages more defensive.
export function readLocal(key, fallbackValue = null) {
  const value = localStorage.getItem(key);

  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`Could not read localStorage key: ${key}`, error);
    return fallbackValue;
  }
}
