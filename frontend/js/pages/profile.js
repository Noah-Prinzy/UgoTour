// ============================================================
// PROFILE PAGE - PHASE 7
// ============================================================
// Profile reads and writes now go through authenticated API endpoints. The
// profile is persisted in PostgreSQL rather than a browser-local user array.

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  logoutUser,
  updateCurrentUserProfile
} from "../services/auth-service.js";
import { passwordsMatch } from "../utils/validation.js";

await renderNavbar("..");
renderFooter();

const loggedOutState = document.getElementById("profile-logged-out");
const loggedInState = document.getElementById("profile-logged-in");
const profileForm = document.getElementById("profile-form");
const passwordForm = document.getElementById("password-form");

let currentUser = null;

async function renderProfile() {
  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    console.error("Could not load profile:", error);
    currentUser = null;
  }

  if (!currentUser) {
    loggedOutState?.removeAttribute("hidden");
    loggedInState?.setAttribute("hidden", "");
    return;
  }

  loggedOutState?.setAttribute("hidden", "");
  loggedInState?.removeAttribute("hidden");

  setText("profile-display-name", currentUser.name);
  setText("profile-display-email", currentUser.email);
  setText("profile-member-since", formatDate(currentUser.createdAt));

  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");

  if (nameInput) nameInput.value = currentUser.name;
  if (emailInput) emailInput.value = currentUser.email;

  setText("profile-avatar", makeInitials(currentUser.name));
}

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("profile-name")?.value ?? "";
  const email = document.getElementById("profile-email")?.value ?? "";
  const submitButton = profileForm.querySelector('button[type="submit"]');

  if (submitButton) submitButton.disabled = true;

  const result = await updateCurrentUserProfile({ name, email });
  showMessage("profile-message", result.message, result.success);

  if (result.success) {
    currentUser = result.user;
    await renderProfile();
    await renderNavbar("..");
  }

  if (submitButton) submitButton.disabled = false;
});

passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const currentPassword = document.getElementById("current-password")?.value ?? "";
  const newPassword = document.getElementById("new-password")?.value ?? "";
  const confirmPassword = document.getElementById("confirm-new-password")?.value ?? "";

  if (!passwordsMatch(newPassword, confirmPassword)) {
    showMessage("password-message", "New passwords do not match.", false);
    return;
  }

  const submitButton = passwordForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  const result = await changeCurrentUserPassword(currentPassword, newPassword);
  showMessage("password-message", result.message, result.success);

  if (result.success) {
    passwordForm.reset();
  }

  if (submitButton) submitButton.disabled = false;
});

document.getElementById("profile-logout-button")?.addEventListener("click", async () => {
  await logoutUser();
  window.location.href = "../index.html";
});

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function showMessage(id, message, success) {
  const element = document.getElementById(id);
  if (!element) return;

  element.textContent = message;
  element.className = `form-message ${success ? "form-message-success" : "form-message-error"}`;
}

function makeInitials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "UG";
}

function formatDate(isoDate) {
  if (!isoDate) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(isoDate));
}

await renderProfile();
