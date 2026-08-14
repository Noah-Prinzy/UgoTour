// ============================================================
// FORGOT PASSWORD PAGE CONTROLLER
// Starts the password-recovery flow by sending an email address to the backend.
// In local development the backend may return a direct reset URL for testing.
// ============================================================

import { redirectAuthenticatedUser } from "../services/session-guard.js";
import { requestPasswordReset } from "../services/auth-service.js";

// A user with a valid session does not need the recovery form.
await redirectAuthenticatedUser("../index.html");

const form = document.getElementById("forgot-form");
const message = document.getElementById("forgot-message");
const dev = document.getElementById("forgot-dev-link");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;

  // The service/backend deliberately returns a neutral public response so this
  // form does not reveal whether an account exists for the supplied email.
  const result = await requestPasswordReset(document.getElementById("forgot-email").value);
  message.textContent = result.message;
  message.className = `form-message ${result.success ? "form-message-success" : "form-message-error"}`;

  // Development only: make the terminal/test reset URL clickable in the browser.
  if (result.developmentResetUrl) {
    dev.hidden = false;
    dev.innerHTML = `Development only: <a href="${result.developmentResetUrl}">open reset page</a>`;
  }

  button.disabled = false;
});
