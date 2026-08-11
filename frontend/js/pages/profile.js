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

const photoDialog = document.getElementById("profile-photo-dialog");
const photoDialogClose = document.getElementById("profile-photo-dialog-close");
const photoCancel = document.getElementById("profile-photo-cancel");
const photoChoose = document.getElementById("profile-photo-choose");
const photoInput = document.getElementById("profile-photo-input");
const photoPreview = document.getElementById("profile-photo-preview");
const photoSave = document.getElementById("profile-photo-save");
const photoRemove = document.getElementById("profile-photo-remove");

// undefined = no pending change, null = remove current image, string = new data URL.
let pendingProfileImage;
let photoSaveInProgress = false;

async function renderProfile() {
  loggedOutState?.setAttribute("hidden", "");
  loggedInState?.removeAttribute("hidden");

  setText("profile-display-name", currentUser.name);
  setText("profile-display-email", currentUser.email);
  setText("profile-member-since", formatDate(currentUser.createdAt));

  const name = document.getElementById("profile-name");
  const email = document.getElementById("profile-email");
  if (name) name.value = currentUser.name;
  if (email) email.value = currentUser.email;

  renderAvatar(currentUser.profileImage);
}

function renderAvatar(imageData = null) {
  const avatar = document.getElementById("profile-avatar");
  if (!avatar) return;
  avatar.innerHTML = imageData
    ? `<img src="${imageData}" alt="Profile picture" />`
    : escapeHtml(makeInitials(currentUser?.name));
}

function renderPhotoPreview(imageData = null) {
  if (!photoPreview) return;
  photoPreview.innerHTML = imageData
    ? `<img src="${imageData}" alt="Profile picture preview" />`
    : `<span>${escapeHtml(makeInitials(currentUser?.name))}</span>`;
}

function resetPhotoEditor() {
  pendingProfileImage = undefined;
  photoSaveInProgress = false;
  if (photoInput) photoInput.value = "";
  if (photoSave) photoSave.disabled = true;
  if (photoRemove) photoRemove.disabled = !currentUser.profileImage;
  renderPhotoPreview(currentUser.profileImage);
  clearMessage("profile-photo-message");
}

function openPhotoEditor() {
  resetPhotoEditor();
  if (photoDialog?.showModal) {
    photoDialog.showModal();
    window.setTimeout(() => photoChoose?.focus(), 0);
    return;
  }
  photoDialog?.setAttribute("open", "");
}

function closePhotoEditor() {
  if (photoSaveInProgress) return;
  if (photoDialog?.open && photoDialog.close) photoDialog.close();
  else photoDialog?.removeAttribute("open");
  resetPhotoEditor();
}

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = profileForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;

  const result = await updateCurrentUserProfile({
    name: document.getElementById("profile-name")?.value ?? "",
    email: document.getElementById("profile-email")?.value ?? ""
  });

  showMessage("profile-message", result.message, result.success);
  if (result.success) {
    currentUser = result.user;
    await renderProfile();
    await renderNavbar("..", currentUser);
  }
  if (button) button.disabled = false;
});

passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentPassword = document.getElementById("current-password")?.value ?? "";
  const newPassword = document.getElementById("new-password")?.value ?? "";
  const confirm = document.getElementById("confirm-new-password")?.value ?? "";

  if (!passwordsMatch(newPassword, confirm)) {
    showMessage("password-message", "New passwords do not match.", false);
    return;
  }

  const button = passwordForm.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
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

document.getElementById("profile-photo-edit")?.addEventListener("click", openPhotoEditor);
photoChoose?.addEventListener("click", () => photoInput?.click());
photoDialogClose?.addEventListener("click", closePhotoEditor);
photoCancel?.addEventListener("click", closePhotoEditor);

