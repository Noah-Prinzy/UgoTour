// ============================================================
// AUTHENTICATION + PROFILE API SERVICE - PHASE 7
// ============================================================
// Real account data, password hashes and login sessions now live on the
// Node.js/PostgreSQL backend. The browser stores only the bearer token needed
// to identify the current session on later API requests.

import {
  ApiError,
  apiRequest,
  clearAuthToken,
  hasAuthToken,
  saveAuthToken
} from "../api.js";
import { isNotEmpty, isValidEmail, isValidPassword } from "../utils/validation.js";

export function hasLocalSessionToken() {
  return hasAuthToken();
}

export async function getCurrentUser() {
  if (!hasAuthToken()) {
    return null;
  }

  try {
    const payload = await apiRequest("/profile", {
      authenticated: true
    });

    return payload.data;
  } catch (error) {
    // A 401 means the token has expired/been removed server-side, so remove the
    // stale browser token. Network failures do NOT destroy a valid session.
    if (error instanceof ApiError && error.status === 401) {
      clearAuthToken();
      return null;
    }

    throw error;
  }
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

  try {
    const payload = await apiRequest("/auth/signup", {
      method: "POST",
      body: { name: cleanName, email: cleanEmail, password }
    });

    saveAuthToken(payload.data.token);

    return {
      success: true,
      user: payload.data.user,
      message: "Account created successfully."
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function loginUser(email, password) {
  const cleanEmail = String(email).trim().toLowerCase();

  if (!isValidEmail(cleanEmail) || !password) {
    return { success: false, message: "Enter a valid email and password." };
  }

  try {
    const payload = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: cleanEmail, password }
    });

    saveAuthToken(payload.data.token);

    return {
      success: true,
      user: payload.data.user,
      message: "Login successful."
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function logoutUser() {
  // Always clear the browser token, even if the backend is temporarily
  // unreachable. When reachable, the backend session row is deleted too.
  try {
    if (hasAuthToken()) {
      await apiRequest("/auth/logout", {
        method: "POST",
        authenticated: true
      });
    }
  } catch (error) {
    // Logging out locally should still succeed if the API is temporarily down.
    console.warn("Could not remove backend session during logout:", error);
  } finally {
    clearAuthToken();
  }
}

export async function updateCurrentUserProfile({ name, email }) {
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (!isNotEmpty(cleanName) || !isValidEmail(cleanEmail)) {
    return { success: false, message: "Enter a valid name and email address." };
  }

  try {
    const payload = await apiRequest("/profile", {
      method: "PATCH",
      authenticated: true,
      body: { name: cleanName, email: cleanEmail }
    });

    return {
      success: true,
      user: payload.data,
      message: "Profile updated successfully."
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function changeCurrentUserPassword(currentPassword, newPassword) {
  if (!isValidPassword(newPassword)) {
    return { success: false, message: "New password must contain at least 8 characters." };
  }

  try {
    const payload = await apiRequest("/profile/password", {
      method: "PATCH",
      authenticated: true,
      body: { currentPassword, newPassword }
    });

    return {
      success: true,
      message: payload.message ?? "Password changed successfully."
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
