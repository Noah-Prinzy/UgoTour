import "../pwa.js";
import { getCurrentUser, logoutUser } from "../services/auth-service.js";

export async function renderNavbar(basePath = ".", validatedUser = undefined) {
  const header = document.getElementById("site-header");
  if (!header) return;

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

  const accountArea = currentUser
    ? `<div class="nav-account"><a class="nav-profile-pill nav-user-link" href="${profileHref}">${avatar}<span>Hi, ${escapeHtml(currentUser.name.split(" ")[0])}</span></a><button id="nav-logout-button" class="secondary-button" type="button">Logout</button></div>`
    : `<div class="nav-account"><a class="nav-login-link" href="${basePath}/pages/login.html">Login</a><a class="primary-button nav-signup-button" href="${basePath}/pages/signup.html">Sign up</a></div>`;

  header.innerHTML = `
    <nav class="site-nav" aria-label="Primary navigation">
      <a class="brand" href="${basePath}/index.html">Ugo<span>Tour</span></a>
      <div class="nav-links">
        ${navLink("Home", `${basePath}/index.html`, "index.html")}
        ${navLink("Destinations", `${basePath}/pages/destinations.html`, "destinations.html")}
        ${navLink("Bookings", `${basePath}/pages/bookings.html`, "bookings.html")}
        ${navLink("Profile", profileHref, "profile.html")}
      </div>
      ${accountArea}
    </nav>
    <nav class="mobile-bottom-nav" aria-label="Mobile navigation">
      ${mobileLink("Home", `${basePath}/index.html`, "index.html", homeIcon())}
      ${mobileLink("Explore", `${basePath}/pages/destinations.html`, "destinations.html", compassIcon())}
      ${mobileLink("Trips", `${basePath}/pages/bookings.html`, "bookings.html", ticketIcon())}
      ${mobileLink("Profile", profileHref, "profile.html", userIcon())}
    </nav>
  `;

  document.getElementById("nav-logout-button")?.addEventListener("click", async () => {
    await logoutUser();
    window.location.replace(`${basePath}/pages/login.html`);
  });
}

function renderAvatar(user) {
  if (!user) return "";
  if (user.profileImage) {
    return `<span class="nav-avatar"><img src="${escapeHtml(user.profileImage)}" alt="" /></span>`;
  }
  return `<span class="nav-avatar">${makeInitials(user.name)}</span>`;
}

function currentFile() {
  const file = window.location.pathname.split("/").pop();
  return file || "index.html";
}

function navLink(label, href, file) {
  return `<a class="${currentFile() === file ? "is-active" : ""}" href="${href}">${label}</a>`;
}

function mobileLink(label, href, file, icon) {
  return `<a class="${currentFile() === file ? "is-active" : ""}" href="${href}">${icon}<span>${label}</span></a>`;
}

function makeInitials(name) {
  return String(name ?? "UG").trim().split(/\s+/).slice(0,2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "UG";
}

function svg(path) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
const homeIcon = () => svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/>');
const compassIcon = () => svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"/>');
const ticketIcon = () => svg('<path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7Z"/><path d="M12 8.5v7"/>');
const userIcon = () => svg('<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"/>');

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
