// ============================================================
// CONTACT PAGE CONTROLLER
// Renders shared navigation/footer, pre-fills known account details, then submits
// the Contact form through frontend/js/services/contact-service.js.
// ============================================================

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { getCurrentUser } from "../services/auth-service.js";
import { sendContactMessage } from "../services/contact-service.js";

// Contact works for guests too, so failure/no session simply produces `null`.
const user = await getCurrentUser().catch(() => null);
await renderNavbar("..", user);
renderFooter();

// Logged-in users do not need to retype the name/email already on their account.
if (user) {
  document.getElementById("contact-name").value = user.name;
  document.getElementById("contact-email").value = user.email;
}

const form = document.getElementById("contact-form");
const status = document.getElementById("contact-status");

// Collect the four form fields, disable the button during the API request and show
// either the backend success message or the thrown API error.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;

  try {
    const result = await sendContactMessage({
      name: document.getElementById("contact-name").value,
      email: document.getElementById("contact-email").value,
      subject: document.getElementById("contact-subject").value,
      message: document.getElementById("contact-message").value
    });

    status.textContent = result.message;
    status.className = "form-message form-message-success";
    form.reset();

    // Reset clears all inputs, so restore account details for a signed-in user.
    if (user) {
      document.getElementById("contact-name").value = user.name;
      document.getElementById("contact-email").value = user.email;
    }
  } catch (error) {
    status.textContent = error.message;
    status.className = "form-message form-message-error";
  } finally {
    button.disabled = false;
  }
});
