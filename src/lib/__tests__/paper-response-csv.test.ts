import { describe, expect, it } from 'vitest';
import { parsePaperResponsesCsv } from '@/lib/paper-response-csv';

describe('paper-response-csv', () => {
  it('parses header and rows', () => {
    const csv = `questionId,response,responseTimeMs,timestamp
a1,4,1200,2026-01-15T10:00:00.000Z
a2,3,800,2026-01-15T10:01:00.000Z`;
    const rows = parsePaperResponsesCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.questionId).toBe('a1');
    expect(rows[0]!.response).toBe(4);
    expect(rows[1]!.response).toBe(3);
  });
});
