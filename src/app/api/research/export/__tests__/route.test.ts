import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DEFAULT_CONFIDENCE, DEFAULT_COGNITIVE_VECTOR } from '@/model/cognitive-dimensions';
import { POST } from '@/app/api/research/export/route';

const KEY = '0123456789abcdef0123456789abcd';

function sampleSession(anonId: string) {
  return {
    anonId,
    culturalContext: 'universal' as const,
    completedAt: '2026-04-12T12:00:00.000Z',
    responseCount: 12,
    scores: { ...DEFAULT_COGNITIVE_VECTOR, F: 0.62 },
    confidence: { ...DEFAULT_CONFIDENCE, F: 0.71 },
  };
}

describe('POST /api/research/export', () => {
  beforeEach(() => {
    process.env.RESEARCH_EXPORT_API_KEY = KEY;
  });

  afterEach(() => {
    delete process.env.RESEARCH_EXPORT_API_KEY;
  });

  it('returns 401 without valid API key', async () => {
    const req = new Request('http://localhost/api/research/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'spss', sessions: [sampleSession('x')] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns CSV for format=spss when authorised', async () => {
    const req = new Request('http://localhost/api/research/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-research-api-key': KEY,
      },
      body: JSON.stringify({ format: 'spss', sessions: [sampleSession('a1'), sampleSession('a2')] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('anon_id');
    expect(text).toContain('sc_F');
    expect(text.split('\n').filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });

  it('returns JSON for format=r when authorised', async () => {
    const req = new Request('http://localhost/api/research/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-research-api-key': KEY,
      },
      body: JSON.stringify({ format: 'r', sessions: [sampleSession('b1')] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessions).toHaveLength(1);
    expect(data.aggregates.groups[0].n).toBe(1);
  });
});
