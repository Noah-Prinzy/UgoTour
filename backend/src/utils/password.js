// ============================================================
// PASSWORD HASHING UTILITIES
// Password hashing and verification happen only on the backend. UgoTour uses
// Node's built-in scrypt plus a unique random salt for each stored password.
// ============================================================

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Convert callback-style crypto.scrypt into an awaitable Promise function.
const scrypt = promisify(scryptCallback);

// Create a new random salt, derive a 64-byte key and store both pieces as
// `salt:derivedKey`. The original plain-text password is never stored.
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

// Re-derive the key using the saved salt and compare it using timingSafeEqual to
// reduce information leakage through ordinary string-comparison timing.
export async function verifyPassword(password, storedPasswordHash) {
  const [salt, storedKeyHex] = storedPasswordHash.split(":");

  if (!salt || !storedKeyHex) {
    return false;
  }

  const storedKey = Buffer.from(storedKeyHex, "hex");
  const derivedKey = Buffer.from(await scrypt(password, salt, 64));

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}
