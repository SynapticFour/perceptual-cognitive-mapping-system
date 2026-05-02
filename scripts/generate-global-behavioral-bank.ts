/**
 * Builds `content/questions/global-behavioral-v2/bank.json` (200 items).
 * Run: `npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node"}' scripts/generate-global-behavioral-bank.ts`
 */
import fs from 'fs';
import path from 'path';

import type { EightConstructId } from '../src/model/eight-constructs';
import {
  EIGHT_CONSTRUCT_IDS,
  eightConstructCategoryTag,
  eightConstructPrimaryRoutingWeights,
} from '../src/model/eight-constructs';
import { STEM_TEXT } from './global-behavior-v2-texts';
import type { QuestionBankJsonEntry } from '../src/data/questions';

function variantFor(construct: EightConstructId, index: number): 'a' | 'b' | 'c' {
  if (construct === 'cognitive_framing') {
    return (['a', 'b', 'c'] as const)[index % 3]!;
  }
  if (construct === 'information_load' || construct === 'self_regulation' || construct === 'motivation') {
    return index % 2 === 0 ? 'a' : 'b';
  }
  return 'a';
}

function toDimensionWeights(construct: EightConstructId, index: number): QuestionBankJsonEntry['dimension_weights'] {
  const v = variantFor(construct, index);
  const full = eightConstructPrimaryRoutingWeights(construct, v);
  const out: Partial<Record<string, number>> = {};
  for (const [k, val] of Object.entries(full)) {
    if (val > 0) out[k] = Number(val.toFixed(4));
  }
  return out as QuestionBankJsonEntry['dimension_weights'];
}

function build(): QuestionBankJsonEntry[] {
  const rows: QuestionBankJsonEntry[] = [];

  for (const construct of EIGHT_CONSTRUCT_IDS) {
    const texts = STEM_TEXT[construct];
    if (texts.length !== 25) {
      throw new Error(`Expected 25 stems for ${construct}, got ${texts.length}`);
    }
    for (let i = 0; i < 25; i += 1) {
      const n = i + 1;
      const id = `g8-${construct}-${String(n).padStart(3, '0')}`;
      const isRefinement = i >= 20;
      const reverse = i % 2 === 1;
      const ig = 0.52 + ((i + construct.length) % 17) * 0.02;
      const informationGain = Math.min(0.88, Math.max(0.51, Math.round(ig * 100) / 100));

      rows.push({
        id,
        text: texts[i]!,
        dimension_weights: toDimensionWeights(construct, i),
        type: isRefinement ? 'refinement' : 'core',
        difficulty: isRefinement ? 'specific' : 'broad',
        tags: [eightConstructCategoryTag(construct), `g8:${construct}`, 'behavioral_v2', 'global_bank'],
        culturalContext: 'universal',
        informationGain,
        reverseScored: reverse,
        responseScale: 'likert3',
      });
    }
  }

  return rows;
}

function main(): void {
  const rows = build();
  const outDir = path.join(process.cwd(), 'content', 'questions', 'global-behavioral-v2');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'bank.json');
  fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${rows.length} questions to ${outPath}`);
}

main();
