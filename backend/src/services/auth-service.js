import { randomBytes } from "node:crypto";
import { createUserId, sessions, users } from "../data/memory-store.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

function publicUser(user) {
  // Never return passwordHash to the browser/API caller.
  const { passwordHash, ...safeUser } = user;
  return { ...safeUser };
}

export async function createAccount({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const duplicate = users.some((user) => user.email === normalizedEmail);

  if (duplicate) {
    const error = new Error("An account already exists with this email.");
    error.statusCode = 409;
    throw error;
  }

  const user = {
    id: createUserId(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(user);

  const token = createSession(user.id);

  return {
    user: publicUser(user),
    token
  };
}

export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((item) => item.email === normalizedEmail);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    const error = new Error("Email or password is incorrect.");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: publicUser(user),
    token: createSession(user.id)
  };
}

export function logout(token) {
  if (token) {
    sessions.delete(token);
  }
}

export function toPublicUser(user) {
  return publicUser(user);
}

function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, userId);
  return token;
}
