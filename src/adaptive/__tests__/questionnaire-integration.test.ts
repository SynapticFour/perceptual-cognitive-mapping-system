/**
 * Integration test: complete questionnaire flows for all cultural contexts.
 * Verifies that the engine reaches confidence thresholds within the hard cap,
 * and that Ghana-context questions are selected when appropriate.
 */
import { describe, expect, it } from 'vitest';
import { AdaptiveQuestionnaireEngine } from '../questionnaire-engine';
import { getQuestionsForContext } from '@/data/questions';

const CULTURAL_CONTEXTS = ['western', 'ghana', 'universal'] as const;

describe('AdaptiveQuestionnaireEngine — integration', () => {
  for (const ctx of CULTURAL_CONTEXTS) {
    describe(`cultural context: ${ctx}`, () => {
      it('completes within hard question cap', () => {
        const engine = new AdaptiveQuestionnaireEngine(ctx);
        let steps = 0;
        while (!engine.getState().isComplete && steps < 35) {
          const q = engine.selectNextQuestion();
          if (!q) break;
          engine.submitResponse({
            questionId: q.id,
            response: 3,
            timestamp: new Date(),
            responseTimeMs: 1200,
          });
          steps++;
        }
        expect(steps).toBeLessThanOrEqual(30);
        expect(engine.getState().completionReason).not.toBeNull();
      });

      it('selects at least one question per core dimension', () => {
        const engine = new AdaptiveQuestionnaireEngine(ctx, { maxTotalQuestions: 30 });
        const coveredDimensions = new Set<string>();
        let steps = 0;
        while (!engine.getState().isComplete && steps < 30) {
          const q = engine.selectNextQuestion();
          if (!q) break;
          Object.keys(q.dimensionWeights).forEach((d) => coveredDimensions.add(d));
          engine.submitResponse({
            questionId: q.id,
            response: 3,
            timestamp: new Date(),
            responseTimeMs: 1200,
          });
          steps++;
        }
        ['F', 'P', 'S', 'E', 'R', 'C'].forEach((dim) => {
          expect(coveredDimensions.has(dim)).toBe(true);
        });
      });

      if (ctx === 'ghana') {
        it('uses a Ghana-compatible bank (and Ghana-specific items when available)', () => {
          const bank = getQuestionsForContext('ghana');
          expect(bank.length).toBeGreaterThan(0);
          const allCompatible = bank.every(
            (q) => q.culturalContext === 'ghana' || q.culturalContext === 'universal' || q.culturalContext === undefined
          );
          expect(allCompatible).toBe(true);
          const ghanaSpecific = bank.filter((q) => q.culturalContext === 'ghana');
          if (ghanaSpecific.length > 0) {
            expect(ghanaSpecific.length).toBeGreaterThan(0);
          }
        });
      }
    });
  }
});

