import { getAuthenticatedUser } from "../middleware/auth.js";
import { updateProfile, changePassword } from "../services/user-service.js";
import { readJsonBody, sendJson } from "../utils/http.js";
import { isEmail, isNonEmptyString } from "../utils/validation.js";

export async function getProfile(request, response) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  sendJson(response, 200, { data: user });
}

export async function patchProfile(request, response) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  const body = await readJsonBody(request);

  if (body.name !== undefined && !isNonEmptyString(body.name)) {
    sendJson(response, 400, { error: "Name cannot be empty." });
    return;
  }

  if (body.email !== undefined && !isEmail(body.email)) {
    sendJson(response, 400, { error: "A valid email is required." });
    return;
  }

  const updatedUser = await updateProfile(user.id, body);

  if (!updatedUser) {
    sendJson(response, 404, { error: "User not found." });
    return;
  }

  sendJson(response, 200, { data: updatedUser });
}

export async function patchPassword(request, response) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return;
  }

  const body = await readJsonBody(request);

  if (!isNonEmptyString(body.currentPassword)) {
    sendJson(response, 400, { error: "Current password is required." });
    return;
  }

  if (!isNonEmptyString(body.newPassword) || body.newPassword.length < 8) {
    sendJson(response, 400, { error: "New password must contain at least 8 characters." });
    return;
  }

  await changePassword(user.id, body.currentPassword, body.newPassword);
  sendJson(response, 200, { message: "Password changed successfully." });
}
