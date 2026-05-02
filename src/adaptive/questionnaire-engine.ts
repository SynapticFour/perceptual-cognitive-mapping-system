import {
  type AssessmentQuestion,
  type QuestionResponse,
  getQuestionsForContext,
  getAssessmentQuestions,
  getQuestionsForDimensions,
} from '@/data/questions';
import {
  CoverageModel,
  ROUTING_WEIGHT_KEYS,
  type RoutingWeightKey,
  type TagCoverageVector,
} from '@/adaptive/coverage-model';
import { ScoringModel, type CognitiveDimension } from '@/scoring';

/** Research-defined maximum number of answered questions per assessment (including refinement). */
export const ENGINE_HARD_CAP_TOTAL_QUESTIONS = 30;

export interface QuestionnaireState {
  answeredQuestions: Set<string>;
  currentQuestion: AssessmentQuestion | null;
  questionHistory: QuestionResponse[];
  isComplete: boolean;
  culturalContext: 'western' | 'ghana' | 'universal';
  startTime: Date;
  phase: 'core' | 'refinement' | 'complete';
  questionPath: string[];
  completionReason: 'confidence_met' | 'max_questions' | 'user_exit' | null;
}

export interface QuestionSelectionCriteria {
  targetTags: RoutingWeightKey[];
  excludeAnswered: boolean;
  maxQuestionsPerTag: number;
  questionType: 'core' | 'refinement' | 'any';
}

export interface ResearchAssessmentConfig {
  confidenceThreshold: number;
  maxCoreQuestions: number;
  maxRefinementQuestions: number;
  /** Upper bound for initial adaptive flow; absolute cap is {@link ENGINE_HARD_CAP_TOTAL_QUESTIONS}. */
  maxTotalQuestions: number;
  /** Override absolute answer cap (for automated tests only). */
  totalQuestionHardCap?: number;
}

export class AdaptiveQuestionnaireEngine {
  private questions: AssessmentQuestion[];
  private state: QuestionnaireState;
  private coverageModel: CoverageModel;
  private scoringModel: ScoringModel;
  private config: ResearchAssessmentConfig;
  /** 
   * When set (e.g. after {@link resumeFrom}), refinement only targets these routing dimensions 
   * until they meet threshold. This allows for focused refinement on specific dimensions 
   * that need additional confidence building.
   */
  private refinementFocusTags: RoutingWeightKey[] | null = null;

  /**
   * Initializes the adaptive questionnaire engine with cultural context and configuration.
   * 
   * The engine manages a two-phase assessment:
   * 1. Core Phase: Balanced coverage across all dimensions
   * 2. Refinement Phase: Targeted questions for low-confidence dimensions
   * 
   * @param culturalContext - Cultural context for question selection ('western', 'ghana', 'universal')
   * @param config - Optional configuration overrides for research parameters
   */
  constructor(culturalContext: 'western' | 'ghana' | 'universal' = 'universal', config?: Partial<ResearchAssessmentConfig>) {
    if (culturalContext !== 'western' && culturalContext !== 'ghana' && culturalContext !== 'universal') {
      throw new Error('Invalid cultural context');
    }
    // Load questions appropriate for the cultural context
    this.questions = getQuestionsForContext(culturalContext);
    
    // Merge default config with provided overrides
    this.config = {
      confidenceThreshold: 0.75, // Minimum confidence required for completion
      maxCoreQuestions: 15,      // Maximum questions in core phase
      maxRefinementQuestions: 10, // Maximum questions in refinement phase
      maxTotalQuestions: ENGINE_HARD_CAP_TOTAL_QUESTIONS, // Absolute upper limit
      ...config,
    };
    
    // Initialize supporting models
    this.coverageModel = new CoverageModel({
      researchConfidenceThreshold: this.config.confidenceThreshold,
      maxQuestionsPerDimension: 5, // Maximum questions per dimension in refinement
    });
    this.scoringModel = new ScoringModel();
    
    // Initialize engine state
    this.state = this.initializeState(culturalContext);
  }

