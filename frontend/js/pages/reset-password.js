// ============================================================
// RESET PASSWORD PAGE CONTROLLER
// Reads the one-time token from the URL, validates matching passwords in the UI,
// then asks the backend to consume the token and set the new password.
// ============================================================

import { resetPassword } from "../services/auth-service.js";

// Password-reset links arrive as reset-password.html?token=...
const token = new URLSearchParams(location.search).get("token") || "";
const form = document.getElementById("reset-form");
const message = document.getElementById("reset-message");

// Without a token the form cannot securely identify a recovery request.
if (!token) {
  message.textContent = "This reset link is missing its security token.";
  message.className = "form-message form-message-error";
  form.querySelector("button").disabled = true;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = document.getElementById("reset-password").value;
  const confirmation = document.getElementById("reset-confirm").value;

  // Catch mismatched fields before making a network request.
  if (password !== confirmation) {
    message.textContent = "Passwords do not match.";
    message.className = "form-message form-message-error";
    return;
  }

  const button = form.querySelector("button");
  button.disabled = true;
  const result = await resetPassword(token, password);
  message.textContent = result.message;
  message.className = `form-message ${result.success ? "form-message-success" : "form-message-error"}`;

  // Successful recovery sends the user to Login; failures re-enable this form.
  if (result.success) setTimeout(() => location.replace("./login.html"), 1200);
  else button.disabled = false;
});
