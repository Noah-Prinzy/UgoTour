// ============================================================
// PWA REGISTRATION, INSTALL PROMPT + UPDATE NOTIFICATION
// ============================================================
let deferredInstallPrompt = null;
const installListeners = new Set();
let waitingWorker = null;
const updateListeners = new Set();

function notifyInstallState() {
  installListeners.forEach((listener) => listener(Boolean(deferredInstallPrompt)));
}
function notifyUpdateState() {
  updateListeners.forEach((listener) => listener(Boolean(waitingWorker)));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const workerUrl = new URL("../service-worker.js", import.meta.url);
      const registration = await navigator.serviceWorker.register(workerUrl);

      if (registration.waiting) {
        waitingWorker = registration.waiting;
        notifyUpdateState();
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorker = registration.waiting || installing;
            notifyUpdateState();
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
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
  installListeners.add(listener);
  listener(Boolean(deferredInstallPrompt));
  return () => installListeners.delete(listener);
}
export async function requestInstall() {
  if (!deferredInstallPrompt) return false;
  await deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifyInstallState();
  return result.outcome === "accepted";
}

export function onUpdateAvailability(listener) {
  updateListeners.add(listener);
  listener(Boolean(waitingWorker));
  return () => updateListeners.delete(listener);
}
export function applyUpdate() {
  waitingWorker?.postMessage({ type: "SKIP_WAITING" });
}
