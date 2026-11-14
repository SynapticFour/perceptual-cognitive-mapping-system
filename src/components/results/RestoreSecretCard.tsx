"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { RESTORE_BOUND_STORAGE_KEY, RESTORE_SECRET_STORAGE_KEY } from "@/lib/restore-secret";

function restoreUrl(locale: string, secret: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${window.location.origin}${prefix}/restore#${secret}`;
}

export default function RestoreSecretCard() {
  const t = useTranslations("restore");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const url = useSyncExternalStore(
    () => () => {},
    () => {
      const secret = localStorage.getItem(RESTORE_SECRET_STORAGE_KEY);
      const bound = localStorage.getItem(RESTORE_BOUND_STORAGE_KEY);
      if (!secret || !bound) return null;
      return restoreUrl(locale, secret);
    },
    () => null,
  );

  if (!url) return null;

  const download = () => {
    const text = `${url}\n\n${t("keep_safe")}\n`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = "pcms-restore-link.txt";
    a.click();
    URL.revokeObjectURL(objectUrl);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-4 text-left text-sm text-slate-800">
      <p>{t("keep_safe")}</p>
      <p className="mt-2 break-all font-mono text-xs">{url}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5"
          onClick={() => void copy()}
        >
          {copied ? t("copied") : t("copy")}
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5"
          onClick={download}
        >
          {t("download")}
        </button>
      </div>
    </div>
  );
}
