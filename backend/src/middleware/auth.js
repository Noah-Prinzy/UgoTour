import database from "../database/connection.js";
import { getBearerToken } from "../utils/http.js";

// Looks up the authenticated user by joining the persisted sessions and users
// tables. Because this is a PostgreSQL query, callers must `await` this helper.
export async function getAuthenticatedUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const result = await database.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        u.updated_at
      FROM sessions AS s
      INNER JOIN users AS u
        ON u.id = s.user_id
      WHERE s.token = $1
    `,
    [token]
  );

  const user = result.rows[0];

  if (!user) return null;

  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}
