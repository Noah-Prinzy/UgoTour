// Phase 1.29B — user-facing Favorites terminology only.
// Internal saved-service/API names intentionally remain unchanged.

const favoriteSelector = ".place-save-button, #details-favorite, #map-place-save";

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
  if (!(button instanceof Element) || !button.matches(favoriteSelector)) return;
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
    const direction = isPressed ? "from" : "to";
    setLabel(button, name ? `${action} ${name} ${direction} Favorites` : `${action} ${direction} Favorites`);
  }
}

function syncAddedNode(node) {
  if (!(node instanceof Element)) return;
  syncFavoriteButton(node);
  node.querySelectorAll?.(favoriteSelector).forEach(syncFavoriteButton);
}

export function syncFavoritesCopy(root = document) {
  root.querySelectorAll?.(favoriteSelector).forEach(syncFavoriteButton);
}

syncFavoritesCopy();

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "attributes") {
      syncFavoriteButton(mutation.target);
      return;
    }

    if (mutation.type === "childList") {
      syncFavoriteButton(mutation.target);
      mutation.addedNodes.forEach(syncAddedNode);
    }
  });
});

observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["aria-pressed"]
});
