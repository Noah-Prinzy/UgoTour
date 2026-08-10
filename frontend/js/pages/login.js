// ============================================================
// LOGIN PAGE - PHASE 8
// ============================================================
// Credentials are verified by the Node.js backend against PostgreSQL. A
// successful login saves only the returned bearer token in this browser.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import {
  getCurrentUser,
  hasLocalSessionToken,
  loginUser
} from "../services/auth-service.js";

await renderNavbar("..");
renderFooter();

if (hasLocalSessionToken()) {
  try {
    if (await getCurrentUser()) {
      window.location.href = "./profile.html";
    }
  } catch (error) {
    console.error("Session check failed:", error);
  }
}

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email")?.value ?? "";
  const password = document.getElementById("login-password")?.value ?? "";

  setFormBusy(true);
  const result = await loginUser({ email, password });

  if (!result.success) {
    showMessage(result.message, "error");
    setFormBusy(false);
    return;
  }

  showMessage("Login successful. Opening your profile...", "success");
  window.location.href = "./profile.html";
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
