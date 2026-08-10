import { getCurrentUser } from "./auth-service.js";

// Every application page validates the bearer token against GET /api/profile.
// A stored token is only a session hint; the API remains the source of truth.
export async function requireAuthenticatedUser(basePath = ".") {
  const user = await getCurrentUser().catch((error) => {
    console.error("Could not validate the UgoTour session:", error);
    return null;
  });

  if (user) return user;

  window.location.replace(`${basePath}/pages/login.html`);
  return new Promise(() => {});
}

export async function redirectAuthenticatedUser(homePath = "../index.html") {
  const user = await getCurrentUser().catch((error) => {
    console.error("Could not validate the UgoTour session:", error);
    return null;
  });

  if (!user) return false;
  window.location.replace(homePath);
  return true;
}
