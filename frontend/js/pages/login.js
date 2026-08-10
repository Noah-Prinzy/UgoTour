// ============================================================
// LOGIN PAGE FUNCTIONALITY
// ============================================================

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getCurrentUser, loginUser } from "../services/auth-service.js";

renderNavbar("..");
renderFooter();

// A logged-in user goes straight to their profile.
if (getCurrentUser()) {
  window.location.href = "./profile.html";
}

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email")?.value ?? "";
  const password = document.getElementById("login-password")?.value ?? "";

  setFormBusy(true);

  try {
    const result = await loginUser(email, password);

    if (!result.success) {
      showMessage(result.message, "error");
      return;
    }

    showMessage("Login successful. Opening your profile...", "success");
    window.location.href = "./profile.html";
  } catch (error) {
    console.error("Login error:", error);
    showMessage("UgoTour could not log you in from this browser.", "error");
  } finally {
    setFormBusy(false);
  }
});

function showMessage(message, type) {
  if (!loginMessage) return;

  loginMessage.textContent = message;
  loginMessage.className = `form-message ${type === "success" ? "form-message-success" : "form-message-error"}`;
}

function setFormBusy(isBusy) {
  const submitButton = loginForm?.querySelector('button[type="submit"]');

  if (!submitButton) return;

  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "Logging in..." : "Login";
}
