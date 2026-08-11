import { randomBytes } from "node:crypto";
import database from "../database/connection.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

function sessionTtlDays() {
  const value = Number(process.env.SESSION_TTL_DAYS || 7);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 30) : 7;
}

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    profileImage: user.profile_image ?? user.profileImage ?? null,
    role: user.role ?? "user",
    createdAt: user.created_at ?? user.createdAt,
    updatedAt: user.updated_at ?? user.updatedAt
  };
}

export async function createAccount({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const duplicate = await database.query("SELECT id FROM users WHERE email=$1", [normalizedEmail]);
  if (duplicate.rowCount > 0) {
    const error = new Error("An account already exists with this email.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);
  const result = await database.query(`
    INSERT INTO users (name,email,password_hash)
    VALUES ($1,$2,$3)
    RETURNING id,name,email,profile_image,role,created_at,updated_at
  `, [name.trim(), normalizedEmail, passwordHash]);

  const user = result.rows[0];
  const session = await createSession(user.id);
  return { user: toPublicUser(user), ...session };
}

export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await database.query(`
    SELECT id,name,email,password_hash,profile_image,role,created_at,updated_at
    FROM users WHERE email=$1
  `, [normalizedEmail]);
  const user = result.rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    const error = new Error("Email or password is incorrect.");
    error.statusCode = 401;
    throw error;
  }

  const session = await createSession(user.id);
  return { user: toPublicUser(user), ...session };
}

export async function logout(token) {
  if (token) await database.query("DELETE FROM sessions WHERE token=$1", [token]);
}

export async function logoutAllUserSessions(userId) {
  await database.query("DELETE FROM sessions WHERE user_id=$1", [Number(userId)]);
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionTtlDays() * 24 * 60 * 60 * 1000);
  await database.query(
    "INSERT INTO sessions (token,user_id,expires_at) VALUES ($1,$2,$3)",
    [token, Number(userId), expiresAt]
  );
  return { token, expiresAt };
}
