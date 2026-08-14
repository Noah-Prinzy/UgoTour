// ============================================================
// OFFLINE FALLBACK PAGE
// The service worker can show offline.html when navigation fails. This single
// handler lets the user retry the current page after connectivity returns.
// ============================================================

document.getElementById("offline-retry")?.addEventListener("click", () => window.location.reload());
