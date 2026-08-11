import "../ui-motion.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import {
  changeCurrentUserPassword,
  logoutUser,
  updateCurrentUserProfile,
  updateCurrentUserProfileImage
} from "../services/auth-service.js";
import { passwordsMatch } from "../utils/validation.js";
import { requireAuthenticatedUser } from "../services/session-guard.js";

let currentUser = await requireAuthenticatedUser("..");
await renderNavbar("..", currentUser);
renderFooter();

const loggedOutState = document.getElementById("profile-logged-out");
const loggedInState = document.getElementById("profile-logged-in");
const profileForm = document.getElementById("profile-form");
const passwordForm = document.getElementById("password-form");
const photoInput = document.getElementById("profile-photo-input");
const photoSave = document.getElementById("profile-photo-save");
const photoRemove = document.getElementById("profile-photo-remove");
let pendingProfileImage = null;

async function renderProfile() {
  loggedOutState?.setAttribute("hidden", "");
  loggedInState?.removeAttribute("hidden");
  setText("profile-display-name", currentUser.name);
  setText("profile-display-email", currentUser.email);
  setText("profile-member-since", formatDate(currentUser.createdAt));
  document.getElementById("profile-admin-link")?.toggleAttribute("hidden", currentUser.role !== "admin");
  const name = document.getElementById("profile-name"); const email = document.getElementById("profile-email");
  if (name) name.value = currentUser.name; if (email) email.value = currentUser.email;
  renderAvatar(currentUser.profileImage);
}


function renderAvatar(imageData = null) {
  const avatar = document.getElementById("profile-avatar");
  if (!avatar) return;
  avatar.innerHTML = imageData ? `<img src="${imageData}" alt="Profile picture" />` : escapeHtml(makeInitials(currentUser?.name));
}

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = profileForm.querySelector('button[type="submit"]'); if (button) button.disabled = true;
  const result = await updateCurrentUserProfile({ name: document.getElementById("profile-name")?.value ?? "", email: document.getElementById("profile-email")?.value ?? "" });
  showMessage("profile-message", result.message, result.success);
  if (result.success) { currentUser = result.user; await renderProfile(); await renderNavbar("..", currentUser); }
  if (button) button.disabled = false;
});

passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentPassword = document.getElementById("current-password")?.value ?? "";
  const newPassword = document.getElementById("new-password")?.value ?? "";
  const confirm = document.getElementById("confirm-new-password")?.value ?? "";
  if (!passwordsMatch(newPassword, confirm)) return showMessage("password-message", "New passwords do not match.", false);
  const button = passwordForm.querySelector('button[type="submit"]'); if (button) button.disabled = true;
  const result = await changeCurrentUserPassword(currentPassword, newPassword);
  showMessage("password-message", result.message, result.success);
  if (result.success) {
    passwordForm.reset();
    if (result.reauthRequired) {
      window.setTimeout(() => window.location.replace("./login.html"), 900);
      return;
    }
  }
  if (button) button.disabled = false;
});

document.getElementById("profile-photo-edit")?.addEventListener("click", () => photoInput?.click());
document.getElementById("profile-edit-shortcut")?.addEventListener("click", () => {
  document.getElementById("profile-details-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("profile-name")?.focus({ preventScroll: true });
});

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return showMessage("profile-photo-message", "Choose an image file.", false);
  if (file.size > 6_000_000) return showMessage("profile-photo-message", "Choose an image smaller than 6 MB.", false);
  try {
    pendingProfileImage = await resizeProfileImage(file);
    renderAvatar(pendingProfileImage);
    if (photoSave) photoSave.disabled = false;
    showMessage("profile-photo-message", "Preview ready. Save the photo to your profile.", true);
  } catch {
    showMessage("profile-photo-message", "That image could not be prepared.", false);
  }
});

photoSave?.addEventListener("click", async () => {
  if (!pendingProfileImage) return;
  photoSave.disabled = true;
  const result = await updateCurrentUserProfileImage(pendingProfileImage);
  showMessage("profile-photo-message", result.message, result.success);
  if (result.success) { currentUser = result.user; pendingProfileImage = null; await renderNavbar(".."); }
  else photoSave.disabled = false;
});

photoRemove?.addEventListener("click", async () => {
  const result = await updateCurrentUserProfileImage(null);
  showMessage("profile-photo-message", result.message, result.success);
  if (result.success) { currentUser = result.user; pendingProfileImage = null; renderAvatar(null); if (photoSave) photoSave.disabled = true; await renderNavbar(".."); }
});

document.getElementById("profile-logout-button")?.addEventListener("click", async () => { await logoutUser(); window.location.replace("./login.html"); });

function resizeProfileImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxSide = 512;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d"); context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Invalid image")); };
    image.src = objectUrl;
  });
}

function showMessage(id, message, success) { const element = document.getElementById(id); if (!element) return; element.textContent = message; element.className = `form-message ${success ? "form-message-success" : "form-message-error"}`; }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value ?? ""; }
function makeInitials(name) { return String(name ?? "UG").trim().split(/\s+/).slice(0,2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "UG"; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)) : "Unknown"; }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

await renderProfile();
