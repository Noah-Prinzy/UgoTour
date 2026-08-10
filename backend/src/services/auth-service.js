import { randomBytes } from "node:crypto";
import database from "../database/connection.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

// Public user objects never expose password_hash to API callers.
export function toPublicUser(user) {
  if (!user) return null;

  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    createdAt: user.created_at ?? user.createdAt,
    updatedAt: user.updated_at ?? user.updatedAt
  };
}

export async function createAccount({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check first so the client receives a friendly conflict message instead
  // of a raw PostgreSQL unique-constraint error.
  const duplicateResult = await database.query(
    "SELECT id FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (duplicateResult.rowCount > 0) {
    const error = new Error("An account already exists with this email.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const userResult = await database.query(
    `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at, updated_at
    `,
    [name.trim(), normalizedEmail, passwordHash]
  );

  const user = userResult.rows[0];
  const token = await createSession(user.id);

  return {
    user: toPublicUser(user),
    token
  };
}

export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await database.query(
    `
      SELECT id, name, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1
    `,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    const error = new Error("Email or password is incorrect.");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: toPublicUser(user),
    token: await createSession(user.id)
  };
}

export async function logout(token) {
  if (!token) return;

  await database.query("DELETE FROM sessions WHERE token = $1", [token]);
}

async function createSession(userId) {
  const token = randomBytes(32).toString("hex");

  await database.query(
    "INSERT INTO sessions (token, user_id) VALUES ($1, $2)",
    [token, Number(userId)]
  );

  return token;
}
