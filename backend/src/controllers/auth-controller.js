// ============================================================
// AUTH CONTROLLER
// Receives signup/login/logout HTTP requests, validates input,
// calls the authentication service, and manages the session cookie.
// ============================================================

// Dependencies used for account logic, rate limiting, cookies and HTTP helpers.
import { createAccount, login, logout } from "../services/auth-service.js";
import { authRateLimit } from "../middleware/rate-limit.js";
import { clearSessionCookie, getSessionToken, setSessionCookie } from "../utils/cookies.js";
import { readJsonBody, sendJson } from "../utils/http.js";
import { isEmail, isNonEmptyString } from "../utils/validation.js";

// Keep password-length rules in one helper so signup validation stays readable.
function validatePassword(password) {
  return isNonEmptyString(password) && password.length >= 10 && password.length <= 128;
}

// POST /api/auth/signup
// Validate the new account, create it in PostgreSQL through the service layer,
// then place the newly-created session token in an HttpOnly cookie.
export async function signup(request, response) {
  authRateLimit(request);
  const body = await readJsonBody(request);

  if (!isNonEmptyString(body.name) || body.name.trim().length > 120 || !isEmail(body.email)) {
    return sendJson(response, 400, { error: "A valid name and email are required." });
  }
  if (!validatePassword(body.password)) {
    return sendJson(response, 400, { error: "Password must contain 10 to 128 characters." });
  }

  const result = await createAccount(body);
  setSessionCookie(response, result.token, result.expiresAt);
  sendJson(response, 201, { data: { user: result.user, sessionExpiresAt: result.expiresAt } });
}

// POST /api/auth/login
// Check credentials through the service layer and create a browser session cookie.
export async function loginUser(request, response) {
  authRateLimit(request);
  const body = await readJsonBody(request);
  if (!isEmail(body.email) || !isNonEmptyString(body.password)) {
    return sendJson(response, 400, { error: "Email and password are required." });
  }

  const result = await login(body);
  setSessionCookie(response, result.token, result.expiresAt);
  sendJson(response, 200, { data: { user: result.user, sessionExpiresAt: result.expiresAt } });
}

// POST /api/auth/logout
// Delete the server-side session and clear the matching cookie in the browser.
export async function logoutUser(request, response) {
  await logout(getSessionToken(request));
  clearSessionCookie(response);
  sendJson(response, 200, { message: "Logged out successfully." });
}
