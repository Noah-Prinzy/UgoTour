function allowedOrigins() {
  return new Set(
    String(process.env.CORS_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

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

function requestOrigin(request) {
  const protocol = String(process.env.TRUST_PROXY || "").toLowerCase() === "true"
    ? String(request.headers["x-forwarded-proto"] || "https").split(",")[0].trim()
    : (request.socket?.encrypted ? "https" : "http");
  return `${protocol}://${request.headers.host ?? "localhost"}`;
}

export function isAllowedOrigin(request, origin) {
  if (!origin) return true;
  if (origin === requestOrigin(request)) return true;
  return allowedOrigins().has(origin) || isDevelopmentLocalOrigin(origin);
}

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
