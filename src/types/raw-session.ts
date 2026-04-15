/**
 * Layer 1 — Raw session data (single source of truth).
 * All feature / latent / interpretation code must consume these shapes only.
 */

export interface RawResponse {
  questionId: string;
  selectedAnswer: number;
  responseTime: number;
  timestamp: number;
  questionContext: {
    category: 'focus' | 'pattern' | 'sensory' | 'social' | 'structure' | 'flexibility';
    difficulty: 'broad' | 'specific';
    type: 'core' | 'refinement';
    tags: string[];
  };
  confidence?: number;
  answerChanges?: number;
}

export interface SessionRaw {
  sessionId: string;
  responses: RawResponse[];
}
