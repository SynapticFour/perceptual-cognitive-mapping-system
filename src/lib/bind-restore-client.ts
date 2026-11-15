import {
  getOrCreateRestoreSecret,
  hashRestoreSecret,
  RESTORE_BOUND_STORAGE_KEY,
} from "@/lib/restore-secret";

/**
 * Sends the hash of this browser's restore secret. The secret itself stays here.
 */
export async function bindRestoreSecretForSession(sessionId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!sessionId) return false;
  const secret = getOrCreateRestoreSecret();
  const restoreSecretHash = await hashRestoreSecret(secret);
  try {
    const res = await fetch("/api/session/bind-restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, restoreSecretHash }),
    });
    if (!res.ok) return false;
    localStorage.setItem(RESTORE_BOUND_STORAGE_KEY, sessionId);
    return true;
  } catch {
    return false;
  }
}
