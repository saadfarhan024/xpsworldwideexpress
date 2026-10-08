import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const ALLOWED_LOGO_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export const MAX_LOGO_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

export function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

export function logoAbsolutePath(storageKey: string) {
  const root = uploadRoot();
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Invalid storage key.");
  }
  return resolved;
}

/**
 * Saves a merchant logo.
 * On serverless platforms (e.g. Vercel) where local disk is read-only, logos are encoded
 * into persistent Data URLs and stored directly in PostgreSQL for 100% durability across lambdas.
 */
export async function saveMerchantLogo(merchantId: string, file: File): Promise<string> {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Upload a PNG, JPG, or WebP image.");
  }
  if (file.size <= 0 || file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo files must be 1.5 MB or smaller.");
  }

  // Check if we are in serverless or local environment
  const isVercelOrServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isVercelOrServerless) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  }

  // Local development filesystem storage with fallback
  try {
    const extension = ALLOWED_LOGO_TYPES.get(file.type)!;
    const storageKey = path.join("logos", merchantId, `${randomBytes(16).toString("hex")}.${extension}`);
    const absolutePath = logoAbsolutePath(storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);
    return storageKey;
  } catch {
    // If local disk fails for any reason (permissions, sandbox), fall back to Data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  }
}

export async function deleteStoredFile(storageKey: string | null | undefined) {
  if (!storageKey || storageKey.startsWith("data:")) return;
  try {
    await unlink(logoAbsolutePath(storageKey));
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : undefined;
    if (code !== "ENOENT") console.error("Could not delete stored file:", storageKey, error);
  }
}

export function maskSecret(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(value.length - 4, 12))}${value.slice(-4)}`;
}
