// ============================================================
// SESSION COOKIE UTILITIES
// Parses request cookies, finds the UgoTour session token and creates/clears the
// secure HttpOnly cookie used by browser authentication.
// ============================================================

// Production defaults to a __Host- cookie for stronger browser restrictions;
// development uses a simpler name so localhost testing remains convenient.
function cookieName() {
  if (process.env.SESSION_COOKIE_NAME) return process.env.SESSION_COOKIE_NAME;
  return process.env.APP_ENV === "production" ? "__Host-ugotour_session" : "ugotour_session";
}

// Convert the raw Cookie header into a key/value object.
export function parseCookies(request) {
  const header = request.headers.cookie || "";
  const cookies = {};
  header.split(";").forEach((part) => {
    const index = part.indexOf("=");
    if (index < 0) return;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) return;
    try { cookies[key] = decodeURIComponent(value); }
    catch { cookies[key] = value; }
  });
  return cookies;
}

// Browser sessions prefer the HttpOnly cookie. Bearer support remains for API
// tools and backwards compatibility with older UgoTour clients.
export function getSessionToken(request) {
  const cookieToken = parseCookies(request)[cookieName()];
  if (cookieToken) return cookieToken;

  const authorization = request.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim() || null;
  }
  return null;
}

// Build the security attributes attached to both set and clear cookie headers.
function cookieAttributes({ maxAge = null, expires = null } = {}) {
  const secure = String(process.env.COOKIE_SECURE || "").toLowerCase() === "true"
    || process.env.APP_ENV === "production";
  const sameSiteRaw = process.env.COOKIE_SAME_SITE || "Lax";
  const sameSite = ["Lax", "Strict", "None"].includes(sameSiteRaw) ? sameSiteRaw : "Lax";
  const name = cookieName();

  // SameSite=None is only safe/valid when the cookie is also Secure.
  if (sameSite === "None" && !secure) {
    throw new Error("COOKIE_SAME_SITE=None requires COOKIE_SECURE=true.");
  }

  // The __Host- browser prefix forbids a Domain attribute by design.
  if (name.startsWith("__Host-") && process.env.COOKIE_DOMAIN) {
    throw new Error("A __Host- session cookie cannot use COOKIE_DOMAIN.");
  }

  const attributes = ["Path=/", "HttpOnly", `SameSite=${sameSite}`];
  if (secure) attributes.push("Secure");
  if (process.env.COOKIE_DOMAIN && !name.startsWith("__Host-")) attributes.push(`Domain=${process.env.COOKIE_DOMAIN}`);
  if (Number.isFinite(maxAge)) attributes.push(`Max-Age=${Math.max(0, Math.floor(maxAge))}`);
  if (expires instanceof Date) attributes.push(`Expires=${expires.toUTCString()}`);
  return attributes.join("; ");
}

// Send the session token to the browser without exposing it to frontend JavaScript.
export function setSessionCookie(response, token, expiresAt) {
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
  response.setHeader("Set-Cookie", `${cookieName()}=${encodeURIComponent(token)}; ${cookieAttributes({ maxAge, expires })}`);
}

// Expire the cookie immediately during logout/password-security flows.
export function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", `${cookieName()}=; ${cookieAttributes({ maxAge: 0, expires: new Date(0) })}`);
}
