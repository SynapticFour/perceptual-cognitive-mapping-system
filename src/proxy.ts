import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';
import { isResearchApiConfigured, isResearchAuthedRequest } from './lib/research-auth';

const intlMiddleware = createMiddleware(routing);

const RESEARCH_PUBLIC_PATHS = new Set(['/research/login']);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/research' || pathname.startsWith('/research/')) {
    if (RESEARCH_PUBLIC_PATHS.has(pathname) || pathname.startsWith('/research/api/auth')) {
      return NextResponse.next();
    }
    if (!isResearchApiConfigured()) {
      return new NextResponse(
        'Research area is not configured. Set RESEARCH_API_KEY in .env.local (≥8 characters).',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }
    if (!(await isResearchAuthedRequest(request))) {
      const login = new URL('/research/login', request.url);
      login.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/research',
    '/research/:path*',
    '/',
    '/(de|tw|wo)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
