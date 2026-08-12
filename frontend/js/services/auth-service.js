import { ApiError, apiRequest } from "../api.js";
import { isNotEmpty, isValidEmail, isValidPassword } from "../utils/validation.js";

export async function getCurrentUser() {
  try {
    const payload = await apiRequest("/profile", { authenticated: true });
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export async function createAccount({ name, email, password }) {
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  if (!isNotEmpty(cleanName)) return { success:false, message:"Please enter your name." };
  if (!isValidEmail(cleanEmail)) return { success:false, message:"Please enter a valid email address." };
  if (!isValidPassword(password, 10)) return { success:false, message:"Password must contain at least 10 characters." };
  try {
    const payload = await apiRequest("/auth/signup", { method:"POST", body:{ name:cleanName, email:cleanEmail, password } });
    return { success:true, message:"Account created successfully.", user:payload.data.user };
  } catch (error) { return { success:false, message:error.message }; }
}

export async function loginUser({ email, password }) {
  const cleanEmail = String(email).trim().toLowerCase();
  if (!isValidEmail(cleanEmail) || !isNotEmpty(password)) return { success:false, message:"Enter your email and password." };
  try {
    const payload = await apiRequest("/auth/login", { method:"POST", body:{ email:cleanEmail, password } });
    return { success:true, message:"Login successful.", user:payload.data.user };
  } catch (error) { return { success:false, message:error.message }; }
}

export async function logoutUser() {
  try { await apiRequest("/auth/logout", { method:"POST", authenticated:true }); }
  catch (error) { console.error("Backend logout failed:", error); }
}

export async function requestPasswordReset(email) {
  try {
    const payload = await apiRequest("/auth/password-reset/request", { method:"POST", body:{ email:String(email).trim().toLowerCase() } });
    return { success:true, message:payload.message, developmentResetUrl:payload.developmentResetUrl ?? null };
  } catch (error) { return { success:false, message:error.message }; }
}

export async function resetPassword(token, newPassword) {
  try {
    const payload = await apiRequest("/auth/password-reset/confirm", { method:"POST", body:{ token, newPassword } });
    return { success:true, message:payload.message };
  } catch (error) { return { success:false, message:error.message }; }
}

export async function updateCurrentUserProfile({ name, email, bio = "" }) {
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanBio = String(bio ?? "").trim();
  if (!isNotEmpty(cleanName)) return { success:false, message:"Name cannot be empty." };
  if (!isValidEmail(cleanEmail)) return { success:false, message:"Enter a valid email address." };
  if (cleanBio.length > 500) return { success:false, message:"Bio must contain at most 500 characters." };
  try {
    const payload = await apiRequest("/profile", { method:"PATCH", authenticated:true, body:{ name:cleanName, email:cleanEmail, bio:cleanBio } });
    return { success:true, message:"Profile updated.", user:payload.data };
  } catch (error) { return { success:false, message:error.message }; }
}

export async function updateCurrentUserProfileImage(imageData) {
  try {
    const payload = await apiRequest("/profile/photo", { method:"PATCH", authenticated:true, body:{ imageData } });
    return { success:true, message:imageData ? "Profile picture updated." : "Profile picture removed.", user:payload.data };
  } catch (error) { return { success:false, message:error.message }; }
}

export async function getCurrentUserFeedback() {
  const payload = await apiRequest("/profile/feedback", { authenticated:true });
  return payload.data;
}

export async function updateCurrentUserFeedback({ rating, review }) {
  try {
    const payload = await apiRequest("/profile/feedback", { method:"PATCH", authenticated:true, body:{ rating:Number(rating), review:String(review).trim() } });
    return { success:true, message:"Thanks for sharing your UgoTour experience.", feedback:payload.data };
  } catch (error) { return { success:false, message:error.message }; }
}

export async function changeCurrentUserPassword(currentPassword, newPassword) {
  if (!isNotEmpty(currentPassword)) return { success:false, message:"Enter your current password." };
  if (!isValidPassword(newPassword, 10)) return { success:false, message:"New password must contain at least 10 characters." };
  try {
    const payload = await apiRequest("/profile/password", { method:"PATCH", authenticated:true, body:{ currentPassword, newPassword } });
    return { success:true, message:payload.message, reauthRequired:Boolean(payload.reauthRequired) };
  } catch (error) { return { success:false, message:error.message }; }
}
