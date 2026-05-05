import { NextResponse } from 'next/server';

/** Liveness probe: process responds to HTTP. Keep dependency-free and fast. */
export function GET() {
  return NextResponse.json({
    status: 'pass',
    service: 'pcms',
    probe: 'live',
    timestamp: new Date().toISOString(),
  });
}

export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