  private get totalQuestionHardCap(): number {
    return this.config.totalQuestionHardCap ?? ENGINE_HARD_CAP_TOTAL_QUESTIONS;
  }

  private routingCoverage(): TagCoverageVector {
    return this.coverageModel.coverageVectorFromResponses(
      this.state.questionHistory,
      this.questions,
      this.scoringModel
    );
  }

  private initializeState(culturalContext: 'western' | 'ghana' | 'universal'): QuestionnaireState {
    return {
      answeredQuestions: new Set(),
      currentQuestion: null,
      questionHistory: [],
      isComplete: false,
      culturalContext,
      startTime: new Date(),
      phase: 'core',
      questionPath: [],
      completionReason: null,
    };
  }

  getState(): QuestionnaireState {
    return { ...this.state };
  }

  /** Dimensions restricted in refinement after {@link resumeFrom}; null means full adaptive refinement. */
  getRefinementFocusDimensions(): readonly RoutingWeightKey[] | null {
    return this.refinementFocusTags;
  }

  /**
   * Selects the next question based on current assessment state and phase.
   * 
   * This is the core adaptive logic that determines which question to present next:
   * - Checks completion conditions (hard caps, confidence thresholds)
   * - Routes to appropriate phase-specific selection logic
   * - Updates state with selected question
   * 
   * @param _criteria - Currently unused parameter for future extensibility
   * @returns Next question to present, or null if assessment is complete
   */
  selectNextQuestion(_criteria?: Partial<QuestionSelectionCriteria>): AssessmentQuestion | null {
    void _criteria; // Parameter reserved for future use
    
    // Return null if assessment is already complete
    if (this.state.isComplete) {
      return null;
    }

    // Enforce absolute question limit to prevent infinite assessments
    if (this.state.questionHistory.length >= this.totalQuestionHardCap) {
      this.state.isComplete = true;
      this.state.phase = 'complete';
      this.state.completionReason = 'max_questions';
      return null;
    }

    // Check if confidence threshold has been met
    if (this.shouldComplete()) {
      this.state.isComplete = true;
      return null;
    }

    let selectedQuestion: AssessmentQuestion | null = null;

    // Route to appropriate phase-specific selection logic
    if (this.state.phase === 'core') {
      selectedQuestion = this.selectCoreQuestion();
    } else if (this.state.phase === 'refinement') {
      selectedQuestion = this.selectRefinementQuestion();
    }

    // Handle case where no suitable question is found
    if (!selectedQuestion) {
      this.state.isComplete = true;
      this.state.phase = 'complete';
      // Determine completion reason based on whether we had focus dimensions
      this.state.completionReason = this.refinementFocusTags ? 'confidence_met' : 'max_questions';
      return null;
    }

    // Update state with selected question
    this.state.questionPath.push(selectedQuestion.id);
    this.state.currentQuestion = selectedQuestion;
    return selectedQuestion;
  }

  private selectCoreQuestion(): AssessmentQuestion | null {
    const coreQuestions = getAssessmentQuestions('core', this.state.culturalContext);
    const availableCore = coreQuestions.filter((q) => !this.state.answeredQuestions.has(q.id));

    if (availableCore.length === 0) return null;

    const counts = this.coverageModel.countQuestionsPerTag(this.state.questionHistory, this.questions);
    const scoredQuestions = availableCore.map((q) => ({
      question: q,
      score: this.calculateCoreQuestionScore(q, counts),
    }));

    scoredQuestions.sort((a, b) => b.score - a.score);
    return scoredQuestions[0]!.question;
  }

  private selectRefinementQuestion(): AssessmentQuestion | null {
    const coverage = this.routingCoverage();
    const pool = this.refinementFocusTags ?? ROUTING_WEIGHT_KEYS;
    const targetTag = this.coverageModel.getNextTargetTag(coverage, pool);

    if (!targetTag) {
      if (this.refinementFocusTags) {
        return null;
      }
      const refinementQuestions = getAssessmentQuestions('refinement', this.state.culturalContext);
      const available = refinementQuestions.filter((q) => !this.state.answeredQuestions.has(q.id));
      return available.length > 0 ? available[0]! : null;
    }

    const refinementQuestions = getQuestionsForDimensions(
      [targetTag],
      'refinement',
      Array.from(this.state.answeredQuestions)
    );
    const available = refinementQuestions.filter((q) => !this.state.answeredQuestions.has(q.id));

    if (available.length === 0) return null;

    const scoredQuestions = available.map((q) => ({
      question: q,
      score: this.calculateRefinementQuestionScore(q, targetTag),
    }));

    scoredQuestions.sort((a, b) => b.score - a.score);
    return scoredQuestions[0]!.question;
  }

