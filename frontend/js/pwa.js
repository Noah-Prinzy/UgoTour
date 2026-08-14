import "./shared-navigation-copy.js";
import "./favorites-copy.js";

ensurePhase129Stylesheet();
ensurePhase129bStylesheet();

// ============================================================
// PWA REGISTRATION + UPDATE NOTIFICATION
// ------------------------------------------------------------
// Installation is intentionally left to the browser. Chrome / Edge can
// surface their native install UI, while Safari keeps its own Add to Home
// Screen flow. UgoTour no longer intercepts beforeinstallprompt.
// ============================================================
let waitingWorker = null;
const updateListeners = new Set();

function ensurePhase129Stylesheet() {
  const existing = document.querySelector('link[data-ugotour-phase129="1.29"]');
  if (existing) return existing;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("../css/phase1-29.css?v=1.29.0", import.meta.url).href;
  link.dataset.ugotourPhase129 = "1.29";
  document.head.appendChild(link);
  return link;
}

function ensurePhase129bStylesheet() {
  const existing = document.querySelector('link[data-ugotour-phase129b="1.29b"]');
  if (existing) return existing;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("../css/phase1-29b.css?v=1.29.1", import.meta.url).href;
  link.dataset.ugotourPhase129b = "1.29b";
  document.head.appendChild(link);
  return link;
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

async function ensureSharedFooter() {
  let footer = document.getElementById("site-footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.id = "site-footer";
    document.body.appendChild(footer);
  }

  const { renderFooter } = await import("./components/footer.js");
  await renderFooter();
}

queueMicrotask(() => {
  ensureSharedFooter().catch((error) => {
    console.error("Could not render shared footer:", error);
  });
});

// Backward-compatible no-op hooks keep existing navbar code safe while the
// custom install UI is retired. No beforeinstallprompt listener is registered,
// so the browser remains free to show its own installation experience.
export function onInstallAvailability(listener) {
  listener(false);
  return () => {};
}

export async function requestInstall() {
  return false;
}

export function onUpdateAvailability(listener) {
  updateListeners.add(listener);
  listener(Boolean(waitingWorker));
  return () => updateListeners.delete(listener);
}

export function applyUpdate() {
  waitingWorker?.postMessage({ type: "SKIP_WAITING" });
}
