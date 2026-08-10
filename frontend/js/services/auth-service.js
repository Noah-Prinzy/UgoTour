import { ApiError, apiRequest, clearAuthToken, hasAuthToken, saveAuthToken } from "../api.js";
import { isNotEmpty, isValidEmail, isValidPassword } from "../utils/validation.js";

export function hasLocalSessionToken() { return hasAuthToken(); }

export async function getCurrentUser() {
  if (!hasAuthToken()) return null;
  try {
    const payload = await apiRequest("/profile", { authenticated: true });
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) { clearAuthToken(); return null; }
    throw error;
  }
}

export async function createAccount({ name, email, password }) {
  const cleanName = String(name).trim(); const cleanEmail = String(email).trim().toLowerCase();
  if (!isNotEmpty(cleanName)) return { success: false, message: "Please enter your name." };
  if (!isValidEmail(cleanEmail)) return { success: false, message: "Please enter a valid email address." };
  if (!isValidPassword(password)) return { success: false, message: "Password must contain at least 8 characters." };
  try {
    const payload = await apiRequest("/auth/signup", { method: "POST", body: { name: cleanName, email: cleanEmail, password } });
    saveAuthToken(payload.data.token);
    return { success: true, message: "Account created successfully.", user: payload.data.user };
  } catch (error) { return { success: false, message: error.message }; }
}

export async function loginUser({ email, password }) {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!isValidEmail(cleanEmail) || !isNotEmpty(password)) return { success: false, message: "Enter your email and password." };
  try {
    const payload = await apiRequest("/auth/login", { method: "POST", body: { email: cleanEmail, password } });
    saveAuthToken(payload.data.token);
    return { success: true, message: "Login successful.", user: payload.data.user };
  } catch (error) { return { success: false, message: error.message }; }
}

export async function logoutUser() {
  if (hasAuthToken()) {
    try { await apiRequest("/auth/logout", { method: "POST", authenticated: true }); } catch (error) { console.error("Backend logout failed:", error); }
  }
  clearAuthToken();
}

export async function updateCurrentUserProfile({ name, email }) {
  const cleanName = String(name).trim(); const cleanEmail = String(email).trim().toLowerCase();
  if (!isNotEmpty(cleanName)) return { success: false, message: "Name cannot be empty." };
  if (!isValidEmail(cleanEmail)) return { success: false, message: "Enter a valid email address." };
  try {
    const payload = await apiRequest("/profile", { method: "PATCH", authenticated: true, body: { name: cleanName, email: cleanEmail } });
    return { success: true, message: "Profile updated.", user: payload.data };
  } catch (error) { return { success: false, message: error.message }; }
}

export async function updateCurrentUserProfileImage(imageData) {
  try {
    const payload = await apiRequest("/profile/photo", { method: "PATCH", authenticated: true, body: { imageData } });
    return { success: true, message: imageData ? "Profile picture updated." : "Profile picture removed.", user: payload.data };
  } catch (error) { return { success: false, message: error.message }; }
}

export async function changeCurrentUserPassword(currentPassword, newPassword) {
  if (!isNotEmpty(currentPassword)) return { success: false, message: "Enter your current password." };
  if (!isValidPassword(newPassword)) return { success: false, message: "New password must contain at least 8 characters." };
  try {
    const payload = await apiRequest("/profile/password", { method: "PATCH", authenticated: true, body: { currentPassword, newPassword } });
    return { success: true, message: payload.message };
  } catch (error) { return { success: false, message: error.message }; }
}
