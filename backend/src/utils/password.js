import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

// Password hashing belongs on the backend.
// We use Node's built-in scrypt so Phase 5 stays framework/package-light.
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

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
