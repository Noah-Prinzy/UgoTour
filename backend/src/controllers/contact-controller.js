// ============================================================
// CONTACT CONTROLLER
// Validates messages submitted from the Contact page and passes clean input to
// the contact service for PostgreSQL storage.
// ============================================================

import { getAuthenticatedUser } from "../middleware/auth.js";
import { contactRateLimit } from "../middleware/rate-limit.js";
import { createContactMessage } from "../services/contact-service.js";
import { readJsonBody, sendJson } from "../utils/http.js";
import { isEmail, isNonEmptyString } from "../utils/validation.js";

// POST /api/contact
// Rate-limit abuse, validate each field, optionally associate the message with
// a logged-in user, then save the final message through the service layer.
export async function postContactMessage(request, response) {
  contactRateLimit(request);
  const body = await readJsonBody(request);
  if (!isNonEmptyString(body.name) || body.name.trim().length > 120) return sendJson(response, 400, { error: "Enter your name." });
  if (!isEmail(body.email)) return sendJson(response, 400, { error: "Enter a valid email address." });
  if (!isNonEmptyString(body.subject) || body.subject.trim().length > 180) return sendJson(response, 400, { error: "Enter a subject." });
  if (!isNonEmptyString(body.message) || body.message.trim().length < 10 || body.message.trim().length > 4000) {
    return sendJson(response, 400, { error: "Message must contain between 10 and 4000 characters." });
  }

  // Contact is public, so authentication is optional. If a valid session exists,
  // storing the user id lets the admin dashboard connect the message to a user.
  const user = await getAuthenticatedUser(request).catch(() => null);
  const saved = await createContactMessage({ userId: user?.id ?? null, ...body });
  sendJson(response, 201, { data: saved, message: "Thanks — your message has been received." });
}
