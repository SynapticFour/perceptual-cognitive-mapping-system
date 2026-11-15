/**
 * Restore secret for one person's saved answers.
 * The secret is shown to that person. Only its SHA-256 hash is stored.
 * Do not log the secret or put it in an analytics payload.
 */

export const RESTORE_SECRET_BYTES = 32;

/** Dummy digest used so a missing row still runs a fixed-length compare. */
export const DUMMY_RESTORE_HASH = "0".repeat(64);

export function generateRestoreSecret(): string {
  const bytes = new Uint8Array(RESTORE_SECRET_BYTES);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function hashRestoreSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return hexEncode(new Uint8Array(digest));
}

export function isRestoreSecretHash(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

/** Constant-time compare for equal-length hex digests. Unequal lengths return false. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const RESTORE_SECRET_STORAGE_KEY = "pcms-restore-secret-v1";
export const RESTORE_BOUND_STORAGE_KEY = "pcms-restore-bound-v1";

export function getOrCreateRestoreSecret(): string {
  const existing = localStorage.getItem(RESTORE_SECRET_STORAGE_KEY);
  if (existing && existing.length >= 22) return existing;
  const secret = generateRestoreSecret();
  localStorage.setItem(RESTORE_SECRET_STORAGE_KEY, secret);
  return secret;
}
