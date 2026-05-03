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
import {
  buildPerDimensionRoutingDiagnostics,
  type PerDimensionRoutingDiagnostics,
} from '@/adaptive/routing-diagnostics';
import {
  buildProfileConfidenceTrace,
  computeProfileAdaptiveSnapshot,
  DEFAULT_PROFILE_ADAPTIVE_CONFIG,
  marginalSessionConfidenceGain,
  profileCoreQuestionBoost,
  profileRefinementQuestionBoost,
  type ProfileAdaptiveConfig,
  type ProfileAdaptiveSnapshot,
} from '@/adaptive/profile-adaptive';
import { ScoringModel, type CognitiveDimension } from '@/scoring';
import { resolveAdaptiveModeResolution } from '@/lib/adaptive-mode-resolution';

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
  completionReason: 'confidence_met' | 'max_questions' | 'user_exit' | 'diminishing_returns' | null;
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
  /**
   * When the refinement phase may stop globally (not focus mode):
   * - `majority_dimensions` — ≥70% of F–V dimensions at/above threshold (default; fewer questions).
   * - `all_dimensions` — every dimension must reach threshold (aligns with strict adaptive specs).
   */
  stoppingRule?: 'majority_dimensions' | 'all_dimensions';
  /**
   * **Required** on the merged runtime config — resolved in the constructor via
   * {@link resolveAdaptiveModeResolution} (env `NEXT_PUBLIC_PCMS_ADAPTIVE_MODE`, optional
   * `NEXT_PUBLIC_PCMS_RESEARCH_MODE`, or explicit constructor override).
   *
   * - `routing_coverage` — selection driven primarily by **scoring-model** `routingCoverage()` (finalConfidence per tag).
   * - `profile_diagnostic` — adds **profile** contradiction/variance boosts and profile stop rules.
   */
  adaptiveMode: 'routing_coverage' | 'profile_diagnostic';
  /** When true (env `NEXT_PUBLIC_PCMS_RESEARCH_MODE`), forces `profile_diagnostic` and UI should disable lossy share flows. */
  researchMode?: boolean;
  /** Overrides for profile mode (merged onto {@link DEFAULT_PROFILE_ADAPTIVE_CONFIG}). */
  profileAdaptive?: Partial<ProfileAdaptiveConfig>;
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
  /** Session confidence after each answer (profile mode); used for diminishing-returns stop. */
  private profileConfidenceTrace: number[] = [];

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
    
    const resolved = resolveAdaptiveModeResolution({
      adaptiveMode: config?.adaptiveMode,
      researchMode: config?.researchMode,
    });
    // Merge default config with provided overrides — `adaptiveMode` / `researchMode` always from resolution.
    this.config = {
      confidenceThreshold: 0.75, // Minimum confidence required for completion
      maxCoreQuestions: 15, // Maximum questions in core phase
      maxRefinementQuestions: 10, // Maximum questions in refinement phase
      maxTotalQuestions: ENGINE_HARD_CAP_TOTAL_QUESTIONS, // Absolute upper limit
      ...config,
      adaptiveMode: resolved.adaptiveMode,
      researchMode: resolved.researchMode,
    };
    
    // Initialize supporting models
    this.coverageModel = new CoverageModel({
      researchConfidenceThreshold: this.config.confidenceThreshold,
      maxQuestionsPerDimension: 5, // Maximum questions per dimension in refinement
      stoppingRule: this.config.stoppingRule === 'all_dimensions' ? 'all' : 'majority',
    });
    this.scoringModel = new ScoringModel();
    
    // Initialize engine state
    this.state = this.initializeState(culturalContext);
  }

  /** Persisted on `StoredPipelineSession` for reproducibility. */
  getAdaptiveMode(): ResearchAssessmentConfig['adaptiveMode'] {
    return this.config.adaptiveMode;
  }

  getResearchMode(): boolean {
    return this.config.researchMode === true;
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

  private isProfileMode(): boolean {
    return this.config.adaptiveMode === 'profile_diagnostic';
  }

  private mergedProfileConfig(): ProfileAdaptiveConfig {
    return { ...DEFAULT_PROFILE_ADAPTIVE_CONFIG, ...this.config.profileAdaptive };
  }

  private getQuestionsById(): Map<string, AssessmentQuestion> {
    return new Map(this.questions.map((q) => [q.id, q]));
  }

  private recordProfileConfidenceTrace(): void {
    if (!this.isProfileMode()) return;
    const snap = computeProfileAdaptiveSnapshot(
      this.state.questionHistory,
      this.getQuestionsById(),
      this.mergedProfileConfig()
    );
    this.profileConfidenceTrace.push(snap.sessionConfidence);
    if (this.profileConfidenceTrace.length > 40) {
      this.profileConfidenceTrace.shift();
    }
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
    const coverage = this.routingCoverage();
    const snap = this.isProfileMode()
      ? computeProfileAdaptiveSnapshot(this.state.questionHistory, this.getQuestionsById(), this.mergedProfileConfig())
      : null;
    const pcfg = this.mergedProfileConfig();
    const blend = pcfg.coreLegacyBlend;

    const scoredQuestions = availableCore.map((q) => {
      const legacy = this.calculateCoreQuestionScore(q, counts, coverage);
      const profileB = snap ? profileCoreQuestionBoost(q, snap, pcfg) : 0;
      const score = snap ? legacy * blend + profileB * (1 - blend) : legacy;
      return { question: q, score };
    });

    scoredQuestions.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.question.id.localeCompare(b.question.id);
    });
    return scoredQuestions[0]!.question;
  }

  private selectRefinementQuestion(): AssessmentQuestion | null {
    const coverage = this.routingCoverage();
    const threshold = this.config.confidenceThreshold;
    const snap = this.isProfileMode()
      ? computeProfileAdaptiveSnapshot(this.state.questionHistory, this.getQuestionsById(), this.mergedProfileConfig())
      : null;
    const pcfg = this.mergedProfileConfig();

    /**
     * When refinement is restricted to {@link refinementFocusTags}, a single “best” tag can still
     * have no unanswered items left. Previously we returned null and the session exited refinement
     * immediately — felt like “Continue assessment” did nothing. Try other low-coverage tags in the
     * pool, then any remaining refinement item.
     */
    if (this.refinementFocusTags && this.refinementFocusTags.length > 0) {
      const pool = this.refinementFocusTags;
      const below = [...pool].filter((t) => coverage[t] < threshold).sort((a, b) => coverage[a] - coverage[b]);
      const tryOrder = below.length > 0 ? below : [...pool].sort((a, b) => coverage[a] - coverage[b]);

      for (const targetTag of tryOrder) {
        const refinementQuestions = getQuestionsForDimensions(
          [targetTag],
          'refinement',
          Array.from(this.state.answeredQuestions)
        );
        const available = refinementQuestions.filter((q) => !this.state.answeredQuestions.has(q.id));
        if (available.length === 0) continue;
        const scoredQuestions = available.map((q) => ({
          question: q,
          score: this.refinementQuestionTotalScore(q, targetTag, snap, pcfg),
        }));
        scoredQuestions.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.question.id.localeCompare(b.question.id);
        });
        return scoredQuestions[0]!.question;
      }

      const refinementQuestions = getAssessmentQuestions('refinement', this.state.culturalContext);
      const available = refinementQuestions.filter((q) => !this.state.answeredQuestions.has(q.id));
      return this.pickBestRefinementQuestion(available, snap, pcfg, null);
    }

    const pool = ROUTING_WEIGHT_KEYS;
    const targetTag = this.coverageModel.getNextTargetTag(coverage, pool);

    if (!targetTag) {
      const refinementQuestions = getAssessmentQuestions('refinement', this.state.culturalContext);
      const available = refinementQuestions.filter((q) => !this.state.answeredQuestions.has(q.id));
      return this.pickBestRefinementQuestion(available, snap, pcfg, null);
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
      score: this.refinementQuestionTotalScore(q, targetTag, snap, pcfg),
    }));

    scoredQuestions.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.question.id.localeCompare(b.question.id);
    });
    return scoredQuestions[0]!.question;
  }

  private refinementQuestionTotalScore(
    question: AssessmentQuestion,
    targetTag: RoutingWeightKey,
    snap: ProfileAdaptiveSnapshot | null,
    pcfg: ProfileAdaptiveConfig
  ): number {
    let score = this.calculateRefinementQuestionScore(question, targetTag);
    if (snap) {
      score += profileRefinementQuestionBoost(question, targetTag, snap, pcfg);
    }
    return score;
  }

  /**
   * Picking the first unanswered refinement item (`available[0]`) is **invalid for research**:
   * order depends on arbitrary bank JSON ordering, not evidence, coverage gaps, or contradiction.
   * Rank every candidate with the same principled components used in core + targeted refinement.
   */
  private pickBestRefinementQuestion(
    available: AssessmentQuestion[],
    snap: ProfileAdaptiveSnapshot | null,
    pcfg: ProfileAdaptiveConfig,
    targetTag: RoutingWeightKey | null
  ): AssessmentQuestion | null {
    if (available.length === 0) return null;
    const counts = this.coverageModel.countQuestionsPerTag(this.state.questionHistory, this.questions);
    const coverage = this.routingCoverage();
    const scored = available.map((q) => {
      let score = this.calculateCoreQuestionScore(q, counts, coverage);
      const prim = this.getPrimaryTag(q);
      const tag = targetTag ?? prim;
      score += this.calculateRefinementQuestionScore(q, tag);
      if (snap) {
        if (targetTag) {
          score += profileRefinementQuestionBoost(q, targetTag, snap, pcfg);
        } else {
          let maxB = 0;
          for (const t of ROUTING_WEIGHT_KEYS) {
            if ((q.dimensionWeights[t] ?? 0) >= 0.25) {
              maxB = Math.max(maxB, profileRefinementQuestionBoost(q, t, snap, pcfg));
            }
          }
          score += maxB;
        }
      }
      return { question: q, score };
    });
    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.question.id.localeCompare(b.question.id)));
    return scored[0]!.question;
  }

  /**
   * Core-phase score: information gain + balance (under-covered tags) + uncertainty reduction
   * (favour items that load on dimensions with low current confidence).
   */
  private calculateCoreQuestionScore(
    question: AssessmentQuestion,
    counts: TagCoverageVector,
    coverage: TagCoverageVector
  ): number {
    let score = question.informationGain || 0.5;
    const threshold = this.config.confidenceThreshold;

    for (const tag of ROUTING_WEIGHT_KEYS) {
      const weight = question.dimensionWeights[tag] ?? 0;
      if (weight && weight > 0.3) {
        const count = counts[tag];
        const balanceBonus = Math.max(0, (3 - count) * 0.2);
        score += weight * balanceBonus;
        const confidenceGap = Math.max(0, threshold - coverage[tag]);
        score += weight * confidenceGap * 0.35;
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
    this.recordProfileConfidenceTrace();
    if (this.shouldComplete()) {
      this.state.isComplete = true;
    }
    return true;
  }

  private shouldComplete(): boolean {
    const coverage = this.routingCoverage();
    const threshold = this.config.confidenceThreshold;

    if (
      this.state.phase === 'core' &&
      this.state.questionHistory.length > 0 &&
      ROUTING_WEIGHT_KEYS.every((k) => coverage[k] >= threshold)
    ) {
      this.state.phase = 'complete';
      this.state.completionReason = 'confidence_met';
      return true;
    }

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

    if (
      this.isProfileMode() &&
      this.state.phase === 'refinement' &&
      this.state.questionHistory.length > 0
    ) {
      const pcfg = this.mergedProfileConfig();
      const n = this.state.questionHistory.length;
      if (n >= pcfg.minTotalAnswersForProfileStop) {
        const snap = computeProfileAdaptiveSnapshot(this.state.questionHistory, this.getQuestionsById(), pcfg);
        if (snap.sessionConfidence >= pcfg.sessionConfidenceThreshold) {
          this.state.phase = 'complete';
          this.state.completionReason = 'confidence_met';
          return true;
        }
        const gain = marginalSessionConfidenceGain(this.profileConfidenceTrace, pcfg.diminishingReturnsWindow);
        if (gain !== null && gain < pcfg.diminishingReturnsEpsilon) {
          this.state.phase = 'complete';
          this.state.completionReason = 'diminishing_returns';
          return true;
        }
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
    this.profileConfidenceTrace = [];
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
    if (this.isProfileMode()) {
      this.profileConfidenceTrace = buildProfileConfidenceTrace(
        normalized,
        this.getQuestionsById(),
        this.mergedProfileConfig()
      );
    } else {
      this.profileConfidenceTrace = [];
    }
  }

  getCompletionStats(): {
    questionsAnswered: number;
    coreQuestionsAnswered: number;
    refinementQuestionsAnswered: number;
    averageTagCoverage: number;
    tagCoverage: TagCoverageVector;
    /** Per F–V dimension: mean, variance of weighted contributions, confidence (offline, deterministic). */
    perDimensionRouting: Record<RoutingWeightKey, PerDimensionRoutingDiagnostics>;
    /** Present when {@link ResearchAssessmentConfig.adaptiveMode} is `profile_diagnostic`. */
    profileAdaptive: ProfileAdaptiveSnapshot | null;
    phase: 'core' | 'refinement' | 'complete';
    completionReason: string | null;
    estimatedQuestionsRemaining: number;
    meetsResearchThresholds: boolean;
  } {
    const tagCoverage = this.routingCoverage();
    const thresholdStatus = this.coverageModel.meetsResearchThresholds(tagCoverage);
    const questionsById = new Map(this.questions.map((q) => [q.id, q]));
    const perDimensionRouting = buildPerDimensionRoutingDiagnostics(this.state.questionHistory, questionsById);
    const profileAdaptive = this.isProfileMode()
      ? computeProfileAdaptiveSnapshot(this.state.questionHistory, questionsById, this.mergedProfileConfig())
      : null;

    return {
      questionsAnswered: this.state.questionHistory.length,
      coreQuestionsAnswered: this.getCoreQuestionsAnswered(),
      refinementQuestionsAnswered: this.getRefinementQuestionsAnswered(),
      averageTagCoverage: this.coverageModel.averageCoverage(tagCoverage),
      tagCoverage,
      perDimensionRouting,
      profileAdaptive,
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

