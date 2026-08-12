import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import { changeCurrentUserPassword, updateCurrentUserProfile } from "../services/auth-service.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";
import { passwordsMatch } from "../utils/validation.js";

let currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const profileForm = document.getElementById("profile-settings-form");
const passwordForm = document.getElementById("profile-settings-password-form");
const nameInput = document.getElementById("profile-settings-name");
const emailInput = document.getElementById("profile-settings-email");
const bioInput = document.getElementById("profile-settings-bio");

if (nameInput) nameInput.value = currentUser.name || "";
if (emailInput) emailInput.value = currentUser.email || "";
if (bioInput) bioInput.value = currentUser.bio || "";

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = profileForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  const result = await updateCurrentUserProfile({ name:nameInput?.value || "", email:emailInput?.value || "", bio:bioInput?.value || "" });
  showMessage("profile-settings-message", result.message, result.success);
  if (result.success) {
    currentUser = result.user;
    await renderNavbar("..", currentUser);
  }
  if (button) button.disabled = false;
});

passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentPassword = document.getElementById("profile-settings-current-password")?.value || "";
  const newPassword = document.getElementById("profile-settings-new-password")?.value || "";
  const confirm = document.getElementById("profile-settings-confirm-password")?.value || "";
  if (!passwordsMatch(newPassword, confirm)) return showMessage("profile-settings-password-message", "New passwords do not match.", false);
  const button = passwordForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  const result = await changeCurrentUserPassword(currentPassword, newPassword);
  showMessage("profile-settings-password-message", result.message, result.success);
  if (result.success) {
    passwordForm.reset();
    if (result.reauthRequired) window.setTimeout(() => window.location.replace("./login.html"), 900);
  }
  if (button) button.disabled = false;
});

function showMessage(id, message, success) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${success ? "form-message-success" : "form-message-error"}`;
}
