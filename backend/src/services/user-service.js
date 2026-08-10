import { users } from "../data/memory-store.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toPublicUser } from "./auth-service.js";

export function updateProfile(userId, { name, email }) {
  const user = users.find((item) => item.id === Number(userId));

  if (!user) return null;

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = users.some(
      (item) => item.id !== user.id && item.email === normalizedEmail
    );

    if (duplicate) {
      const error = new Error("Another account already uses this email.");
      error.statusCode = 409;
      throw error;
    }

    user.email = normalizedEmail;
  }

  if (name !== undefined) {
    user.name = name.trim();
  }

  return toPublicUser(user);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = users.find((item) => item.id === Number(userId));

  if (!user) return false;

  const matches = await verifyPassword(currentPassword, user.passwordHash);

  if (!matches) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 401;
    throw error;
  }

  user.passwordHash = await hashPassword(newPassword);
  return true;
}
