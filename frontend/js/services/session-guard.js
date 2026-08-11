import { getCurrentUser } from "./auth-service.js";

// Protected application pages validate the HttpOnly cookie session through GET /api/profile.
// The API remains the source of truth; frontend JavaScript never reads the session token.
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
