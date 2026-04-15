import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringModel } from '@/scoring';
import { getAssessmentQuestions, type AssessmentQuestion, type QuestionResponse, type LikertResponse } from '@/data/questions';

describe('ScoringModel - Edge Cases', () => {
  let model: ScoringModel;
  let questions: AssessmentQuestion[];
  let questionsById: Map<string, AssessmentQuestion>;

  beforeEach(() => {
    model = new ScoringModel();
    questions = getAssessmentQuestions('core', 'universal').slice(0, 5);
    questionsById = new Map(questions.map(q => [q.id, q]));
  });

  describe('Mathematical Edge Cases', () => {
    it('should handle zero-weight dimensions gracefully', () => {
      const zeroWeightQuestions: AssessmentQuestion[] = questions.map(q => ({
        ...q,
        dimensionWeights: { F: 0, P: 0, S: 0, E: 0, R: 0, C: 0 }
      }));

      const zeroWeightQuestionsById = new Map(zeroWeightQuestions.map(q => [q.id, q]));
      const responses: QuestionResponse[] = zeroWeightQuestions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = model.evaluate(responses, zeroWeightQuestionsById);

      // Should not crash and should handle zero weights
      expect(result.confidenceComponents).toBeDefined();
      expect(Object.values(result.confidenceComponents).every(d => !isNaN(d.finalConfidence))).toBe(true);
    });

    it('should handle negative weights (should be normalized)', () => {
      const negativeWeightQuestions: AssessmentQuestion[] = questions.map(q => ({
        ...q,
        dimensionWeights: { F: -0.5, P: 1.5, S: 0, E: 0, R: 0, C: 0 }
      }));

      const negativeWeightQuestionsById = new Map(negativeWeightQuestions.map(q => [q.id, q]));
      const responses: QuestionResponse[] = negativeWeightQuestions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      expect(() => {
        model.evaluate(responses, negativeWeightQuestionsById);
      }).not.toThrow();

      const result = model.evaluate(responses, negativeWeightQuestionsById);
      expect(Object.values(result.confidenceComponents).every(d => !isNaN(d.finalConfidence) && isFinite(d.finalConfidence))).toBe(true);
    });

    it('should handle extreme response patterns', () => {
      // Test all minimum responses
      const minResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 1 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const minResult = model.evaluate(minResponses, questionsById);
      expect(Object.values(minResult.confidenceComponents).every(d => d.finalConfidence >= 0 && d.finalConfidence <= 1)).toBe(true);

      // Test all maximum responses
      const maxResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 5 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const maxResult = model.evaluate(maxResponses, questionsById);
      expect(Object.values(maxResult.confidenceComponents).every(d => d.finalConfidence >= 0 && d.finalConfidence <= 1)).toBe(true);

      // Test alternating pattern
      const alternatingResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: (i % 2 === 0 ? 1 : 5) as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const alternatingResult = model.evaluate(alternatingResponses, questionsById);
      expect(Object.values(alternatingResult.confidenceComponents).every(d => !isNaN(d.finalConfidence) && isFinite(d.finalConfidence))).toBe(true);
    });

    it('should maintain numerical stability with large datasets', () => {
      // Create many responses to test accumulation
      const manyResponses: QuestionResponse[] = [];
      for (let i = 0; i < 1000; i++) {
        manyResponses.push({
          questionId: questions[i % questions.length].id,
          response: ((i % 5) + 1) as LikertResponse,
          timestamp: new Date(Date.now() + i),
          responseTimeMs: 1000,
        });
      }

      expect(() => {
        model.evaluate(manyResponses, questionsById);
      }).not.toThrow();

      const result = model.evaluate(manyResponses, questionsById);
      expect(Object.values(result.confidenceComponents).every(d => !isNaN(d.finalConfidence) && isFinite(d.finalConfidence))).toBe(true);
    });

    it('should handle floating point precision edge cases', () => {
      // Test with weights that could cause precision issues
      const precisionQuestions: AssessmentQuestion[] = questions.map(q => ({
        ...q,
        dimensionWeights: { 
          F: 0.1 + 0.2, // 0.30000000000000004 in floating point
          P: 0.3, 
          S: 0, E: 0, R: 0, C: 0 
        }
      }));

      const precisionQuestionsById = new Map(precisionQuestions.map(q => [q.id, q]));
      const responses: QuestionResponse[] = precisionQuestions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = model.evaluate(responses, precisionQuestionsById);
      
      // Should handle precision correctly without NaN or Infinity
      expect(isFinite(result.confidenceComponents.F.finalConfidence)).toBe(true);
      expect(result.confidenceComponents.F.finalConfidence).toBeGreaterThanOrEqual(0);
      expect(result.confidenceComponents.F.finalConfidence).toBeLessThanOrEqual(1);
      
      // The actual value depends on the algorithm, but should be reasonable
      expect(result.confidenceComponents.F.finalConfidence).toBeLessThan(0.75); // Likely capped due to insufficient evidence
    });
  });

  describe('Confidence Calculation Edge Cases', () => {
    it('should handle insufficient sample size gracefully', () => {
      const singleResponse: QuestionResponse[] = [{
        questionId: questions[0]!.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }];

      const result = model.evaluate(singleResponse, questionsById);
      
      // Should have low confidence but not crash
      expect(Object.values(result.confidenceComponents).every(d => d.finalConfidence >= 0 && d.finalConfidence <= 1)).toBe(true);
    });

    it('should handle contradictory responses', () => {
      // Create responses that should have low consistency
      const contradictoryResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: (i % 2 === 0 ? 1 : 5) as LikertResponse, // Extreme contradiction
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = model.evaluate(contradictoryResponses, questionsById);
      
      // Should detect low consistency
      const avgConfidence = Object.values(result.confidenceComponents).reduce((sum, d) => sum + d.finalConfidence, 0) / Object.keys(result.confidenceComponents).length;
      expect(avgConfidence).toBeLessThan(0.8); // Should be penalized for inconsistency
    });

    it('should handle perfect consistency', () => {
      const consistentResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 4 as LikertResponse, // All same response
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = model.evaluate(consistentResponses, questionsById);
      
      // Should have perfect consistency (variance = 0, consistency = 1)
      // But confidence may still be low due to insufficient evidence
      Object.values(result.confidenceComponents).forEach((d) => {
        expect(d.consistency).toBeGreaterThan(0.95);
        expect(d.consistency).toBeLessThanOrEqual(1);
      });
      
      // At least one dimension should have some confidence if it has weight
      const hasAnyConfidence = Object.values(result.confidenceComponents).some(d => d.finalConfidence > 0);
      expect(hasAnyConfidence).toBe(true);
    });

    it('should handle reverse-scored questions correctly', () => {
      const reverseScoredQuestions: AssessmentQuestion[] = questions.map(q => ({
        ...q,
        reverseScored: true
      }));

      const reverseScoredQuestionsById = new Map(reverseScoredQuestions.map(q => [q.id, q]));
      const responses: QuestionResponse[] = reverseScoredQuestions.map((q, i) => ({
        questionId: q.id,
        response: 5 as LikertResponse, // High response should map to low score
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = model.evaluate(responses, reverseScoredQuestionsById);
      
      // Should handle reverse scoring without issues
      expect(Object.values(result.confidenceComponents).every(d => !isNaN(d.finalConfidence) && isFinite(d.finalConfidence))).toBe(true);
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle empty response array', () => {
      const result = model.evaluate([], questionsById);
      
      expect(result).toBeDefined();
      expect(result.confidenceComponents).toBeDefined();
      expect(Object.values(result.confidenceComponents).every(d => d.finalConfidence === 0)).toBe(true);
    });

    it('should handle responses for unknown questions', () => {
      const responsesWithUnknown: QuestionResponse[] = [
        {
          questionId: 'unknown-question-id',
          response: 3 as LikertResponse,
          timestamp: new Date(),
          responseTimeMs: 1000,
        },
        ...questions.slice(0, 2).map((q, i) => ({
          questionId: q.id,
          response: 3 as LikertResponse,
          timestamp: new Date(),
          responseTimeMs: 1000,
        }))
      ];

      // Should either ignore unknown questions or throw gracefully
      expect(() => {
        model.evaluate(responsesWithUnknown, questionsById);
      }).not.toThrow();
    });

    it('should handle malformed question data', () => {
      const malformedQuestions: AssessmentQuestion[] = questions.map(q => ({
        ...q,
        dimensionWeights: {} as any, // Empty weights
      }));

      const malformedQuestionsById = new Map(malformedQuestions.map(q => [q.id, q]));
      const responses: QuestionResponse[] = malformedQuestions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      expect(() => {
        model.evaluate(responses, malformedQuestionsById);
      }).not.toThrow();
    });

    it('should handle extreme response times', () => {
      const extremeTimeResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: i % 2 === 0 ? 0 : 1000000, // 0 to 1000 seconds
      }));

      expect(() => {
        model.evaluate(extremeTimeResponses, questionsById);
      }).not.toThrow();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle extreme configuration values', () => {
      const extremeModel = new ScoringModel({
        priorPseudoEvidence: 0,
      });

      const responses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      expect(() => {
        extremeModel.evaluate(responses, questionsById);
      }).not.toThrow();
    });

    it('should handle zero shrinkage factor', () => {
      const noShrinkageModel = new ScoringModel({
        priorPseudoEvidence: 0,
      });

      const responses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = noShrinkageModel.evaluate(responses, questionsById);
      expect(result).toBeDefined();
      expect(Object.values(result.confidenceComponents).every(d => d.finalConfidence >= 0)).toBe(true);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle rapid evaluation calls', () => {
      const responses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const startTime = performance.now();
      
      // Perform many evaluations
      for (let i = 0; i < 100; i++) {
        model.evaluate(responses, questionsById);
      }
      
      const endTime = performance.now();
      
      // Should complete quickly (< 1 second for 100 evaluations)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle memory efficiently with large datasets', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Create and evaluate many large response sets
      for (let i = 0; i < 50; i++) {
        const largeResponses: QuestionResponse[] = [];
        for (let j = 0; j < 100; j++) {
          largeResponses.push({
            questionId: questions[j % questions.length].id,
            response: ((j % 5) + 1) as LikertResponse,
            timestamp: new Date(Date.now() + j),
            responseTimeMs: 1000,
          });
        }
        model.evaluate(largeResponses, questionsById);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory growth should be reasonable (< 10MB)
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Statistical Edge Cases', () => {
    it('should handle single response variance calculations', () => {
      const singleResponse: QuestionResponse[] = [{
        questionId: questions[0]!.id,
        response: 3 as LikertResponse,
        timestamp: new Date(),
        responseTimeMs: 1000,
      }];

      const result = model.evaluate(singleResponse, questionsById);
      
      // Variance should be undefined or handled gracefully for single values
      expect(result).toBeDefined();
      expect(Object.values(result.confidenceComponents).every(d => !isNaN(d.finalConfidence))).toBe(true);
    });

    it('should handle identical responses (zero variance)', () => {
      const identicalResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: 3 as LikertResponse, // All identical
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = model.evaluate(identicalResponses, questionsById);
      
      // Should handle zero variance without division by zero errors
      expect(Object.values(result.confidenceComponents).every(d => !isNaN(d.finalConfidence) && isFinite(d.finalConfidence))).toBe(true);
    });

    it('should handle maximum variance scenarios', () => {
      const maxVarianceResponses: QuestionResponse[] = questions.map((q, i) => ({
        questionId: q.id,
        response: (i % 2 === 0 ? 1 : 5) as LikertResponse, // Maximum spread
        timestamp: new Date(),
        responseTimeMs: 1000,
      }));

      const result = model.evaluate(maxVarianceResponses, questionsById);
      
      // Should handle maximum variance without issues
      expect(Object.values(result.confidenceComponents).every(d => !isNaN(d.finalConfidence) && isFinite(d.finalConfidence))).toBe(true);
    });
  });
});
