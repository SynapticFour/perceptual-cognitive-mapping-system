import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

/** Project root (this file lives at repo root). Fixes output tracing when multiple lockfiles exist above this app. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Next embeds `NEXT_PUBLIC_*` at build time. Vercel's Supabase integration often
 * injects `SUPABASE_URL` + `SUPABASE_ANON_KEY` without the `NEXT_PUBLIC_` prefix,
 * which leaves client bundles thinking cloud is disabled. Mirror into public keys when needed.
 */
function firstNonEmpty(...candidates: Array<string | undefined>): string | undefined {
  for (const c of candidates) {
    if (c === undefined) continue;
    const t = c.trim();
    if (t !== "") return t;
  }
  return undefined;
}

const resolvedSupabasePublicUrl = firstNonEmpty(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_URL
);
const resolvedSupabaseAnonKey = firstNonEmpty(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Explicitly expose to client bundles via `next.config` `env`.
 * Ensures Supabase keys are inlined even when only the Vercel integration
 * exports `SUPABASE_URL` / `SUPABASE_ANON_KEY`, or when build-time embedding
 * of `NEXT_PUBLIC_*` is inconsistent.
 */
const supabasePublicEnv =
  resolvedSupabasePublicUrl && resolvedSupabaseAnonKey
    ? ({
        NEXT_PUBLIC_SUPABASE_URL: resolvedSupabasePublicUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: resolvedSupabaseAnonKey,
      } as const)
    : undefined;

const nextConfig: NextConfig = {
  compress: true,
  outputFileTracingRoot: projectRoot,
  experimental: {
    optimizePackageImports: ["recharts"],
  },
  ...(supabasePublicEnv ? { env: { ...supabasePublicEnv } } : {}),
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
