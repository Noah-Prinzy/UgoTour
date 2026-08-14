// ============================================================
// AUTHENTICATION / AUTHORIZATION MIDDLEWARE
// Resolves an HttpOnly session cookie to a database user and provides a stricter
// admin guard for privileged endpoints.
// ============================================================

import database from "../database/connection.js";
import { getSessionToken } from "../utils/cookies.js";

// Read the browser's session token, verify that it exists and has not expired,
// then return a safe user object. Returning null means "not authenticated".
export async function getAuthenticatedUser(request) {
  const token = getSessionToken(request);
  if (!token) return null;

  const result = await database.query(`
    SELECT u.id,u.name,u.email,u.bio,u.profile_image,u.role,u.created_at,u.updated_at
    FROM sessions AS s
    INNER JOIN users AS u ON u.id=s.user_id
    WHERE s.token=$1 AND s.expires_at > NOW()
  `, [token]);

  const user = result.rows[0];
  if (!user) return null;

  // Convert database column names/types into the frontend-friendly user shape.
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    bio: user.bio ?? "",
    profileImage: user.profile_image,
    role: user.role || "user",
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

// Admin endpoints call this guard. It distinguishes "not logged in" (401) from
// "logged in but not an administrator" (403).
export async function requireAdmin(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    const error = new Error("Authentication required.");
    error.statusCode = 401;
    throw error;
  }
  if (user.role !== "admin") {
    const error = new Error("Administrator access required.");
    error.statusCode = 403;
    throw error;
  }
  return user;
}
