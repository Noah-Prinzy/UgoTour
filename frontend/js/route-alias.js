// Lightweight compatibility redirects for user-friendly page aliases.
// Canonical implementation filenames remain unchanged to avoid breaking APIs,
// bookmarks, service modules or existing internal links.
const target = document.body?.dataset.routeAlias;

if (target) {
  const destination = new URL(target, window.location.href);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.replace(destination.href);
}
