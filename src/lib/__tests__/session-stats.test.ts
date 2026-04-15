import { describe, it, expect } from 'vitest';
import { getSessionStats } from '@/lib/session-stats';
import { toPublicSessionStats } from '@/types/session-stats';
import type { SessionRaw } from '@/types/raw-session';

describe('session-stats', () => {
  it('getSessionStats returns internal shape with rawResponses', () => {
    const session: SessionRaw = {
      sessionId: 'abc',
      responses: [
        {
          questionId: 'q1',
          selectedAnswer: 3,
          responseTime: 1000,
          timestamp: 1000,
          questionContext: {
            category: 'focus',
            difficulty: 'broad',
            type: 'core',
            tags: ['focus'],
          },
        },
      ],
    };
    const internal = getSessionStats(session);
    expect(internal.rawResponses).toHaveLength(1);
    expect(internal.responseTimesMs).toEqual([1000]);
  });

  it('toPublicSessionStats strips rawResponses for UI contract', () => {
    const session: SessionRaw = {
      sessionId: 'abc',
      responses: [
        {
          questionId: 'q1',
          selectedAnswer: 3,
          responseTime: 1000,
          timestamp: 1000,
          questionContext: {
            category: 'focus',
            difficulty: 'broad',
            type: 'core',
            tags: ['focus'],
          },
        },
      ],
    };
    const internal = getSessionStats(session);
    const pub = toPublicSessionStats(internal);
    expect('rawResponses' in pub).toBe(false);
    expect(pub.responseCount).toBe(1);
  });
});
