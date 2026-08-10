// ============================================================
// PWA REGISTRATION + INSTALL PROMPT
// ============================================================
// A service worker and manifest make UgoTour installable when it is served
// from HTTPS (or localhost). The app still remains a normal responsive website.

let deferredInstallPrompt = null;
const listeners = new Set();

function notifyInstallState() {
  listeners.forEach((listener) => listener(Boolean(deferredInstallPrompt)));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const workerUrl = new URL("../service-worker.js", import.meta.url);
      await navigator.serviceWorker.register(workerUrl);
    } catch (error) {
      console.error("UgoTour service worker registration failed:", error);
    }
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  notifyInstallState();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  notifyInstallState();
});

export function onInstallAvailability(listener) {
  listeners.add(listener);
  listener(Boolean(deferredInstallPrompt));
  return () => listeners.delete(listener);
}

export async function requestInstall() {
  if (!deferredInstallPrompt) return false;

  await deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifyInstallState();
  return result.outcome === "accepted";
}
