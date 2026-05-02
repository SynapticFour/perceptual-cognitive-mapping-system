import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

/** Project root (this file lives at repo root). Fixes output tracing when multiple lockfiles exist above this app. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  compress: true,
  outputFileTracingRoot: projectRoot,
  experimental: {
    optimizePackageImports: ["recharts"],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
