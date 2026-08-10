import { onInstallAvailability, requestInstall } from "../pwa.js";

export function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  const year = new Date().getFullYear();
  footer.className = "site-footer";
  footer.innerHTML = `
    <div><strong class="footer-brand">UgoTour</strong><p>© ${year} · JavaScript-first tourism PWA for Uganda.</p></div>
    <button id="install-app-button" class="install-app-button" type="button" hidden>Install UgoTour</button>
  `;

  const installButton = document.getElementById("install-app-button");
  onInstallAvailability((available) => {
    if (installButton) installButton.hidden = !available;
  });

  installButton?.addEventListener("click", async () => {
    await requestInstall();
  });
}
