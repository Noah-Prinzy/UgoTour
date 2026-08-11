import { applyUpdate, onInstallAvailability, onUpdateAvailability, requestInstall } from "../pwa.js";

export function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;
  const year = new Date().getFullYear();
  const pageDepth = window.location.pathname.includes("/pages/") ? "." : "./pages";
  const href = (name) => `${pageDepth}/${name}.html`.replace("././", "./");

  footer.className = "site-footer";
  footer.innerHTML = `<div class="footer-main"><div><strong class="footer-brand ugotour-brand" aria-label="UgoTour">${brandMarkup()}</strong><p>© ${year} · Discover, save and plan Uganda journeys.</p></div><nav class="footer-links" aria-label="Footer"><a href="${href("about")}">About</a><a href="${href("help")}">Help</a><a href="${href("contact")}">Contact</a><a href="${href("privacy")}">Privacy</a><a href="${href("terms")}">Terms</a></nav><div class="footer-actions"><button id="install-app-button" class="install-app-button" type="button" hidden>Install UgoTour</button><button id="update-app-button" class="install-app-button" type="button" hidden>Update available</button></div></div>`;

  const install = document.getElementById("install-app-button");
  const update = document.getElementById("update-app-button");
  onInstallAvailability((available) => { if (install) install.hidden = !available; });
  install?.addEventListener("click", () => requestInstall());
  onUpdateAvailability((available) => { if (update) update.hidden = !available; });
  update?.addEventListener("click", () => applyUpdate());
}

function brandMarkup() {
  return `<span class="ugotour-logo-lockup"><span class="ugotour-brand-word"><span class="ugotour-brand-ug">Ug</span><span class="ugotour-flag-o" aria-hidden="true"><span class="ugotour-flag-disc"></span></span><span class="ugotour-brand-tour">Tour</span></span><span class="ugotour-brand-tagline">Explore Uganda</span><span class="ugotour-brand-accent" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>`;
}
