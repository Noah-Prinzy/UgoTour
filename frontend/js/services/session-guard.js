// ============================================================
// FRONTEND SESSION GUARD
// Protects pages without ever reading the HttpOnly cookie itself. GET /api/profile
// is the source of truth: a returned user means the cookie/session is valid.
// ============================================================

import { getCurrentUser } from "./auth-service.js";

// Use on protected pages. Anonymous/expired sessions are redirected to login;
// the never-resolving Promise prevents the protected page from continuing setup.
export async function requireAuthenticatedUser(basePath = ".") {
  const user = await getCurrentUser().catch((error) => {
    console.error("Could not validate the UgoTour session:", error);
    return null;
  });

  if (user) return user;

  window.location.replace(`${basePath}/pages/login.html`);
  return new Promise(() => {});
}

// Use on login/signup pages so an already-authenticated user is sent back Home.
export async function redirectAuthenticatedUser(homePath = "../index.html") {
  const user = await getCurrentUser().catch((error) => {
    console.error("Could not validate the UgoTour session:", error);
    return null;
  });

  if (!user) return false;
  window.location.replace(homePath);
  return true;
}
