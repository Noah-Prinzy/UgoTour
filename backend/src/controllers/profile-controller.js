import { getAuthenticatedUser } from "../middleware/auth.js";
import { changePassword, updateProfile, updateProfileImage } from "../services/user-service.js";
import { clearSessionCookie } from "../utils/cookies.js";
import { readJsonBody, sendJson } from "../utils/http.js";
import { isEmail, isNonEmptyString } from "../utils/validation.js";

export async function getProfile(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  sendJson(response, 200, { data: user });
}

export async function patchProfile(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  const body = await readJsonBody(request);
  if (body.name !== undefined && (!isNonEmptyString(body.name) || body.name.trim().length > 120)) return sendJson(response, 400, { error: "Name must contain 1 to 120 characters." });
  if (body.email !== undefined && !isEmail(body.email)) return sendJson(response, 400, { error: "A valid email is required." });
  const updated = await updateProfile(user.id, body);
  if (!updated) return sendJson(response, 404, { error: "User not found." });
  sendJson(response, 200, { data: updated });
}

export async function patchProfilePhoto(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  const body = await readJsonBody(request);
  const imageData = body.imageData ?? null;
  if (imageData !== null) {
    if (typeof imageData !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(imageData)) return sendJson(response, 400, { error: "Profile photo must be a JPEG, PNG or WebP image." });
    if (imageData.length > 850_000) return sendJson(response, 413, { error: "Profile photo is too large after processing." });
  }
  const updated = await updateProfileImage(user.id, imageData);
  sendJson(response, 200, { data: updated });
}

export async function patchPassword(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  const body = await readJsonBody(request);
  if (!isNonEmptyString(body.currentPassword)) return sendJson(response, 400, { error: "Current password is required." });
  if (!isNonEmptyString(body.newPassword) || body.newPassword.length < 10 || body.newPassword.length > 128) return sendJson(response, 400, { error: "New password must contain 10 to 128 characters." });
  await changePassword(user.id, body.currentPassword, body.newPassword);
  clearSessionCookie(response);
  sendJson(response, 200, { message: "Password changed successfully. Please log in again.", reauthRequired: true });
}
