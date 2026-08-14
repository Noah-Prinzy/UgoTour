// ============================================================
// SHARED FOOTER COMPONENT
// Renders the same footer on every page, keeps Favorites terminology consistent
// and connects the "Update available" button to the PWA service-worker flow.
// ============================================================

import { applyUpdate, onUpdateAvailability } from "../pwa.js";

// Start loading the footer's late-phase stylesheet as soon as this module imports.
const footerStylesReady = ensureFooterStylesheet();

export async function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  // Wait for styling and avoid rendering the same footer twice on one document.
  await footerStylesReady;
  if (footer.dataset.ugotourFooterReady === "true") return;

  // Pages inside /pages need different relative links from the root index page.
  const year = new Date().getFullYear();
  const pageDepth = window.location.pathname.includes("/pages/") ? "." : "./pages";
  const href = (name) => `${pageDepth}/${name}.html`.replace("././", "./");

  // Build the shared footer markup.
  footer.hidden = false;
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-main">
      <div>
        <strong class="footer-brand ugotour-brand" aria-label="UgoTour">${brandMarkup()}</strong>
        <p>© ${year} · Discover, Save and Plan.</p>
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
        ${footerLink("about", "About", href)}
        ${footerLink("help", "Help", href)}
        ${footerLink("contact", "Contact", href)}
        ${footerLink("terms", "Terms", href)}
      </nav>
      <div class="footer-actions">
        <button id="update-app-button" class="install-app-button" type="button" hidden>Update available</button>
      </div>
    </div>`;
  footer.dataset.ugotourFooterReady = "true";

  // Older markup may still say "Saved"; the product-facing label is "Favorites".
  syncFavoritesNavigationCopy();

  // PWA code tells this button when a new service worker is waiting to activate.
  const update = document.getElementById("update-app-button");
  onUpdateAvailability((available) => {
    if (update) update.hidden = !available;
  });
  update?.addEventListener("click", () => applyUpdate());
}

// Create one footer link and mark it as the current page when appropriate.
function footerLink(name, label, href) {
  const active = currentFile() === `${name}.html`;
  return `<a href="${href(name)}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}

// Return the current HTML filename for active-link checks.
function currentFile() {
  return window.location.pathname.split("/").pop() || "index.html";
}

// Late-inject Phase 1.28 footer styles on pages that did not include them directly.
function ensureFooterStylesheet() {
  const existing = document.querySelector('link[data-ugotour-phase128="1.28"]');
  if (existing) return Promise.resolve(existing);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("../../css/phase1-28.css?v=1.28.0", import.meta.url).href;
  link.dataset.ugotourPhase128 = "1.28";
  document.head.appendChild(link);
  return Promise.resolve(link);
}

// Rename any legacy Saved navigation label without changing saved.html or API paths.
function syncFavoritesNavigationCopy() {
  document.querySelectorAll('a[href*="saved.html"]').forEach((link) => {
    const label = link.querySelector("span");

    if (label && label.textContent.trim() === "Saved") {
      label.textContent = "Favorites";
      return;
    }

    if (link.textContent.trim() === "Saved") {
      link.textContent = "Favorites";
    }
  });
}

// Shared UgoTour wordmark/flag markup used inside the footer.
function brandMarkup() {
  return `<span class="ugotour-logo-lockup"><span class="ugotour-brand-word"><span class="ugotour-brand-ug">Ug</span><span class="ugotour-flag-o" aria-hidden="true"><span class="ugotour-flag-disc"></span></span><span class="ugotour-brand-tour">Tour</span></span><span class="ugotour-brand-tagline">Explore Uganda</span><span class="ugotour-brand-accent" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>`;
}
