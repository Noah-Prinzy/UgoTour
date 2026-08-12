import { onInstallAvailability, requestInstall } from "../pwa.js";
import { getCurrentUser, logoutUser } from "../services/auth-service.js";

// Load shared responsive/theme styles before async session/API work completes.
const mobilePhaseStylesReady = ensureStylesheet(
  'link[data-ugotour-mobile-phase="1"]',
  "../../css/mobile-phase1.css?v=11.5.1",
  "ugotourMobilePhase"
);
const phase119StylesReady = ensureStylesheet(
  'link[data-ugotour-phase119="1.19"]',
  "../../css/phase1-19.css?v=1.19.0",
  "ugotourPhase119"
);
const phase120StylesReady = ensureStylesheet(
  'link[data-ugotour-phase120="1.20"]',
  "../../css/phase1-20.css?v=1.20.0",
  "ugotourPhase120"
);
const phase121StylesReady = ensureStylesheet(
  'link[data-ugotour-phase121="1.21"]',
  "../../css/phase1-21.css?v=1.21.0",
  "ugotourPhase121"
);
const phase122StylesReady = ensureStylesheet(
  'link[data-ugotour-phase122="1.22"]',
  "../../css/phase1-22.css?v=1.22.0",
  "ugotourPhase122"
);

export async function renderNavbar(basePath = ".", validatedUser = undefined) {
  const header = document.getElementById("site-header");
  if (!header) return;

  await Promise.all([mobilePhaseStylesReady, phase119StylesReady, phase120StylesReady, phase121StylesReady, phase122StylesReady]);

  let currentUser = validatedUser;
  if (currentUser === undefined) {
    try {
      currentUser = await getCurrentUser();
    } catch (error) {
      console.error("Could not load navbar session:", error);
      currentUser = null;
    }
  }

  const profileHref = `${basePath}/pages/profile.html`;
  const avatar = renderAvatar(currentUser);
  const adminLink = currentUser?.role === "admin"
    ? `<a class="nav-admin-link" href="${basePath}/pages/admin.html">Admin</a>`
    : "";
  const drawerAdminLink = currentUser?.role === "admin"
    ? drawerLink("Admin", `${basePath}/pages/admin.html`, ["admin.html"])
    : "";

  const accountArea = currentUser
    ? `<div class="nav-account"><button id="nav-install-button" class="nav-install-button" type="button" hidden>Install</button>${adminLink}<a class="nav-profile-pill nav-user-link" href="${profileHref}">${avatar}<span>Hi, ${escapeHtml(firstName(currentUser.name))}</span></a><button id="nav-logout-button" class="secondary-button" type="button">Logout</button></div>`
    : `<div class="nav-account"><button id="nav-install-button" class="nav-install-button" type="button" hidden>Install</button><a class="nav-login-link" href="${basePath}/pages/login.html">Login</a><a class="primary-button nav-signup-button" href="${basePath}/pages/signup.html">Sign up</a></div>`;

  const mobileProfile = currentUser
    ? `<a class="mobile-profile-button" href="${profileHref}" aria-label="Open profile">${avatar}</a>`
    : `<a class="mobile-profile-button mobile-profile-button-guest" href="${basePath}/pages/login.html" aria-label="Log in">${userIcon()}</a>`;

  const mobileSessionActions = currentUser
    ? `<button id="mobile-logout-button" class="mobile-drawer-session-button" type="button">Log out</button>`
    : `<div class="mobile-drawer-auth-actions"><a href="${basePath}/pages/login.html">Log in</a><a class="mobile-drawer-signup" href="${basePath}/pages/signup.html">Create account</a></div>`;

  header.innerHTML = `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <nav class="site-nav" aria-label="Primary navigation">
      <a class="brand ugotour-brand" href="${basePath}/index.html" aria-label="UgoTour home">${brandMarkup()}</a>
      <div class="nav-links">
        ${navLink("Home", `${basePath}/index.html`, ["index.html", ""])}
        ${navLink("Destinations", `${basePath}/pages/destinations.html`, ["destinations.html"])}
        ${navLink("Map", `${basePath}/pages/map.html`, ["map.html"])}
        ${navLink("Saved", `${basePath}/pages/saved.html`, ["saved.html"])}
        ${navLink("Trips", `${basePath}/pages/bookings.html`, ["bookings.html"])}
        ${navLink("Profile", profileHref, ["profile.html", "profile-settings.html"])}
      </div>
      ${accountArea}
      <div class="mobile-nav-actions" aria-label="Mobile quick actions">
        ${mobileProfile}
        <button id="mobile-menu-toggle" class="mobile-menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-menu-drawer">
          ${menuIcon()}
        </button>
      </div>
    </nav>`;

  // Keep the mobile overlay outside #site-header so the sticky/floating header
  // cannot interfere with drawer hit testing or touch navigation.
  document.getElementById("mobile-menu-backdrop")?.remove();
  document.getElementById("mobile-menu-drawer")?.remove();

  header.insertAdjacentHTML("afterend", `
    <div id="mobile-menu-backdrop" class="mobile-menu-backdrop" hidden></div>
    <aside id="mobile-menu-drawer" class="mobile-menu-drawer" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title" aria-hidden="true" tabindex="-1">
      <div class="mobile-menu-drawer-head">
        <a id="mobile-menu-title" class="mobile-menu-brand ugotour-brand" href="${basePath}/index.html" aria-label="UgoTour home">${brandMarkup()}</a>
        <button id="mobile-menu-close" class="mobile-menu-close" type="button" aria-label="Close navigation menu">${closeIcon()}</button>
      </div>

      <nav class="mobile-menu-links" aria-label="Mobile navigation">
        ${drawerLink("Home", `${basePath}/index.html`, ["index.html", ""])}
        ${drawerLink("Explore", `${basePath}/pages/destinations.html`, ["destinations.html"])}
        ${drawerLink("Map", `${basePath}/pages/map.html`, ["map.html"])}
        ${drawerLink("Saved", `${basePath}/pages/saved.html`, ["saved.html"])}
        ${drawerLink("Trips", `${basePath}/pages/bookings.html`, ["bookings.html"])}
        ${drawerLink("Profile", profileHref, ["profile.html", "profile-settings.html"])}
        ${drawerAdminLink}
      </nav>

      <div class="mobile-menu-drawer-footer">
        <button id="mobile-install-button" class="mobile-install-button" type="button" hidden>${downloadIcon()}<span>Install UgoTour</span></button>
        ${mobileSessionActions}
      </div>
    </aside>`);

  const desktopLogout = document.getElementById("nav-logout-button");
  const mobileLogout = document.getElementById("mobile-logout-button");
  const handleLogout = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (event?.currentTarget instanceof HTMLButtonElement) event.currentTarget.disabled = true;
    await logoutUser();
    window.location.assign(`${basePath}/pages/login.html`);
  };
  desktopLogout?.addEventListener("click", handleLogout);
  mobileLogout?.addEventListener("click", handleLogout);

  const installButtons = [
    document.getElementById("nav-install-button"),
    document.getElementById("mobile-install-button")
  ].filter(Boolean);
  onInstallAvailability((available) => {
    installButtons.forEach((button) => { button.hidden = !available; });
  });
  installButtons.forEach((button) => button.addEventListener("click", () => requestInstall()));

  initialiseMobileDrawer();

  if (document.body.classList.contains("destinations-page")) {
    import("../pages/destination-experience.js").catch((error) => {
      console.error("Could not load destination experience enhancements:", error);
    });
  }
}