document.getElementById("profile-edit-shortcut")?.addEventListener("click", () => {
  document.getElementById("profile-details-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("profile-name")?.focus({ preventScroll: true });
});

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!file) return;

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(file.type)) {
    showMessage("profile-photo-message", "Choose a JPEG, PNG or WebP image.", false);
    return;
  }
  if (file.size > 6_000_000) {
    showMessage("profile-photo-message", "Choose an image smaller than 6 MB.", false);
    return;
  }

  try {
    showNeutralMessage("profile-photo-message", "Preparing preview…");
    pendingProfileImage = await resizeProfileImage(file);
    renderPhotoPreview(pendingProfileImage);
    if (photoSave) photoSave.disabled = false;
    if (photoRemove) photoRemove.disabled = false;
    showMessage("profile-photo-message", "Preview ready. Save when you are happy with it.", true);
  } catch (error) {
    console.error("Could not prepare profile picture:", error);
    pendingProfileImage = undefined;
    if (photoSave) photoSave.disabled = true;
    showMessage("profile-photo-message", "That image could not be prepared.", false);
  }
});

photoRemove?.addEventListener("click", () => {
  pendingProfileImage = null;
  if (photoInput) photoInput.value = "";
  renderPhotoPreview(null);
  if (photoSave) photoSave.disabled = false;
  photoRemove.disabled = true;
  showNeutralMessage("profile-photo-message", "Your current photo will be removed when you save.");
});

photoSave?.addEventListener("click", async () => {
  if (pendingProfileImage === undefined || photoSaveInProgress) return;

  photoSaveInProgress = true;
  photoSave.disabled = true;
  if (photoChoose) photoChoose.disabled = true;
  if (photoRemove) photoRemove.disabled = true;
  if (photoCancel) photoCancel.disabled = true;
  showNeutralMessage("profile-photo-message", "Saving your profile picture…");

  try {
    const result = await updateCurrentUserProfileImage(pendingProfileImage);
    showMessage("profile-photo-message", result.message, result.success);

    if (!result.success) {
      photoSaveInProgress = false;
      photoSave.disabled = false;
      if (photoChoose) photoChoose.disabled = false;
      if (photoRemove) photoRemove.disabled = false;
      if (photoCancel) photoCancel.disabled = false;
      return;
    }

    currentUser = result.user;
    renderAvatar(currentUser.profileImage);
    await renderNavbar("..", currentUser);

    // Saving the photo completes this focused task and returns the traveller
    // to the Home experience, as requested for the profile-photo workflow.
    window.location.replace("../index.html");
  } catch (error) {
    console.error("Could not save profile picture:", error);
    showMessage("profile-photo-message", "Your profile picture could not be saved. Please try again.", false);
    photoSaveInProgress = false;
    photoSave.disabled = false;
    if (photoChoose) photoChoose.disabled = false;
    if (photoRemove) photoRemove.disabled = false;
    if (photoCancel) photoCancel.disabled = false;
  }
});

photoDialog?.addEventListener("cancel", (event) => {
  if (photoSaveInProgress) {
    event.preventDefault();
    return;
  }
  resetPhotoEditor();
});

photoDialog?.addEventListener("click", (event) => {
  if (event.target === photoDialog) closePhotoEditor();
});

photoDialog?.addEventListener("close", () => {
  if (!photoSaveInProgress) resetPhotoEditor();
});

document.getElementById("profile-logout-button")?.addEventListener("click", async () => {
  await logoutUser();
  window.location.replace("./login.html");
});

function resizeProfileImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      try {
        // 768px keeps the avatar crisp on high-DPI screens while remaining
        // compact enough for the existing profile-image API/data-URL storage.
        const maxSide = 768;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas is unavailable");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid image"));
    };
    image.src = objectUrl;
  });
}

function showMessage(id, message, success) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${success ? "form-message-success" : "form-message-error"}`;
}

function showNeutralMessage(id, message) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = message;
  element.className = "form-message";
}

function clearMessage(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = "";
  element.className = "form-message";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? "";
}

function makeInitials(name) {
  return String(name ?? "UG")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "UG";
}

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value))
    : "Unknown";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

await renderProfile();
