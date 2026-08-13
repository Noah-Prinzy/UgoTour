import { applyUpdate, onUpdateAvailability } from "../pwa.js";

const footerStylesReady = ensureFooterStylesheet();

export async function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  await footerStylesReady;
  if (footer.dataset.ugotourFooterReady === "true") return;

  const year = new Date().getFullYear();
  const pageDepth = window.location.pathname.includes("/pages/") ? "." : "./pages";
  const href = (name) => `${pageDepth}/${name}.html`.replace("././", "./");

  footer.hidden = false;
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-main">
      <div>
        <strong class="footer-brand ugotour-brand" aria-label="UgoTour">${brandMarkup()}</strong>
        <p>© ${year} · Discover, Save and Plan.</p>
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
        <a href="${href("about")}">About</a>
        <a href="${href("help")}">Help</a>
        <a href="${href("contact")}">Contact</a>
        <a href="${href("terms")}">Terms</a>
      </nav>
      <div class="footer-actions">
        <button id="update-app-button" class="install-app-button" type="button" hidden>Update available</button>
      </div>
    </div>`;
  footer.dataset.ugotourFooterReady = "true";

  syncFavoritesNavigationCopy();

  const update = document.getElementById("update-app-button");
  onUpdateAvailability((available) => {
    if (update) update.hidden = !available;
  });
  update?.addEventListener("click", () => applyUpdate());
}

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

function brandMarkup() {
  return `<span class="ugotour-logo-lockup"><span class="ugotour-brand-word"><span class="ugotour-brand-ug">Ug</span><span class="ugotour-flag-o" aria-hidden="true"><span class="ugotour-flag-disc"></span></span><span class="ugotour-brand-tour">Tour</span></span><span class="ugotour-brand-tagline">Explore Uganda</span><span class="ugotour-brand-accent" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>`;
}
