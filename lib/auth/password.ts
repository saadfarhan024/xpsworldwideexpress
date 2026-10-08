import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Use at least 8 characters with at least one letter and one number.";

export function validatePassword(password: string) {
  if (password.length < 8) return PASSWORD_REQUIREMENTS_MESSAGE;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return PASSWORD_REQUIREMENTS_MESSAGE;
  return null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const storedKey = Buffer.from(hash, "hex");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}
