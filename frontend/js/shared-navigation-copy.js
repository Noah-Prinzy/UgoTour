// Shared user-facing navigation copy.
// Keep the existing saved.html route/API stable while presenting the feature as Favorites.
function applyFavoritesCopy(root = document) {
  let changes = 0;
  root.querySelectorAll?.('a[href*="saved.html"]').forEach((link) => {
    const nestedLabel = link.querySelector("span");
    if (nestedLabel?.textContent.trim() === "Saved") {
      nestedLabel.textContent = "Favorites";
      changes += 1;
      return;
    }
    if (link.textContent.trim() === "Saved") {
      link.textContent = "Favorites";
      changes += 1;
    }
  });
  return changes;
}

applyFavoritesCopy();

const observer = new MutationObserver(() => {
  const changes = applyFavoritesCopy();
  const headerReady = document.querySelector("#site-header .nav-links");
  const drawerReady = document.getElementById("mobile-menu-drawer");
  if (headerReady && drawerReady && changes === 0) observer.disconnect();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
