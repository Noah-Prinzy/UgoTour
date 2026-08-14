// ============================================================
// CORS + TRUSTED WRITE-ORIGIN MIDDLEWARE
// Controls which browser origins may call the API with credentials and adds a
// defense-in-depth check against cross-site state-changing requests.
// ============================================================

// Convert the comma-separated CORS environment variable into a fast lookup Set.
function allowedOrigins() {
  return new Set(
    String(process.env.CORS_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

// During local development, allow localhost/127.0.0.1 on arbitrary dev ports.
function isDevelopmentLocalOrigin(origin) {
  if (process.env.APP_ENV === "production") return false;
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname)
      && ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// Reconstruct the API's own origin. TRUST_PROXY is only used when the hosting
// reverse proxy supplies trustworthy X-Forwarded-Proto headers.
function requestOrigin(request) {
  const protocol = String(process.env.TRUST_PROXY || "").toLowerCase() === "true"
    ? String(request.headers["x-forwarded-proto"] || "https").split(",")[0].trim()
    : (request.socket?.encrypted ? "https" : "http");
  return `${protocol}://${request.headers.host ?? "localhost"}`;
}

// Same-origin calls are always acceptable; configured and local-dev origins are
// accepted according to the rules above.
export function isAllowedOrigin(request, origin) {
  if (!origin) return true;
  if (origin === requestOrigin(request)) return true;
  return allowedOrigins().has(origin) || isDevelopmentLocalOrigin(origin);
}

// Add credential-aware CORS response headers when the caller is trusted.
export function applyCors(request, response) {
  const origin = request.headers.origin;
  if (!origin) return;

  if (isAllowedOrigin(request, origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
  response.setHeader("Access-Control-Expose-Headers", "X-Request-ID");
}

// Cookie-authenticated browser writes must come from this application (or an
// explicitly configured frontend origin). This is a defense-in-depth CSRF
// check in addition to SameSite cookies and credentialed CORS.
export function enforceTrustedWriteOrigin(request) {
  // Read-only methods do not modify account/database state, so they bypass this guard.
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;

  const fetchSite = String(request.headers["sec-fetch-site"] || "").toLowerCase();
  if (fetchSite === "cross-site") {
    const error = new Error("Cross-site request blocked.");
    error.statusCode = 403;
    throw error;
  }

  const origin = request.headers.origin;
  if (origin && !isAllowedOrigin(request, origin)) {
    const error = new Error("Request origin is not allowed.");
    error.statusCode = 403;
    throw error;
  }
}