  private calculateCoreQuestionScore(question: AssessmentQuestion, counts: TagCoverageVector): number {
    let score = question.informationGain || 0.5;

    for (const tag of ROUTING_WEIGHT_KEYS) {
      const weight = question.dimensionWeights[tag] ?? 0;
      if (weight && weight > 0.3) {
        const count = counts[tag];
        const balanceBonus = Math.max(0, (3 - count) * 0.2);
        score += weight * balanceBonus;
      }
    }

    return score;
  }

  private calculateRefinementQuestionScore(question: AssessmentQuestion, targetTag: RoutingWeightKey): number {
    const targetWeight = question.dimensionWeights[targetTag] ?? 0;
    const informationGain = question.informationGain || 0.4;
    return targetWeight * 2 + informationGain;
  }

  /**
   * Records one answer for the current question. Returns false if this question was already
   * submitted (e.g. double-click) so the UI can ignore the duplicate without treating it as an error.
   */
  submitResponse(response: QuestionResponse): boolean {
    if (!response.questionId || response.questionId.trim().length === 0) {
      throw new Error('Invalid question ID');
    }
    const known = this.questions.some((q) => q.id === response.questionId);
    if (!known) {
      throw new Error('Question not found');
    }
    const v = Number(response.response);
    const qMeta = this.questions.find((q) => q.id === response.questionId);
    const maxLikert = qMeta?.responseScale === 'likert3' ? 3 : 5;
    if (!Number.isInteger(v) || v < 1 || v > maxLikert) {
      throw new Error('Invalid response value');
    }
    if (!(response.timestamp instanceof Date) || Number.isNaN(response.timestamp.getTime())) {
      throw new Error('Invalid timestamp');
    }
    if (!Number.isFinite(response.responseTimeMs) || response.responseTimeMs < 0) {
      throw new Error('Invalid response time');
    }
    if (this.state.answeredQuestions.has(response.questionId)) {
      return false;
    }
    if (!this.state.currentQuestion || this.state.currentQuestion.id !== response.questionId) {
      throw new Error('Invalid response: question mismatch');
    }

    this.state.questionHistory.push(response);
    this.state.answeredQuestions.add(response.questionId);
    this.state.currentQuestion = null;
    if (this.shouldComplete()) {
      this.state.isComplete = true;
    }
    return true;
  }

  private shouldComplete(): boolean {
    const coverage = this.routingCoverage();
    const thresholdStatus = this.coverageModel.meetsResearchThresholds(coverage);

    if (this.state.phase === 'core') {
      const coreQuestionsAnswered = this.getCoreQuestionsAnswered();
      const shouldMoveToRefinement =
        coreQuestionsAnswered >= this.config.maxCoreQuestions ||
        (thresholdStatus.tagsMet.length >= 3 && coreQuestionsAnswered >= 10);

      if (shouldMoveToRefinement) {
        this.state.phase = 'refinement';
        return false;
      }
    }

    if (this.state.phase === 'refinement') {
      if (this.refinementFocusTags) {
        const allFocusedMet = this.refinementFocusTags.every(
          (tag) => coverage[tag] >= this.config.confidenceThreshold
        );
        if (allFocusedMet || this.state.questionHistory.length >= this.totalQuestionHardCap) {
          this.state.phase = 'complete';
          this.state.completionReason = allFocusedMet ? 'confidence_met' : 'max_questions';
          return true;
        }
        return false;
      }

      const refinementQuestionsAnswered = this.getRefinementQuestionsAnswered();
      const shouldComplete =
        thresholdStatus.meetsThreshold ||
        refinementQuestionsAnswered >= this.config.maxRefinementQuestions ||
        this.state.questionHistory.length >= this.totalQuestionHardCap;

      if (shouldComplete) {
        this.state.phase = 'complete';
        this.state.completionReason = thresholdStatus.meetsThreshold ? 'confidence_met' : 'max_questions';
        return true;
      }
    }

    return false;
  }

