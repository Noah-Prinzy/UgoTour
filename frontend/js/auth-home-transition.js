const DEFAULT_HOME_IMAGE = "../images/optimized/destinations/murchison-falls/murchison-01.webp";

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    image.onload = finish;
    image.onerror = finish;
    image.src = src;
    if (image.complete) finish();
    else image.decode?.().then(finish).catch(() => {});
  });
}

function createOverlay(mode) {
  document.querySelector(".auth-home-transition")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "auth-home-transition";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.setAttribute("aria-label", "Preparing UgoTour home");

  const welcome = mode === "signup" ? "Welcome to UgoTour" : "Welcome back";
  overlay.innerHTML = `
    <img class="auth-home-transition__photo" src="${DEFAULT_HOME_IMAGE}" alt="" aria-hidden="true" />
    <div class="auth-home-transition__ambient" aria-hidden="true"></div>
    <div class="auth-home-transition__content">
      <div class="auth-home-transition__brand" aria-label="UgoTour">
        <span class="auth-home-transition__wordmark"><strong>Ug</strong><i>o</i><strong>Tour</strong></span>
        <span class="auth-home-transition__tagline">Explore Uganda</span>
      </div>
      <div class="auth-home-transition__copy">
        <p>${welcome}</p>
        <h1>Preparing your Uganda journey…</h1>
      </div>
      <div class="auth-home-transition__progress" aria-hidden="true"><span></span></div>
      <small>Loading your personalised travel home</small>
    </div>`;

  document.body.appendChild(overlay);
  document.body.classList.add("auth-home-transition-open");

  const photo = overlay.querySelector(".auth-home-transition__photo");
  const revealPhoto = () => overlay.classList.add("is-photo-ready");
  if (photo?.complete) revealPhoto();
  else {
    photo?.addEventListener("load", revealPhoto, { once: true });
    photo?.addEventListener("error", revealPhoto, { once: true });
    photo?.decode?.().then(revealPhoto).catch(() => {});
  }

  requestAnimationFrame(() => overlay.classList.add("is-visible"));
  return overlay;
}

/**
 * Runs only after authentication succeeds. It gives the browser a short branded
 * handoff while preloading the first Home hero image, then navigates to Home.
 */
export async function transitionToHome(destinationUrl = "../index.html", { mode = "login" } = {}) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const overlay = createOverlay(mode);
  const preloadUrl = new URL(DEFAULT_HOME_IMAGE, window.location.href).href;

  try {
    sessionStorage.setItem("ugotour-auth-entry", mode);
  } catch {
    // sessionStorage can be unavailable in strict/private browsing contexts.
  }

  const minimumVisible = delay(reduceMotion ? 380 : 1480);
  const preloadBounded = Promise.race([preloadImage(preloadUrl), delay(1100)]);
  await Promise.all([minimumVisible, preloadBounded]);

  overlay.classList.add("is-leaving");
  await delay(reduceMotion ? 80 : 420);
  window.location.replace(destinationUrl);
}
