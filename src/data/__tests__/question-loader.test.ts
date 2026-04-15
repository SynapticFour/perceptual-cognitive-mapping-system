import { describe, it, expect } from 'vitest';
import { loadQuestionsFromDiskImpl } from '@/data/question-loader-fs';
import { validateQuestionBankArray } from '@/data/question-bank-validate';

describe('question bank loader', () => {
  it('loads the universal bank when locale is not Ghana-specific', async () => {
    const merged = await loadQuestionsFromDiskImpl('zz-unknown-locale');
    expect(merged.length).toBe(50);
    expect(merged[0]).toMatchObject({
      id: expect.any(String),
      dimensionWeights: expect.any(Object),
    });
  });

  it('merges universal and Ghana files for ghana / gh-en locales', async () => {
    const merged = await loadQuestionsFromDiskImpl('ghana');
    expect(merged.length).toBe(75);
    const ghanaOnly = merged.filter((q) => q.culturalContext === 'ghana');
    expect(ghanaOnly.length).toBe(25);
  });

  it('validateQuestionBankArray throws on schema failure', () => {
    expect(() => validateQuestionBankArray([{ id: 'only-id' }], 'fixture')).toThrow(/validation failed/i);
  });
});
