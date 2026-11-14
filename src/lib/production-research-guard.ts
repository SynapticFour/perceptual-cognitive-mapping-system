import { NextResponse } from "next/server";

/**
 * Production is the Vercel production deployment.
 * Preview builds and local `next start` leave the flag off so tests can still render.
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NEXT_PUBLIC_PCMS_PRODUCTION === "1";
}

/** 404 for routes that read or aggregate other people's answers. */
export function productionResearchDisabledResponse(): NextResponse | null {
  if (!isProductionDeployment()) return null;
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

const DISABLED_PAGE_PATHS = ["/cohort-insights", "/field-import", "/group-cognitive-analysis"];

export function isDisabledResearchPage(pathname: string): boolean {
  if (!isProductionDeployment()) return false;
  if (pathname === "/research" || pathname.startsWith("/research/")) return true;
  const bare = stripLocalePrefix(pathname);
  return DISABLED_PAGE_PATHS.some((p) => bare === p || bare.startsWith(`${p}/`));
}

function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(de|fr|sw|tw|wo)(?=\/|$)/);
  if (!match) return pathname;
  const rest = pathname.slice(match[0].length);
  return rest.length === 0 ? "/" : rest;
}
