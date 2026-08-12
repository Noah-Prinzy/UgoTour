import "../ui-motion.js";
// ============================================================
// SIGNUP PAGE - PHASE 8 + PHASE 1.23 AUTH HANDOFF
// ============================================================
// Signup POSTs to /api/auth/signup. The backend creates the account and the
// existing session flow remains unchanged; this file only adds the branded
// successful-authentication transition before Home opens.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createAccount } from "../services/auth-service.js";
import { redirectAuthenticatedUser } from "../services/session-guard.js";
import { passwordsMatch } from "../utils/validation.js";
import { transitionToHome } from "../auth-home-transition.js";

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

  showMessage("Account created. Preparing UgoTour…", "success");
  await transitionToHome("../index.html", { mode: "signup" });
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
