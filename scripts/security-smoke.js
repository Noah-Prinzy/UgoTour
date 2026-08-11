// Lightweight repeatable checks for the browser-session security plumbing.
process.env.APP_ENV = "production";
process.env.COOKIE_SECURE = "true";
process.env.COOKIE_SAME_SITE = "Lax";
delete process.env.SESSION_COOKIE_NAME;
delete process.env.COOKIE_DOMAIN;

const { setSessionCookie } = await import("../backend/src/utils/cookies.js");
const { enforceTrustedWriteOrigin } = await import("../backend/src/middleware/cors.js");

const headers = {};
setSessionCookie({ setHeader(name, value) { headers[name] = value; } }, "test-token", new Date(Date.now() + 60_000));
const cookie = String(headers["Set-Cookie"] || "");
if (!cookie.startsWith("__Host-ugotour_session=")) throw new Error("Production session cookie is not host-prefixed.");
for (const expected of ["Secure", "HttpOnly", "SameSite=Lax", "Path=/"]) {
  if (!cookie.includes(expected)) throw new Error(`Missing cookie protection: ${expected}`);
}

let crossSiteBlocked = false;
try {
  enforceTrustedWriteOrigin({ method: "POST", headers: { "sec-fetch-site": "cross-site" }, socket: {} });
} catch (error) {
  crossSiteBlocked = error.statusCode === 403;
}
if (!crossSiteBlocked) throw new Error("Cross-site browser write was not blocked.");

console.log("Security smoke checks passed.");