  private getPrimaryTag(question: AssessmentQuestion): RoutingWeightKey {
    let maxWeight = 0;
    let primary: RoutingWeightKey = ROUTING_WEIGHT_KEYS[0];

    for (const tag of ROUTING_WEIGHT_KEYS) {
      const w = question.dimensionWeights[tag] ?? 0;
      if (w > maxWeight) {
        maxWeight = w;
        primary = tag;
      }
    }
    return primary;
  }

  private getCoreQuestionsAnswered(): number {
    const coreQuestions = getAssessmentQuestions('core', this.state.culturalContext);
    return this.state.questionHistory.filter((response) =>
      coreQuestions.some((q) => q.id === response.questionId)
    ).length;
  }

  private getRefinementQuestionsAnswered(): number {
    const refinementQuestions = getAssessmentQuestions('refinement', this.state.culturalContext);
    return this.state.questionHistory.filter((response) =>
      refinementQuestions.some((q) => q.id === response.questionId)
    ).length;
  }

  reset(): void {
    this.refinementFocusTags = null;
    this.state = this.initializeState(this.state.culturalContext);
  }

  /**
   * Resume after a prior completion: rebuild internal history, enter refinement, and optionally
   * restrict routing to low-confidence dimensions (e.g. from results “Continue assessment”).
   */
  resumeFrom(history: QuestionResponse[], targetDimensions?: CognitiveDimension[]): void {
    const normalized = history.map((row) => ({
      ...row,
      timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(String(row.timestamp)),
    }));
    this.state.answeredQuestions = new Set(normalized.map((r) => r.questionId));
    this.state.questionHistory = normalized;
    this.state.questionPath = normalized.map((r) => r.questionId);
    this.state.phase = 'refinement';
    this.state.completionReason = null;
    this.state.isComplete = false;
    this.state.currentQuestion = null;
    this.refinementFocusTags =
      targetDimensions && targetDimensions.length > 0 ? [...targetDimensions] : null;
  }

  getCompletionStats(): {
    questionsAnswered: number;
    coreQuestionsAnswered: number;
    refinementQuestionsAnswered: number;
    averageTagCoverage: number;
    tagCoverage: TagCoverageVector;
    phase: 'core' | 'refinement' | 'complete';
    completionReason: string | null;
    estimatedQuestionsRemaining: number;
    meetsResearchThresholds: boolean;
  } {
    const tagCoverage = this.routingCoverage();
    const thresholdStatus = this.coverageModel.meetsResearchThresholds(tagCoverage);

    return {
      questionsAnswered: this.state.questionHistory.length,
      coreQuestionsAnswered: this.getCoreQuestionsAnswered(),
      refinementQuestionsAnswered: this.getRefinementQuestionsAnswered(),
      averageTagCoverage: this.coverageModel.averageCoverage(tagCoverage),
      tagCoverage,
      phase: this.state.phase,
      completionReason: this.state.completionReason,
      estimatedQuestionsRemaining: Math.max(
        0,
        this.totalQuestionHardCap - this.state.questionHistory.length
      ),
      meetsResearchThresholds: thresholdStatus.meetsThreshold,
    };
  }

  getAssessmentReport(): {
    sessionId: string;
    duration: number;
    questionPath: string[];
    tagCoverage: TagCoverageVector;
    completionStats: ReturnType<AdaptiveQuestionnaireEngine['getCompletionStats']>;
  } {
    const duration = new Date().getTime() - this.state.startTime.getTime();
    const completionStats = this.getCompletionStats();

    return {
      sessionId: this.generateSessionId(),
      duration,
      questionPath: [...this.state.questionPath],
      tagCoverage: this.routingCoverage(),
      completionStats,
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

