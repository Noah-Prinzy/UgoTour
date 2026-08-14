// ============================================================
// USER / PROFILE SERVICE
// Performs PostgreSQL operations for editable profile fields, profile photos,
// traveller feedback and authenticated password changes.
// ============================================================

import database from "../database/connection.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { toPublicUser } from "./auth-service.js";

// Reused RETURNING list keeps private fields such as password_hash out of responses.
const publicUserColumns = "id,name,email,bio,profile_image,role,created_at,updated_at";

// Update only profile fields supplied by the caller. COALESCE keeps omitted fields
// unchanged, while duplicate-email detection gives a friendly 409 error.
export async function updateProfile(userId, { name, email, bio }) {
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
    SET name=COALESCE($2,name),
        email=COALESCE($3,email),
        bio=COALESCE($4,bio),
        updated_at=NOW()
    WHERE id=$1
    RETURNING ${publicUserColumns}
  `, [
    numericUserId,
    name === undefined ? null : name.trim(),
    normalizedEmail,
    bio === undefined ? null : String(bio).trim()
  ]);
  return toPublicUser(result.rows[0]);
}

// Store or clear the processed data-URL profile image supplied by the frontend.
export async function updateProfileImage(userId, imageData) {
  const result = await database.query(`
    UPDATE users SET profile_image=$2,updated_at=NOW()
    WHERE id=$1 RETURNING ${publicUserColumns}
  `, [Number(userId), imageData]);
  return toPublicUser(result.rows[0]);
}

// Read the user's one optional UgoTour experience rating/review.
export async function getProfileFeedback(userId) {
  const result = await database.query(`
    SELECT rating,review,created_at,updated_at
    FROM user_feedback WHERE user_id=$1
  `, [Number(userId)]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    rating: Number(row.rating),
    review: row.review,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// INSERT the first feedback row or UPDATE the existing row for this user.
export async function upsertProfileFeedback(userId, { rating, review }) {
  const result = await database.query(`
    INSERT INTO user_feedback (user_id,rating,review)
    VALUES ($1,$2,$3)
    ON CONFLICT (user_id) DO UPDATE
    SET rating=EXCLUDED.rating, review=EXCLUDED.review, updated_at=NOW()
    RETURNING rating,review,created_at,updated_at
  `, [Number(userId), Number(rating), String(review).trim()]);
  const row = result.rows[0];
  return {
    rating: Number(row.rating),
    review: row.review,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Verify the current password before replacing its hash. The password update and
// session invalidation share one transaction so security state cannot be half-updated.
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
