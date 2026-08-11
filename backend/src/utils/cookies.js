function cookieName() {
  if (process.env.SESSION_COOKIE_NAME) return process.env.SESSION_COOKIE_NAME;
  return process.env.APP_ENV === "production" ? "__Host-ugotour_session" : "ugotour_session";
}

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

export function getSessionToken(request) {
  const cookieToken = parseCookies(request)[cookieName()];
  if (cookieToken) return cookieToken;

  // Keep Bearer support for API tooling and backwards compatibility. Browser
  // sessions use the HttpOnly cookie path instead of JavaScript token storage.
  const authorization = request.headers.authorization || "";
  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim() || null;
  }
  return null;
}

function cookieAttributes({ maxAge = null, expires = null } = {}) {
  const secure = String(process.env.COOKIE_SECURE || "").toLowerCase() === "true"
    || process.env.APP_ENV === "production";
  const sameSiteRaw = process.env.COOKIE_SAME_SITE || "Lax";
  const sameSite = ["Lax", "Strict", "None"].includes(sameSiteRaw) ? sameSiteRaw : "Lax";
  const name = cookieName();

  if (sameSite === "None" && !secure) {
    throw new Error("COOKIE_SAME_SITE=None requires COOKIE_SECURE=true.");
  }
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

export function setSessionCookie(response, token, expiresAt) {
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
  response.setHeader("Set-Cookie", `${cookieName()}=${encodeURIComponent(token)}; ${cookieAttributes({ maxAge, expires })}`);
}

export function clearSessionCookie(response) {
  response.setHeader("Set-Cookie", `${cookieName()}=; ${cookieAttributes({ maxAge: 0, expires: new Date(0) })}`);
}
