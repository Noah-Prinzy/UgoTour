// ============================================================
// CENTRAL FRONTEND API CLIENT - PHASE 9
// ============================================================
// Browser authentication now uses an HttpOnly session cookie set by the API.
// JavaScript never reads or stores the session token.

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

export class ApiError extends Error {
  constructor(message, status = 0, requestId = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

export async function apiRequest(
  path,
  { method = "GET", body, authenticated = false, headers = {} } = {}
) {
  const requestHeaders = { ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(
      "Could not reach the UgoTour API. Make sure the Node.js backend is running and CORS is configured for this site.",
      0
    );
  }

  if (response.status === 204) return null;

  let payload = null;
  try { payload = await response.json(); } catch { /* useful error below */ }

  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Request failed with status ${response.status}.`,
      response.status,
      response.headers.get("X-Request-ID")
    );
  }
  return payload;
}
