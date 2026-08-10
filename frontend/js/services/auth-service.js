// ============================================================
// PHASE 4 AUTHENTICATION SERVICE
// ============================================================
// This file contains UgoTour's frontend-only account logic.
//
// CURRENT PHASE:
//   JavaScript -> localStorage
//
// LATER:
//   JavaScript -> Node.js REST API -> PostgreSQL
//
// This is NOT production authentication. localStorage is controlled by the
// browser user. We use it only to learn signup/login/session/profile flows.

import { readLocal, removeLocal, saveLocal } from "../utils/storage.js";
import { isNotEmpty, isValidEmail, isValidPassword } from "../utils/validation.js";

const USERS_KEY = "ugotour_users";
const CURRENT_USER_KEY = "ugotour_current_user_id";

// Always return an array, even when no users exist yet.
export function getUsers() {
  return readLocal(USERS_KEY, []);
}

// We store only the logged-in user's ID as the local "session".
// The full user object remains in the users array.
export function getCurrentUser() {
  const currentUserId = readLocal(CURRENT_USER_KEY, null);

  if (!currentUserId) {
    return null;
  }

  return getUsers().find((user) => user.id === currentUserId) ?? null;
}

// Web Crypto produces a SHA-256 digest so our learning prototype does not
// store the raw password text. This still does NOT make localStorage suitable
// for real authentication; password hashing belongs on the backend later.
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createUserId() {
  // randomUUID() is supported by modern browsers on localhost/HTTPS.
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older environments used only by this learning prototype.
  return `user-${Date.now()}`;
}

export async function createAccount({ name, email, password }) {
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (!isNotEmpty(cleanName)) {
    return { success: false, message: "Please enter your name." };
  }

  if (!isValidEmail(cleanEmail)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  if (!isValidPassword(password)) {
    return { success: false, message: "Password must contain at least 8 characters." };
  }

  const users = getUsers();
  const emailAlreadyExists = users.some((user) => user.email === cleanEmail);

  if (emailAlreadyExists) {
    return { success: false, message: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const newUser = {
    id: createUserId(),
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveLocal(USERS_KEY, users);

  // Automatically start a local session after successful signup.
  saveLocal(CURRENT_USER_KEY, newUser.id);

  return { success: true, user: newUser, message: "Account created successfully." };
}

export async function loginUser(email, password) {
  const cleanEmail = String(email).trim().toLowerCase();

  if (!isValidEmail(cleanEmail) || !password) {
    return { success: false, message: "Enter a valid email and password." };
  }

  const user = getUsers().find((candidate) => candidate.email === cleanEmail);

  // Use one general message so we do not reveal whether an email exists.
  if (!user) {
    return { success: false, message: "Email or password is incorrect." };
  }

  const passwordHash = await hashPassword(password);

  if (passwordHash !== user.passwordHash) {
    return { success: false, message: "Email or password is incorrect." };
  }

  saveLocal(CURRENT_USER_KEY, user.id);
  return { success: true, user, message: "Login successful." };
}

export function logoutUser() {
  removeLocal(CURRENT_USER_KEY);
}

export function updateCurrentUserProfile({ name, email }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return { success: false, message: "You must be logged in to edit your profile." };
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (!isNotEmpty(cleanName) || !isValidEmail(cleanEmail)) {
    return { success: false, message: "Enter a valid name and email address." };
  }

  const users = getUsers();
  const emailTaken = users.some(
    (user) => user.id !== currentUser.id && user.email === cleanEmail
  );

  if (emailTaken) {
    return { success: false, message: "That email is already used by another account." };
  }

  const updatedUsers = users.map((user) => {
    if (user.id !== currentUser.id) {
      return user;
    }

    return {
      ...user,
      name: cleanName,
      email: cleanEmail,
      updatedAt: new Date().toISOString()
    };
  });

  saveLocal(USERS_KEY, updatedUsers);

  return {
    success: true,
    user: updatedUsers.find((user) => user.id === currentUser.id),
    message: "Profile updated successfully."
  };
}

export async function changeCurrentUserPassword(currentPassword, newPassword) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return { success: false, message: "You must be logged in to change your password." };
  }

  if (!isValidPassword(newPassword)) {
    return { success: false, message: "New password must contain at least 8 characters." };
  }

  const currentPasswordHash = await hashPassword(currentPassword);

  if (currentPasswordHash !== currentUser.passwordHash) {
    return { success: false, message: "Your current password is incorrect." };
  }

  const newPasswordHash = await hashPassword(newPassword);
  const users = getUsers();

  const updatedUsers = users.map((user) =>
    user.id === currentUser.id
      ? { ...user, passwordHash: newPasswordHash, updatedAt: new Date().toISOString() }
      : user
  );

  saveLocal(USERS_KEY, updatedUsers);

  return { success: true, message: "Password changed successfully." };
}
