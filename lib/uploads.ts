import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const ALLOWED_LOGO_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

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

export async function saveMerchantLogo(merchantId: string, file: File) {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error("Upload a PNG, JPG, or WebP image.");
  }
  if (file.size <= 0 || file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo files must be 2 MB or smaller.");
  }

  const extension = ALLOWED_LOGO_TYPES.get(file.type)!;
  const storageKey = path.join("logos", merchantId, `${randomBytes(16).toString("hex")}.${extension}`);
  const absolutePath = logoAbsolutePath(storageKey);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
  return storageKey;
}

export async function deleteStoredFile(storageKey: string | null | undefined) {
  if (!storageKey) return;
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
