import { describe, expect, it } from 'vitest';
import type { CulturalAdaptiveBankJsonRow } from '@/lib/cultural-adaptive-bank';
import { auditCulturalAdaptiveStemSimilarity } from '@/lib/cultural-adaptive-stem-audit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('auditCulturalAdaptiveStemSimilarity', () => {
  it('flags a fully identical triplet', () => {
    const rows: CulturalAdaptiveBankJsonRow[] = [
      {
        id: 'fake-id',
        dimension: 'sensory_regulation',
        reverse: false,
        tags: [],
        variants: {
          global: 'I notice small sounds early in a quiet room.',
          ghana: 'I notice small sounds early in a quiet room.',
          west_africa: 'I notice small sounds early in a quiet room.',
        },
      },
    ];
    expect(auditCulturalAdaptiveStemSimilarity(rows, 0.99)).toHaveLength(1);
  });

  it('reports few high-similarity pairs on the shipped bank', () => {
    const root = join(__dirname, '../../../content/questions/cultural-adaptive-v1/bank.json');
    const rows = JSON.parse(readFileSync(root, 'utf8')) as CulturalAdaptiveBankJsonRow[];
    const flags = auditCulturalAdaptiveStemSimilarity(rows, 0.88);
    expect(flags.length).toBeLessThan(200);
    expect(flags.length).toBeGreaterThanOrEqual(0);
  });
});
