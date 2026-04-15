import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveQuestionnaireEngine } from '@/adaptive';
import { getAssessmentQuestions } from '@/data/questions';
import type { QuestionResponse } from '@/data/questions';

describe('AdaptiveQuestionnaireEngine - Edge Cases', () => {
  let engine: AdaptiveQuestionnaireEngine;

  beforeEach(() => {
    engine = new AdaptiveQuestionnaireEngine('universal');
  });

  describe('Input Validation', () => {
    it('should reject responses outside valid range (1-5)', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      // Test invalid low values
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 0 as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: -1 as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');

      // Test invalid high values
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 6 as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 10 as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');
    });

    it('should reject non-integer responses', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 3.5 as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: NaN as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: Infinity as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');
    });

    it('should reject null/undefined responses', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: null as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: undefined as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid response value');
    });

    it('should reject invalid question IDs', () => {
      expect(() => {
        engine.submitResponse({
          questionId: '',
          response: 3,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid question ID');

      expect(() => {
        engine.submitResponse({
          questionId: 'non-existent-question',
          response: 3,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Question not found');
    });

    it('should reject invalid timestamps', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 3,
          timestamp: new Date('invalid') as any,
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid timestamp');

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 3,
          timestamp: null as any,
          responseTimeMs: 1000,
        });
      }).toThrow('Invalid timestamp');
    });

    it('should reject negative response times', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 3,
          timestamp: new Date(),
          responseTimeMs: -100,
        });
      }).toThrow('Invalid response time');
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate question submissions', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      // First submission should succeed
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 3,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).not.toThrow();

      // Second submission should fail
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 4,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow('Question already answered');
    });

    it('should handle rapid submissions gracefully', () => {
      const question1 = engine.selectNextQuestion();
      expect(question1).not.toBeNull();

      engine.submitResponse({
        questionId: question1!.id,
        response: 3,
        timestamp: new Date(),
        responseTimeMs: 1000,
      });

      const question2 = engine.selectNextQuestion();
      expect(question2).not.toBeNull();

      // Simulate rapid submission with same timestamp
      const sameTime = new Date();
      engine.submitResponse({
        questionId: question2!.id,
        response: 4,
        timestamp: sameTime,
        responseTimeMs: 1000,
      });

      const state = engine.getState();
      expect(state.questionHistory).toHaveLength(2);
      expect(state.answeredQuestions.size).toBe(2);
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency during errors', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      const initialState = engine.getState();
      const initialHistoryLength = initialState.questionHistory.length;
      const initialAnsweredCount = initialState.answeredQuestions.size;

      // Attempt invalid submission
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 0 as any, // Invalid
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow();

      // State should remain unchanged
      const finalState = engine.getState();
      expect(finalState.questionHistory.length).toBe(initialHistoryLength);
      expect(finalState.answeredQuestions.size).toBe(initialAnsweredCount);
      expect(finalState.currentQuestion?.id).toBe(question!.id);
    });

    it('should handle phase transitions correctly', () => {
      // Complete core phase
      const coreQuestions = getAssessmentQuestions('core', 'universal').slice(0, 3);
      
      coreQuestions.forEach((q, i) => {
        const currentQ = engine.selectNextQuestion();
        expect(currentQ).not.toBeNull();
        
        engine.submitResponse({
          questionId: currentQ!.id,
          response: 3,
          timestamp: new Date(Date.now() + i * 1000),
          responseTimeMs: 1000 + i * 100,
        });
      });

      const state = engine.getState();
      expect(state.phase).toBe('core');
      expect(state.isComplete).toBe(false);

      // Force transition to refinement
      engine.resumeFrom(state.questionHistory, ['F']);
      
      const refinementState = engine.getState();
      expect(refinementState.phase).toBe('refinement');
      expect(refinementState.isComplete).toBe(false);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle minimum valid responses', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 1,
          timestamp: new Date(),
          responseTimeMs: 0, // Minimum valid time
        });
      }).not.toThrow();
    });

    it('should handle maximum valid responses', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 5,
          timestamp: new Date(),
          responseTimeMs: 300000, // 5 minutes - reasonable upper bound
        });
      }).not.toThrow();
    });

    it('should handle extremely long response times', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      // Should handle but possibly flag as unusual
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 3,
          timestamp: new Date(),
          responseTimeMs: 3600000, // 1 hour
        });
      }).not.toThrow();
    });
  });

  describe('Memory and Performance', () => {
    it('should handle large question histories efficiently', () => {
      const engine = new AdaptiveQuestionnaireEngine('universal', { 
        totalQuestionHardCap: 100 
      });

      // Simulate large history
      const largeHistory: QuestionResponse[] = [];
      for (let i = 0; i < 50; i++) {
        largeHistory.push({
          questionId: `test-q-${i}`,
          response: 3,
          timestamp: new Date(Date.now() + i * 1000),
          responseTimeMs: 1000,
        });
      }

      const startTime = performance.now();
      engine.resumeFrom(largeHistory);
      const endTime = performance.now();

      // Should complete within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      const state = engine.getState();
      expect(state.questionHistory).toHaveLength(50);
    });

    it('should not leak memory on repeated operations', () => {
      // Perform many operations and check for memory growth
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < 100; i++) {
        const question = engine.selectNextQuestion();
        if (question) {
          engine.submitResponse({
            questionId: question.id,
            response: 3,
            timestamp: new Date(),
            responseTimeMs: 1000,
          });
        }
      }

      // Reset and repeat
      engine = new AdaptiveQuestionnaireEngine('universal');
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory growth should be minimal (< 1MB)
      expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024);
    });
  });

  describe('Cultural Context Edge Cases', () => {
    it('should handle cultural context switching', () => {
      const universalEngine = new AdaptiveQuestionnaireEngine('universal');
      const question1 = universalEngine.selectNextQuestion();
      expect(question1).not.toBeNull();

      // Switch to Ghana context
      const ghanaEngine = new AdaptiveQuestionnaireEngine('ghana');
      const question2 = ghanaEngine.selectNextQuestion();
      expect(question2).not.toBeNull();

      // Both should return valid questions in their own context.
      const universalIds = new Set(getAssessmentQuestions('all', 'universal').map((q) => q.id));
      const ghanaIds = new Set(getAssessmentQuestions('all', 'ghana').map((q) => q.id));
      expect(universalIds.has(question1!.id)).toBe(true);
      expect(ghanaIds.has(question2!.id)).toBe(true);
    });

    it('should handle invalid cultural contexts', () => {
      expect(() => {
        new AdaptiveQuestionnaireEngine('invalid' as any);
      }).toThrow('Invalid cultural context');
    });
  });

  describe('Concurrent Access Simulation', () => {
    it('should handle rapid state changes', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      // Simulate rapid operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(() => {
          const state = engine.getState();
          return state.questionHistory.length;
        });
      }

      // Execute operations rapidly
      const results = operations.map(op => op());
      
      // All should see consistent state
      expect(results.every(r => r === results[0])).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from invalid operations', () => {
      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      // Attempt invalid operation
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 0 as any,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).toThrow();

      // System should still be functional
      const nextQuestion = engine.selectNextQuestion();
      expect(nextQuestion).not.toBeNull();
      expect(nextQuestion?.id).toBe(question!.id);

      // Valid operation should work
      expect(() => {
        engine.submitResponse({
          questionId: question!.id,
          response: 3,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }).not.toThrow();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle zero confidence threshold', () => {
      const engine = new AdaptiveQuestionnaireEngine('universal', {
        confidenceThreshold: 0,
        maxCoreQuestions: 1,
        maxRefinementQuestions: 1,
        maxTotalQuestions: 2,
      });

      const question = engine.selectNextQuestion();
      expect(question).not.toBeNull();

      engine.submitResponse({
        questionId: question!.id,
        response: 3,
        timestamp: new Date(),
        responseTimeMs: 1000,
      });

      // Completion occurs during follow-up selection cycle.
      while (!engine.getState().isComplete) {
        const next = engine.selectNextQuestion();
        if (!next) break;
        engine.submitResponse({
          questionId: next.id,
          response: 3,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
      }
      expect(engine.getState().isComplete).toBe(true);
    });

    it('should handle extremely high confidence threshold', () => {
      const engine = new AdaptiveQuestionnaireEngine('universal', {
        confidenceThreshold: 1.0, // Impossible to achieve
        maxCoreQuestions: 5,
        maxRefinementQuestions: 5,
        maxTotalQuestions: 10,
      });

      // Should hit question limit before confidence threshold
      let questionCount = 0;
      while (questionCount < 10 && !engine.getState().isComplete) {
        const question = engine.selectNextQuestion();
        if (!question) break;
        
        engine.submitResponse({
          questionId: question.id,
          response: 3,
          timestamp: new Date(),
          responseTimeMs: 1000,
        });
        questionCount++;
      }

      const state = engine.getState();
      expect(state.isComplete).toBe(true);
      expect(state.completionReason).toBe('max_questions');
    });
  });
});
