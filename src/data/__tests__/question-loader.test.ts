import { describe, it, expect, vi } from 'vitest';
import { loadQuestionsFromDiskImpl } from '@/data/question-loader-fs';
import { validateQuestionBankArray } from '@/data/question-bank-validate';

describe('question bank loader', () => {
  it('loads the universal bank when locale is not Ghana-specific', async () => {
    const merged = await loadQuestionsFromDiskImpl('zz-unknown-locale');
    expect(merged.length).toBe(130);
    expect(merged[0]).toMatchObject({
      id: expect.any(String),
      dimensionWeights: expect.any(Object),
    });
    const tiavGh = merged.find((q) => q.id === 'TIAV-T-01');
    expect(tiavGh?.text).toContain('I can picture');
    expect(tiavGh?.stemVariants?.ghana).toContain('I can picture');
    expect(tiavGh?.stemVariants?.ghana).toContain('naming ceremony');
  });

  it('merges universal and Ghana files for ghana / gh-en locales', async () => {
    const merged = await loadQuestionsFromDiskImpl('ghana');
    expect(merged.length).toBe(171);
    const ghanaOnly = merged.filter((q) => q.culturalContext === 'ghana');
    expect(ghanaOnly.length).toBe(41);
  });

  it('validateQuestionBankArray throws on schema failure', () => {
    expect(() => validateQuestionBankArray([{ id: 'only-id' }], 'fixture')).toThrow(/validation failed/i);
  });

  it('loads cultural adaptive v1 bank when NEXT_PUBLIC_PCMS_QUESTION_SOURCE=cultural_adaptive_v1', async () => {
    vi.stubEnv('NEXT_PUBLIC_PCMS_QUESTION_SOURCE', 'cultural_adaptive_v1');
    try {
      const merged = await loadQuestionsFromDiskImpl('universal');
      expect(merged.length).toBe(200);
      expect(merged[0].tags).toContain('cultural_adaptive_v1');
      expect(merged[0].responseScale).toBe('likert3');
      const gh = await loadQuestionsFromDiskImpl('ghana');
      expect(gh[0].text).not.toBe(merged[0].text);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
