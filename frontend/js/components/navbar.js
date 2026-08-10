// ============================================================
// REUSABLE NAVBAR COMPONENT - PHASE 7
// ============================================================
// The navbar now asks the backend who the current user is. Because that check
// is an HTTP request, renderNavbar() is asynchronous and page modules await it.

import { getCurrentUser, logoutUser } from "../services/auth-service.js";

export async function renderNavbar(basePath = ".") {
  const header = document.getElementById("site-header");

  if (!header) {
    return;
  }

  let currentUser = null;

  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    // If the API is offline, keep the page usable and show logged-out actions.
    // The session token itself is preserved by auth-service.js.
    console.error("Could not load navbar session:", error);
  }

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

  document.getElementById("nav-logout-button")?.addEventListener("click", async () => {
    await logoutUser();
    window.location.href = `${basePath}/index.html`;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
