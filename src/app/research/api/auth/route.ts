import { NextResponse } from 'next/server';

import {
  computeResearchAuthToken,
  RESEARCH_AUTH_COOKIE,
  verifyResearchApiKey,
} from '@/lib/research-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!process.env.RESEARCH_API_KEY || process.env.RESEARCH_API_KEY.length < 8) {
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  let body: { apiKey?: string };
  try {
    body = (await request.json()) as { apiKey?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!verifyResearchApiKey(body.apiKey ?? null)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const token = await computeResearchAuthToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(RESEARCH_AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/research',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(RESEARCH_AUTH_COOKIE, '', {
    httpOnly: true,
    path: '/research',
    maxAge: 0,
  });
  return res;
}
