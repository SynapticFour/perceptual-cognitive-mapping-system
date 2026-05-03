import type { AssessmentQuestion, QuestionResponse } from '@/data/questions';
import {
  CULTURAL_ADAPTIVE_BANK_CONTENT_VERSION,
  CULTURAL_ADAPTIVE_BANK_ID,
  CULTURAL_ADAPTIVE_BANK_TAG,
} from '@/lib/cultural-adaptive-bank';

/**
 * Infer which authored bank produced the session from answered question ids/tags.
 * Mixed banks yield `mixed` — rare in production; useful for QA imports.
 */
export function inferQuestionBankMeta(
  history: QuestionResponse[],
  questionsById: Map<string, AssessmentQuestion>
): { questionBankId: string; bankVersion: string } {
  const kinds = new Set<'cultural' | 'g8' | 'classic'>();
  for (const h of history) {
    const q = questionsById.get(h.questionId);
    if (!q) continue;
    if (q.tags?.includes(CULTURAL_ADAPTIVE_BANK_TAG)) kinds.add('cultural');
    else if (q.id.startsWith('g8:')) kinds.add('g8');
    else kinds.add('classic');
  }
  if (kinds.size === 1 && kinds.has('cultural')) {
    return { questionBankId: CULTURAL_ADAPTIVE_BANK_ID, bankVersion: CULTURAL_ADAPTIVE_BANK_CONTENT_VERSION };
  }
  if (kinds.size === 1 && kinds.has('g8')) {
    return { questionBankId: 'global_behavioral_v2', bankVersion: '2' };
  }
  if (kinds.size === 1 && kinds.has('classic')) {
    return { questionBankId: 'routing_classic', bankVersion: '1' };
  }
  if (kinds.size === 0) return { questionBankId: 'unknown', bankVersion: '0' };
  return { questionBankId: 'mixed', bankVersion: '0' };
}
