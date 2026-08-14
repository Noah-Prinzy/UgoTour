// ============================================================
// CENTRAL FRONTEND API CLIENT - PHASE 9
// ============================================================
// Every browser-side service eventually passes through this file. It decides
// which API base URL to use, sends credentialed fetch requests, converts HTTP
// failures into ApiError objects and returns parsed JSON to page/service code.
// Browser authentication uses an HttpOnly session cookie set by the API, so
// frontend JavaScript never reads or stores the session token.

// Local Live Server pages call the Node backend on port 3000. In production the
// PWA and /api share one origin, so relative same-origin requests are used.
const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const defaultApiBaseUrl = isLocalDevelopment
  ? `http://${window.location.hostname}:3000/api`
  : `${window.location.origin}/api`;

// Production defaults to a same-origin /api reverse proxy, which is the safest
// and simplest cookie deployment. A separate API origin can still be supplied
// before modules load with window.UGOTOUR_API_BASE_URL.
export const API_BASE_URL =
  window.UGOTOUR_API_BASE_URL ||
  localStorage.getItem("ugotour_api_base_url") ||
  defaultApiBaseUrl;

// Remove the old Phase 8 bearer token if it still exists in a returning user's
// browser. The API cookie is now the only browser-session source of truth.
localStorage.removeItem("ugotour_auth_token");

// Custom error type keeps the HTTP status/request id available to callers that
// need special handling for 401, 404, etc.
export class ApiError extends Error {
  constructor(message, status = 0, requestId = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

// Generic request helper used by every frontend service module.
export async function apiRequest(
  path,
  { method = "GET", body, authenticated = false, headers = {} } = {}
) {
  // JSON bodies need the content-type header; GET requests usually do not.
  const requestHeaders = { ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  let response;
  try {
    // credentials:"include" sends/receives the HttpOnly session cookie. The
    // `authenticated` option is kept for readable call sites/backwards API shape.
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    // Network errors happen before an HTTP response exists, so status is 0.
    throw new ApiError(
      "Could not reach the UgoTour API. Make sure the Node.js backend is running and CORS is configured for this site.",
      0
    );
  }

  // DELETE operations may intentionally return HTTP 204 with no JSON body.
  if (response.status === 204) return null;

  // Try to parse the normal JSON response; a malformed/non-JSON error still gets
  // a useful fallback message below.
  let payload = null;
  try { payload = await response.json(); } catch { /* useful error below */ }

  // Turn non-2xx responses into one predictable JavaScript error type.
  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Request failed with status ${response.status}.`,
      response.status,
      response.headers.get("X-Request-ID")
    );
  }
  return payload;
}
