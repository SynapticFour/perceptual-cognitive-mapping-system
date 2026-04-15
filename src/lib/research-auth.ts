import type { NextRequest } from 'next/server';

export const RESEARCH_AUTH_COOKIE = 'pcms_research_auth';

async function sha256Hex(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function researchKey(): string | undefined {
  const k = process.env.RESEARCH_API_KEY;
  if (!k || k.length < 8) return undefined;
  return k;
}

/** Deterministic token stored in HttpOnly cookie (never the raw API key). Edge-safe (Web Crypto). */
export async function computeResearchAuthToken(): Promise<string> {
  const key = researchKey() ?? '';
  const pepper = process.env.RESEARCH_COOKIE_SECRET ?? 'pcms-research-cookie-pepper-v1';
  return sha256Hex(`pcms-research|v1|${pepper}|${key}`);
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function isResearchApiConfigured(): boolean {
  return !!researchKey();
}

export function verifyResearchApiKey(headerKey: string | null | undefined): boolean {
  const expected = researchKey();
  if (!expected || !headerKey) return false;
  return timingSafeEq(expected, headerKey);
}

export function verifyResearchBearer(authHeader: string | null | undefined): boolean {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return false;
  const token = authHeader.slice(7).trim();
  return verifyResearchApiKey(token);
}

export async function verifyResearchCookie(cookieValue: string | null | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  return timingSafeEq(await computeResearchAuthToken(), cookieValue);
}

export async function isResearchAuthedRequest(request: NextRequest): Promise<boolean> {
  if (!isResearchApiConfigured()) return false;
  const header = request.headers.get('x-research-api-key');
  if (verifyResearchApiKey(header)) return true;
  if (verifyResearchBearer(request.headers.get('authorization'))) return true;
  const cookie = request.cookies.get(RESEARCH_AUTH_COOKIE)?.value;
  return verifyResearchCookie(cookie);
}

export async function isResearchAuthedFromRequest(request: Request): Promise<boolean> {
  if (!isResearchApiConfigured()) return false;
  if (verifyResearchApiKey(request.headers.get('x-research-api-key'))) return true;
  if (verifyResearchBearer(request.headers.get('authorization'))) return true;
  const raw = request.headers.get('cookie') ?? '';
  const m = raw.match(new RegExp(`(?:^|;\\s*)${RESEARCH_AUTH_COOKIE}=([^;]*)`));
  const val = m?.[1] ? decodeURIComponent(m[1]) : undefined;
  return verifyResearchCookie(val);
}
