// ============================================================
// SIGNUP PAGE FUNCTIONALITY
// ============================================================

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { createAccount, getCurrentUser } from "../services/auth-service.js";
import { passwordsMatch } from "../utils/validation.js";

renderNavbar("..");
renderFooter();

// If a user is already logged in, they do not need another signup form.
if (getCurrentUser()) {
  window.location.href = "./profile.html";
}

const signupForm = document.getElementById("signup-form");
const signupMessage = document.getElementById("signup-message");

signupForm?.addEventListener("submit", async (event) => {
  // Stop the browser from refreshing the page when the form submits.
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

  try {
    const result = await createAccount({ name, email, password });

    if (!result.success) {
      showMessage(result.message, "error");
      return;
    }

    showMessage("Account created. Opening your profile...", "success");

    // Small synchronous navigation is enough; no background process is used.
    window.location.href = "./profile.html";
  } catch (error) {
    console.error("Signup error:", error);
    showMessage("UgoTour could not create the account in this browser.", "error");
  } finally {
    setFormBusy(false);
  }
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
