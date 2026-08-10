import { createAccount, login, logout } from "../services/auth-service.js";
import { getBearerToken, readJsonBody, sendJson } from "../utils/http.js";
import { isEmail, isNonEmptyString } from "../utils/validation.js";

export async function signup(request, response) {
  const body = await readJsonBody(request);

  if (!isNonEmptyString(body.name) || !isEmail(body.email)) {
    sendJson(response, 400, { error: "A valid name and email are required." });
    return;
  }

  if (!isNonEmptyString(body.password) || body.password.length < 8) {
    sendJson(response, 400, { error: "Password must contain at least 8 characters." });
    return;
  }

  const result = await createAccount(body);
  sendJson(response, 201, { data: result });
}

export async function loginUser(request, response) {
  const body = await readJsonBody(request);

  if (!isEmail(body.email) || !isNonEmptyString(body.password)) {
    sendJson(response, 400, { error: "Email and password are required." });
    return;
  }

  const result = await login(body);
  sendJson(response, 200, { data: result });
}

export function logoutUser(request, response) {
  logout(getBearerToken(request));
  sendJson(response, 200, { message: "Logged out successfully." });
}