function ensureStylesheet(selector, relativeUrl, datasetKey) {
  const existing = document.querySelector(selector);
  if (existing) {
    if (existing.sheet) return Promise.resolve(existing);
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(existing), { once: true });
      existing.addEventListener("error", () => resolve(existing), { once: true });
    });
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL(relativeUrl, import.meta.url).href;
  const datasetValues = {
    ugotourMobilePhase: "1",
    ugotourPhase119: "1.19",
    ugotourPhase120: "1.20",
    ugotourPhase121: "1.21",
    ugotourPhase122: "1.22"
  };
  link.dataset[datasetKey] = datasetValues[datasetKey] || "1";

  const ready = new Promise((resolve) => {
    link.addEventListener("load", () => resolve(link), { once: true });
    link.addEventListener("error", () => resolve(link), { once: true });
  });

  document.head.appendChild(link);
  return ready;
}

function initialiseMobileDrawer() {
  const toggle = document.getElementById("mobile-menu-toggle");
  const close = document.getElementById("mobile-menu-close");
  const drawer = document.getElementById("mobile-menu-drawer");
  const backdrop = document.getElementById("mobile-menu-backdrop");
  if (!toggle || !drawer || !backdrop) return;

  let lastFocused = null;
  const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function setOpen(open, { restoreFocus = true, immediate = false } = {}) {
    if (open) {
      lastFocused = document.activeElement;
      backdrop.hidden = false;
      drawer.hidden = false;
      drawer.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");

      requestAnimationFrame(() => {
        document.body.classList.add("mobile-menu-open");
        drawer.classList.add("is-open");
        backdrop.classList.add("is-visible");
      });

      window.setTimeout(() => drawer.querySelector(focusableSelector)?.focus(), 80);
      return;
    }

    document.body.classList.remove("mobile-menu-open");
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");

    const finishClose = () => {
      backdrop.hidden = true;
      drawer.hidden = true;
      if (restoreFocus && lastFocused instanceof HTMLElement) lastFocused.focus();
    };

    if (immediate) finishClose();
    else window.setTimeout(finishClose, 320);
  }

  drawer.hidden = true;
  backdrop.hidden = true;

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  close?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
  });

  backdrop.addEventListener("click", (event) => {
    event.preventDefault();
    setOpen(false);
  });

  drawer.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || !drawer.contains(link)) return;
    event.preventDefault();
    event.stopPropagation();
    const destinationUrl = link.href;
    setOpen(false, { restoreFocus: false, immediate: true });
    window.location.assign(destinationUrl);
  });

  document.addEventListener("keydown", (event) => {
    if (drawer.getAttribute("aria-hidden") === "true") return;

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [...drawer.querySelectorAll(focusableSelector)].filter(
      (element) => !element.hidden && element.getClientRects().length > 0
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function brandMarkup() {
  return `<span class="ugotour-logo-lockup"><span class="ugotour-brand-word"><span class="ugotour-brand-ug">Ug</span><span class="ugotour-flag-o" aria-hidden="true"><span class="ugotour-flag-disc"></span></span><span class="ugotour-brand-tour">Tour</span></span><span class="ugotour-brand-tagline">Explore Uganda</span><span class="ugotour-brand-accent" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>`;
}

function renderAvatar(user) {
  if (!user) return "";
  if (user.profileImage) return `<span class="nav-avatar"><img src="${escapeHtml(user.profileImage)}" alt="" /></span>`;
  return `<span class="nav-avatar">${makeInitials(user.name)}</span>`;
}

function currentFile() {
  const file = window.location.pathname.split("/").pop();
  return file || "index.html";
}

function isActiveFile(files) {
  return files.includes(currentFile()) || (files.includes("") && window.location.pathname.endsWith("/"));
}

function navLink(label, href, files) {
  const active = isActiveFile(files);
  return `<a class="${active ? "is-active" : ""}" href="${href}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}

function drawerLink(label, href, files) {
  const active = isActiveFile(files);
  return `<a class="mobile-menu-link${active ? " is-active" : ""}" href="${href}"${active ? ' aria-current="page"' : ""}><span>${label}</span>${arrowIcon()}</a>`;
}

function firstName(name) {
  return String(name ?? "Traveler").trim().split(/\s+/)[0] || "Traveler";
}

function makeInitials(name) {
  return String(name ?? "UG").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "UG";
}

function svg(path, className = "") {
  return `<svg${className ? ` class="${className}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const userIcon = () => svg('<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/>');
const menuIcon = () => svg('<path d="M5 7h14M5 12h14M5 17h14"/>');
const closeIcon = () => svg('<path d="m6 6 12 12M18 6 6 18"/>');
const arrowIcon = () => svg('<path d="M5 12h13M14 8l4 4-4 4"/>', "mobile-menu-link-arrow");
const downloadIcon = () => svg('<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M5 20h14"/>');

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
