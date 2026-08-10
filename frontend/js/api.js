// ============================================================
// CENTRAL FRONTEND API CLIENT - PHASE 8
// ============================================================
// Every frontend service uses this file to talk to the Node.js REST API.
// Keeping fetch() details here avoids repeating headers, JSON parsing and
// authentication logic across destination, booking and account services.

// Local development default. A deployed build can set window.UGOTOUR_API_BASE_URL
// before modules load, or a developer can store ugotour_api_base_url locally.
export const API_BASE_URL =
  window.UGOTOUR_API_BASE_URL ||
  localStorage.getItem("ugotour_api_base_url") ||
  "http://127.0.0.1:3000/api";
const AUTH_TOKEN_KEY = "ugotour_auth_token";

// A small custom error lets page code distinguish HTTP errors such as 401/404
// from network errors such as the backend server not running.
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function saveAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, String(token));
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

export async function apiRequest(
  path,
  { method = "GET", body, authenticated = false, headers = {} } = {}
) {
  const requestHeaders = {
    ...headers
  };

  // Only send Content-Type when a JSON body actually exists.
  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (authenticated) {
    const token = getAuthToken();

    if (!token) {
      throw new ApiError("Authentication required.", 401);
    }

    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    throw new ApiError(
      "Could not reach the UgoTour API. Make sure the Node.js backend is running on port 3000.",
      0
    );
  }

  // DELETE /api/bookings/:id returns 204 No Content after success.
  if (response.status === 204) {
    return null;
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    // A malformed/non-JSON server response should still become a useful error.
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Request failed with status ${response.status}.`,
      response.status
    );
  }

  return payload;
}
