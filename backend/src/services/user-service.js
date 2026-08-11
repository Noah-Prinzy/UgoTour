import database from "../database/connection.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toPublicUser } from "./auth-service.js";

const publicUserColumns = "id,name,email,profile_image,role,created_at,updated_at";

export async function updateProfile(userId, { name, email }) {
  const numericUserId = Number(userId);
  const normalizedEmail = email === undefined ? null : email.trim().toLowerCase();
  if (normalizedEmail !== null) {
    const duplicate = await database.query("SELECT id FROM users WHERE email=$1 AND id<>$2", [normalizedEmail, numericUserId]);
    if (duplicate.rowCount > 0) {
      const error = new Error("Another account already uses this email.");
      error.statusCode = 409;
      throw error;
    }
  }

  const result = await database.query(`
    UPDATE users
    SET name=COALESCE($2,name),email=COALESCE($3,email),updated_at=NOW()
    WHERE id=$1
    RETURNING ${publicUserColumns}
  `, [numericUserId, name === undefined ? null : name.trim(), normalizedEmail]);
  return toPublicUser(result.rows[0]);
}

export async function updateProfileImage(userId, imageData) {
  const result = await database.query(`
    UPDATE users SET profile_image=$2,updated_at=NOW()
    WHERE id=$1 RETURNING ${publicUserColumns}
  `, [Number(userId), imageData]);
  return toPublicUser(result.rows[0]);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const result = await database.query("SELECT id,password_hash FROM users WHERE id=$1", [Number(userId)]);
  const user = result.rows[0];
  if (!user) return false;
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 401;
    throw error;
  }
  const passwordHash = await hashPassword(newPassword);
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE users SET password_hash=$2,updated_at=NOW() WHERE id=$1", [Number(userId), passwordHash]);
    await client.query("DELETE FROM sessions WHERE user_id=$1", [Number(userId)]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
  return true;
}
