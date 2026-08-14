// ============================================================
// PROFILE SETTINGS PAGE CONTROLLER
// Loads the authenticated user's editable account fields, submits profile updates,
// and handles security-sensitive password changes.
// ============================================================

import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { changeCurrentUserPassword, updateCurrentUserProfile } from "../services/auth-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { passwordsMatch } from "../utils/validation.js";

// This entire page is protected by the server-backed session check.
let currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const profileForm = document.getElementById("profile-settings-form");
const passwordForm = document.getElementById("profile-settings-password-form");
const nameInput = document.getElementById("profile-settings-name");
const emailInput = document.getElementById("profile-settings-email");
const bioInput = document.getElementById("profile-settings-bio");

// Populate the form from GET /api/profile so it reflects database values.
if (nameInput) nameInput.value = currentUser.name || "";
if (emailInput) emailInput.value = currentUser.email || "";
if (bioInput) bioInput.value = currentUser.bio || "";

// Save name/email/bio. On success, refresh the navbar in case the visible name changed.
profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = profileForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;

  const result = await updateCurrentUserProfile({
    name: nameInput?.value || "",
    email: emailInput?.value || "",
    bio: bioInput?.value || ""
  });

  showMessage("profile-settings-message", result.message, result.success);
  if (result.success) {
    currentUser = result.user;
    await renderNavbar("..", currentUser);
  }
  if (button) button.disabled = false;
});

// Password changes require the current password plus two matching new-password fields.
passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentPassword = document.getElementById("profile-settings-current-password")?.value || "";
  const newPassword = document.getElementById("profile-settings-new-password")?.value || "";
  const confirm = document.getElementById("profile-settings-confirm-password")?.value || "";

  if (!passwordsMatch(newPassword, confirm)) {
    return showMessage("profile-settings-password-message", "New passwords do not match.", false);
  }

  const button = passwordForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  const result = await changeCurrentUserPassword(currentPassword, newPassword);
  showMessage("profile-settings-password-message", result.message, result.success);

  // The backend invalidates sessions after a password change, so redirect to Login.
  if (result.success) {
    passwordForm.reset();
    if (result.reauthRequired) window.setTimeout(() => window.location.replace("./login.html"), 900);
  }
  if (button) button.disabled = false;
});

// Shared helper for success/error feedback beneath either form.
function showMessage(id, message, success) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${success ? "form-message-success" : "form-message-error"}`;
}
