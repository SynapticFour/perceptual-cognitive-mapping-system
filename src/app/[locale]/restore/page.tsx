"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { RESTORE_SECRET_STORAGE_KEY } from "@/lib/restore-secret";

function secretFromInput(raw: string): string {
  const trimmed = raw.trim();
  const hashAt = trimmed.indexOf("#");
  const secret = hashAt >= 0 ? trimmed.slice(hashAt + 1) : trimmed;
  try {
    return decodeURIComponent(secret).trim();
  } catch {
    return secret.trim();
  }
}

type RestorePayload = {
  session?: { id?: string; consent_timestamp?: string };
  questionResponses?: Array<{
    question_id?: string;
    response?: number;
    response_time_ms?: number;
    created_at?: string;
  }>;
  pipelineFinalProfile?: unknown;
};

export default function RestorePage() {
  const t = useTranslations("restore");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openSecret = useCallback(
    async (secret: string) => {
      if (secret.length < 22) {
        setError(t("invalid"));
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/session/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret }),
        });
        if (!res.ok) {
          setError(t("rejected"));
          setBusy(false);
          return;
        }
        const data = (await res.json()) as RestorePayload;
        const profile = data.pipelineFinalProfile;
        if (!profile || typeof profile !== "object") {
          setError(t("no_profile"));
          setBusy(false);
          return;
        }
        localStorage.setItem("pcms-pipeline-result", JSON.stringify(profile));
        const history = (data.questionResponses ?? []).map((row) => ({
          questionId: row.question_id,
          response: row.response,
          responseTimeMs: row.response_time_ms ?? 0,
          timestamp: row.created_at ?? new Date().toISOString(),
        }));
        localStorage.setItem("pcms-question-history", JSON.stringify(history));
        if (data.session?.id) localStorage.setItem("pcms-session-id", data.session.id);
        if (data.session?.consent_timestamp) {
          localStorage.setItem("pcms-consent-timestamp", data.session.consent_timestamp);
        }
        localStorage.setItem(RESTORE_SECRET_STORAGE_KEY, secret);
        router.replace("/results");
      } catch {
        setError(t("rejected"));
        setBusy(false);
      }
    },
    [router, t],
  );

  useEffect(() => {
    const fromFragment = secretFromInput(window.location.hash);
    if (fromFragment.length < 22) return;
    const handle = window.setTimeout(() => {
      void openSecret(fromFragment);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [openSecret]);

  return (
    <main className="mx-auto min-h-[60vh] max-w-xl px-4 py-10">
      <h1 className="mb-3 text-2xl font-bold text-slate-900">{t("page_title")}</h1>
      <p className="mb-6 text-sm text-slate-700">{t("page_body")}</p>
      <label className="block text-sm font-medium text-slate-800" htmlFor="restore-code">
        {t("code_label")}
      </label>
      <textarea
        id="restore-code"
        className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        onClick={() => void openSecret(secretFromInput(code))}
      >
        {t("open")}
      </button>
    </main>
  );
}
