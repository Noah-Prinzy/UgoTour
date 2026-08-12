import "../ui-motion.js";
// ============================================================
// LOGIN PAGE - PHASE 8 + PHASE 1.23 AUTH HANDOFF
// ============================================================
// Credentials are verified by the Node.js backend against PostgreSQL. A
// successful login receives an HttpOnly session cookie from the API; JavaScript
// never receives or stores the session token.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { loginUser } from "../services/auth-service.js";
import { redirectAuthenticatedUser } from "../services/session-guard.js";
import { transitionToHome } from "../auth-home-transition.js";

const redirected = await redirectAuthenticatedUser("../index.html");
if (!redirected) {
  await renderNavbar("..", null);
  renderFooter();
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

  showMessage("Login successful. Preparing UgoTour…", "success");
  await transitionToHome("../index.html", { mode: "login" });
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
