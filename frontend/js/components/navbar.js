// ============================================================
// REUSABLE NAVBAR COMPONENT
// ============================================================
// Every page calls renderNavbar(). Phase 4 makes the final area change
// depending on whether a user is currently logged in.

import { getCurrentUser, logoutUser } from "../services/auth-service.js";

export function renderNavbar(basePath = ".") {
  const header = document.getElementById("site-header");

  if (!header) {
    return;
  }

  const currentUser = getCurrentUser();

  // Logged-in users see their name and a Logout button.
  // Logged-out users see Login and Sign up actions.
  const accountArea = currentUser
    ? `
      <div class="nav-account">
        <a class="nav-user-link" href="${basePath}/pages/profile.html">
          Hi, ${escapeHtml(currentUser.name.split(" ")[0])}
        </a>
        <button id="nav-logout-button" class="secondary-button" type="button">Logout</button>
      </div>
    `
    : `
      <div class="nav-account">
        <a class="nav-login-link" href="${basePath}/pages/login.html">Login</a>
        <a class="primary-button nav-signup-button" href="${basePath}/pages/signup.html">Sign up</a>
      </div>
    `;

  header.innerHTML = `
    <nav class="site-nav">
      <a class="brand" href="${basePath}/index.html">Ugo<span>Tour</span></a>

      <div class="nav-links">
        <a href="${basePath}/index.html">Home</a>
        <a href="${basePath}/pages/destinations.html">Destinations</a>
        <a href="${basePath}/pages/bookings.html">Bookings</a>
        <a href="${basePath}/pages/profile.html">Profile</a>
      </div>

      ${accountArea}
    </nav>
  `;

  document.getElementById("nav-logout-button")?.addEventListener("click", () => {
    logoutUser();
    window.location.href = `${basePath}/index.html`;
  });
}

// The user's name comes from input, so escape special HTML characters before
// placing it inside innerHTML. This is a basic defense against HTML injection.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
