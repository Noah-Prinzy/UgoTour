import { authRateLimit } from "../middleware/rate-limit.js";
import { confirmPasswordReset, requestPasswordReset } from "../services/password-reset-service.js";
import { readJsonBody, sendJson } from "../utils/http.js";
import { isEmail, isNonEmptyString } from "../utils/validation.js";

export async function requestReset(request, response) {
  authRateLimit(request);
  const body = await readJsonBody(request);
  if (!isEmail(body.email)) return sendJson(response, 400, { error: "Enter a valid email address." });

  const result = await requestPasswordReset(body.email);
  sendJson(response, 200, {
    message: "If an account exists for that email, password reset instructions have been prepared.",
    ...(result.developmentResetUrl ? { developmentResetUrl: result.developmentResetUrl } : {})
  });
}

export async function confirmReset(request, response) {
  authRateLimit(request);
  const body = await readJsonBody(request);
  if (!isNonEmptyString(body.token)) return sendJson(response, 400, { error: "A reset token is required." });
  if (!isNonEmptyString(body.newPassword) || body.newPassword.length < 10 || body.newPassword.length > 128) {
    return sendJson(response, 400, { error: "Password must contain 10 to 128 characters." });
  }
  await confirmPasswordReset(body.token, body.newPassword);
  sendJson(response, 200, { message: "Password reset successfully. Please log in with your new password." });
}
