import "../ui-motion.js";
// ============================================================
// SIGNUP PAGE - PHASE 8
// ============================================================
// Signup now POSTs to /api/auth/signup. The backend hashes the password with
// scrypt, saves the user in PostgreSQL and returns a bearer session token.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import {
  createAccount
} from "../services/auth-service.js";
import { redirectAuthenticatedUser } from "../services/session-guard.js";
import { passwordsMatch } from "../utils/validation.js";

const redirected = await redirectAuthenticatedUser("../index.html");
if (!redirected) {
  await renderNavbar("..", null);
  renderFooter();
}

const signupForm = document.getElementById("signup-form");
const signupMessage = document.getElementById("signup-message");

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("signup-name")?.value ?? "";
  const email = document.getElementById("signup-email")?.value ?? "";
  const password = document.getElementById("signup-password")?.value ?? "";
  const confirmPassword = document.getElementById("signup-confirm-password")?.value ?? "";

  if (!passwordsMatch(password, confirmPassword)) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  setFormBusy(true);

  const result = await createAccount({ name, email, password });

  if (!result.success) {
    showMessage(result.message, "error");
    setFormBusy(false);
    return;
  }

  showMessage("Account created. Opening UgoTour...", "success");
  window.location.replace("../index.html");
});

function showMessage(message, type) {
  if (!signupMessage) return;

  signupMessage.textContent = message;
  signupMessage.className = `form-message ${type === "success" ? "form-message-success" : "form-message-error"}`;
}

function setFormBusy(isBusy) {
  const submitButton = signupForm?.querySelector('button[type="submit"]');
  if (!submitButton) return;

  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "Creating account..." : "Create account";
}
