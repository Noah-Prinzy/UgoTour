// Phase 1.29B — user-facing Favorites terminology only.
// Internal saved-service/API names intentionally remain unchanged.

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setLabel(element, value) {
  if (element && element.getAttribute("aria-label") !== value) element.setAttribute("aria-label", value);
}

function pressed(element) {
  return element?.getAttribute("aria-pressed") === "true";
}

function destinationNameFromLabel(button) {
  const label = button?.getAttribute("aria-label") || "";
  return label
    .replace(/^(?:Save|Remove|Add)\s+/i, "")
    .replace(/\s+(?:from|to)\s+Favorites$/i, "")
    .replace(/\s+place$/i, "")
    .trim();
}

function syncFavoriteButton(button) {
  if (!button) return;
  const isPressed = pressed(button);

  if (button.id === "map-place-save") {
    setText(button, isPressed ? "♥ Remove from Favorites" : "♡ Add to Favorites");
    setLabel(button, isPressed ? "Remove from Favorites" : "Add to Favorites");
    return;
  }

  if (button.id === "details-favorite") {
    setLabel(button, isPressed ? "Remove from Favorites" : "Add to Favorites");
    return;
  }

  if (button.classList.contains("place-save-button")) {
    const name = destinationNameFromLabel(button);
    const action = isPressed ? "Remove" : "Add";
    setLabel(button, name ? `${action} ${name} ${isPressed ? "from" : "to"} Favorites` : `${action} ${isPressed ? "from" : "to"} Favorites`);
  }
}

export function syncFavoritesCopy(root = document) {
  root.querySelectorAll?.(".place-save-button, #details-favorite, #map-place-save").forEach(syncFavoriteButton);
}

syncFavoritesCopy();

const observer = new MutationObserver((mutations) => {
  let shouldSync = false;
  for (const mutation of mutations) {
    if (mutation.type === "attributes" && mutation.attributeName === "aria-pressed") {
      shouldSync = true;
      break;
    }
    if (mutation.type === "childList") {
      shouldSync = true;
      break;
    }
  }
  if (shouldSync) syncFavoritesCopy();
});

observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["aria-pressed"]
});
