import database from "../database/connection.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toPublicUser } from "./auth-service.js";

export async function updateProfile(userId, { name, email }) {
  const numericUserId = Number(userId);
  const normalizedEmail = email === undefined ? null : email.trim().toLowerCase();
  if (normalizedEmail !== null) {
    const duplicate = await database.query("SELECT id FROM users WHERE email=$1 AND id<>$2", [normalizedEmail, numericUserId]);
    if (duplicate.rowCount > 0) { const error = new Error("Another account already uses this email."); error.statusCode=409; throw error; }
  }
  const result = await database.query(`UPDATE users SET name=COALESCE($2,name),email=COALESCE($3,email),updated_at=NOW() WHERE id=$1 RETURNING id,name,email,profile_image,created_at,updated_at`, [numericUserId, name === undefined ? null : name.trim(), normalizedEmail]);
  return toPublicUser(result.rows[0]);
}

export async function updateProfileImage(userId, imageData) {
  const result = await database.query(`UPDATE users SET profile_image=$2,updated_at=NOW() WHERE id=$1 RETURNING id,name,email,profile_image,created_at,updated_at`, [Number(userId), imageData]);
  return toPublicUser(result.rows[0]);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const result = await database.query("SELECT id,password_hash FROM users WHERE id=$1", [Number(userId)]);
  const user = result.rows[0]; if (!user) return false;
  if (!(await verifyPassword(currentPassword, user.password_hash))) { const error = new Error("Current password is incorrect."); error.statusCode=401; throw error; }
  const passwordHash = await hashPassword(newPassword);
  await database.query("UPDATE users SET password_hash=$2,updated_at=NOW() WHERE id=$1", [Number(userId), passwordHash]);
  return true;
}
