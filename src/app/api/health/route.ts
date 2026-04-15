import { NextResponse } from 'next/server';

/** Lightweight liveness check for client-side connectivity probes. */
export function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: true });
}
