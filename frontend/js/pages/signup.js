import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { validateSignup } from "../services/auth-service.js";

renderNavbar("..");
renderFooter();

document.getElementById("signup-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const message = document.getElementById("signup-message");
  message.textContent = validateSignup(name, email, password)
    ? "Frontend validation passed. Account creation will connect to the backend later."
    : "Enter a name, email and password of at least 6 characters.";
});
