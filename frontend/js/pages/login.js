import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { validateLogin } from "../services/auth-service.js";

renderNavbar("..");
renderFooter();

document.getElementById("login-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const message = document.getElementById("login-message");
  message.textContent = validateLogin(email, password)
    ? "Frontend validation passed. Backend authentication comes later."
    : "Please enter both email and password.";
});
