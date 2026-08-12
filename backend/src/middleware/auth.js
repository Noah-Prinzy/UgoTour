import database from "../database/connection.js";
import { getSessionToken } from "../utils/cookies.js";

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
