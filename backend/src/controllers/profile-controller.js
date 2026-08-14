// ============================================================
// PROFILE CONTROLLER
// Handles authenticated profile data, profile photos, traveller feedback and
// password changes. Validation happens here before services touch PostgreSQL.
// ============================================================

import { getAuthenticatedUser } from "../middleware/auth.js";
import {
  changePassword,
  getProfileFeedback,
  updateProfile,
  updateProfileImage,
  upsertProfileFeedback
} from "../services/user-service.js";
import { clearSessionCookie } from "../utils/cookies.js";
import { readJsonBody, sendJson } from "../utils/http.js";
import { isEmail, isNonEmptyString } from "../utils/validation.js";

// GET /api/profile — also acts as the frontend's session-validity check.
export async function getProfile(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  sendJson(response, 200, { data: user });
}

// PATCH /api/profile — validate optional account fields and save allowed changes.
export async function patchProfile(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  const body = await readJsonBody(request);
  if (body.name !== undefined && (!isNonEmptyString(body.name) || body.name.trim().length > 120)) return sendJson(response, 400, { error: "Name must contain 1 to 120 characters." });
  if (body.email !== undefined && !isEmail(body.email)) return sendJson(response, 400, { error: "A valid email is required." });
  if (body.bio !== undefined && (typeof body.bio !== "string" || body.bio.trim().length > 500)) return sendJson(response, 400, { error: "Bio must contain at most 500 characters." });
  const updated = await updateProfile(user.id, body);
  if (!updated) return sendJson(response, 404, { error: "User not found." });
  sendJson(response, 200, { data: updated });
}

// PATCH /api/profile/photo — accept processed browser image data within a size limit.
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

// GET /api/profile/feedback — retrieve this user's current rating/review, if any.
export async function getFeedback(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  sendJson(response, 200, { data: await getProfileFeedback(user.id) });
}

// PATCH /api/profile/feedback — validate and create/update a user's single review.
export async function patchFeedback(request, response) {
  const user = await getAuthenticatedUser(request);
  if (!user) return sendJson(response, 401, { error: "Authentication required." });
  const body = await readJsonBody(request);
  const rating = Number(body.rating);
  const review = String(body.review ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return sendJson(response, 400, { error: "Rating must be from 1 to 5." });
  if (!review || review.length > 1200) return sendJson(response, 400, { error: "Feedback must contain 1 to 1200 characters." });
  sendJson(response, 200, { data: await upsertProfileFeedback(user.id, { rating, review }) });
}

// PATCH /api/profile/password
// A successful password change invalidates all existing sessions, so this
// response clears the current cookie and asks the frontend to log in again.
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
