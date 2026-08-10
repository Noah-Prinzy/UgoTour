// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
// localStorage can only save text. These helpers convert JavaScript values
// to/from JSON so the rest of UgoTour can work with normal arrays/objects.
//
// IMPORTANT: localStorage is temporary frontend storage for our learning
// prototype. In a production app, users and sessions will live in the
// Node.js/PostgreSQL backend instead.

export function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// fallbackValue is returned when nothing has been saved yet or when stored
// JSON is damaged. This prevents one bad local value from crashing a page.
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

// Remove one saved value completely.
export function removeLocal(key) {
  localStorage.removeItem(key);
}
