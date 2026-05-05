import { getSupabaseClient, DatabaseProfile, DatabaseQuestionResponse, DatabaseSession, generateSessionId, isSupabaseConfigured } from './supabase';
import { assessmentDimensionWeightsToDbJson } from './supabase-mappers';
import { QuestionResponse } from '@/data/questions';
import { validateAssessmentVersion, AssessmentTracker } from './assessment-versioning';
import type { StoredPipelineSession } from '@/types/pipeline-session';
import type { Json } from '@/types/database.types';
import { readAssessmentContextFromStorage } from '@/types/assessment-context';
import { appendOfflineResponseRow, attachOfflineCompletion, questionResponsesToOfflineRows } from '@/lib/offline-storage';
import { getQuestionBankSync } from '@/data/question-bank-state';
import { recordCloudSyncAttempt } from '@/lib/cloud-sync-telemetry';
import { toPipelineSessionRow } from '@/lib/pipeline-session-db';

function logSupabaseFailure(context: string, err: unknown): void {
  if (process.env.NODE_ENV !== 'development') return;
  console.warn(`[PCMS data-collection] ${context}`, err);
}

// RESEARCH-GRADE: Enhanced data structure for research integrity
export interface ResearchAssessmentData {
  session_id: string;
  assessment_version: string;
  timestamp: string;
  duration_ms: number;
  question_path: string[];
  responses: {
    question_id: string;
    response: number;
    response_time_ms: number;
    timestamp: string;
  }[];
  /** Pipeline v2 payload (StoredPipelineSession) or legacy JSON — stored as Json in Postgres. */
  final_profile: Json;
  completion_status: 'confidence_met' | 'max_questions' | 'user_exit';
  cultural_context: 'western' | 'ghana' | 'universal';
}

export class DataCollectionService {
  private sessionId: string | null = null;
  private startTime: Date | null = null;
  private questionPath: string[] = [];
  private assessmentVersion: string = "v1.0"; // RESEARCH-GRADE: Version tracking
  private responses: {
    question_id: string;
    response: number;
    response_time_ms: number;
    timestamp: string;
  }[] = [];
  private assessmentTracker: AssessmentTracker; // RESEARCH-GRADE: Version tracking

  constructor() {
    this.assessmentTracker = new AssessmentTracker(this.assessmentVersion);
    this.initializeSession();
  }

  private async initializeSession() {
    // Check for existing session
    const existingSessionId = localStorage.getItem('pcms-session-id');
    if (existingSessionId) {
      this.sessionId = existingSessionId;
    } else {
      this.sessionId = generateSessionId();
      localStorage.setItem('pcms-session-id', this.sessionId);
    }

    this.startTime = new Date();
    try {
      await this.createOrUpdateSession();
    } catch (err) {
      logSupabaseFailure('initializeSession', err);
    }
  }

  private async createOrUpdateSession() {
    if (!this.sessionId) return;

    const consentTimestamp = localStorage.getItem('pcms-consent-timestamp');
    if (!consentTimestamp) return;

    const culturalContext = readAssessmentContextFromStorage()?.culturalContext ?? 'universal';
    const sessionData: Partial<DatabaseSession> = {
      id: this.sessionId,
      consent_timestamp: consentTimestamp,
      cultural_context: culturalContext,
      completion_status: 'in_progress',
    };

    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PCMS data-collection] Supabase not configured, skipping session creation');
      }
      return;
    }

    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client
        .from('sessions')
        .upsert(sessionData, { onConflict: 'id' })
        .select();

      if (error) {
        logSupabaseFailure('createOrUpdateSession/upsert', error);
        recordCloudSyncAttempt('session_upsert', false);
      } else {
        recordCloudSyncAttempt('session_upsert', true);
      }
    } catch (err) {
      logSupabaseFailure('createOrUpdateSession', err);
      recordCloudSyncAttempt('session_upsert', false);
    }
  }

  async recordQuestionResponse(response: QuestionResponse, questionCategory: string, dimensionWeights: Record<string, number>) {
    if (!this.sessionId) return;

    // RESEARCH-GRADE: Track question path and structured responses
    this.questionPath.push(response.questionId);
    this.responses.push({
      question_id: response.questionId,
      response: response.response,
      response_time_ms: response.responseTimeMs,
      timestamp: response.timestamp.toISOString()
    });

    // RESEARCH-GRADE: Add tracking checkpoint
    this.assessmentTracker.addCheckpoint('question_answered', {
      questionId: response.questionId,
      responseTime: response.responseTimeMs
    });

    // Only attempt database operations if Supabase is configured
    const client = getSupabaseClient();
    const offlineNow = typeof navigator !== 'undefined' && navigator.onLine === false;
    const culturalContext = readAssessmentContextFromStorage()?.culturalContext ?? 'universal';

    if (!client) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PCMS data-collection] Supabase not configured, skipping database recording');
      }
      return;
    }

    const responseData: Omit<DatabaseQuestionResponse, 'id' | 'created_at'> = {
      session_id: this.sessionId,
      question_id: response.questionId,
      response: response.response,
      response_time_ms: response.responseTimeMs,
      question_category: questionCategory,
      dimension_weights: assessmentDimensionWeightsToDbJson(dimensionWeights)
    };

    if (offlineNow) {
      await appendOfflineResponseRow(
        this.sessionId,
        {
          questionId: response.questionId,
          response: response.response,
          responseTimeMs: response.responseTimeMs,
          timestamp: response.timestamp.toISOString(),
          questionCategory,
          dimensionWeights,
        },
        { culturalContext }
      );
      recordCloudSyncAttempt('question_response_offline', false);
      return;
    }

    try {
      const { error } = await client.from('question_responses').insert(responseData);

      if (error) {
        logSupabaseFailure('recordQuestionResponse/insert', error);
        recordCloudSyncAttempt('question_response', false);
        await appendOfflineResponseRow(
          this.sessionId,
          {
            questionId: response.questionId,
            response: response.response,
            responseTimeMs: response.responseTimeMs,
            timestamp: response.timestamp.toISOString(),
            questionCategory,
            dimensionWeights,
          },
          { culturalContext }
        );
      } else {
        recordCloudSyncAttempt('question_response', true);
      }
    } catch (err) {
      logSupabaseFailure('recordQuestionResponse', err);
      recordCloudSyncAttempt('question_response', false);
      try {
        await appendOfflineResponseRow(
          this.sessionId,
          {
            questionId: response.questionId,
            response: response.response,
            responseTimeMs: response.responseTimeMs,
            timestamp: response.timestamp.toISOString(),
            questionCategory,
            dimensionWeights,
          },
          { culturalContext }
        );
      } catch (queueErr) {
        logSupabaseFailure('recordQuestionResponse/offline_queue', queueErr);
      }
    }
  }

  async saveFinalPipeline(
    stored: StoredPipelineSession,
    questionHistory: QuestionResponse[],
    completionStatus:
      | 'confidence_met'
      | 'max_questions'
      | 'user_exit'
      | 'diminishing_returns' = 'user_exit'
  ) {
    if (!this.sessionId || !this.startTime) return;

    /** `diminishing_returns` is stored as `confidence_met` for Postgres CHECK constraints; localStorage keeps the semantic reason. */
    const completionForRemote: 'confidence_met' | 'max_questions' | 'user_exit' =
      completionStatus === 'diminishing_returns' ? 'confidence_met' : completionStatus;

    this.assessmentTracker.addCheckpoint('assessment_completed', {
      completionStatus,
      totalQuestions: this.questionPath.length,
      pipelineVersion: stored.version,
      responseCount: stored.responseCount,
    });

    const durationMs = new Date().getTime() - this.startTime.getTime();

    const culturalContext = readAssessmentContextFromStorage()?.culturalContext ?? 'universal';
    const researchData: ResearchAssessmentData = {
      session_id: this.sessionId,
      assessment_version: this.assessmentVersion,
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      question_path: [...this.questionPath],
      responses: [...this.responses],
      final_profile: stored as unknown as Json,
      completion_status: completionForRemote,
      cultural_context: culturalContext
    };

    // RESEARCH-GRADE: Validate data structure before saving
    const validation = validateAssessmentVersion(researchData);
    if (!validation.isValid) {
      console.error('Assessment data validation failed:', validation.errors);
      // Still save but with warnings
    }

    const consentTs = localStorage.getItem('pcms-consent-timestamp') || '';
    const online = typeof navigator === 'undefined' || navigator.onLine;

    let remoteOk = true;

    // Only attempt database operations if Supabase is configured
    if (isSupabaseConfigured()) {
      if (!online) {
        remoteOk = false;
      } else {
        const researchOk = await this.saveResearchData(researchData);
        remoteOk = researchOk;

        const completionTimeSeconds = Math.round(durationMs / 1000);
        const profileData: Omit<DatabaseProfile, 'id' | 'created_at'> = {
          session_id: this.sessionId,
          cognitive_vector: stored as unknown as Json,
          confidence_vector: {
            interpretationConfidence: stored.publicProfile.confidence,
            embeddingConfidence: stored.embedding.confidence,
            highlights: stored.featureHighlights,
          } as unknown as Json,
          response_count: stored.responseCount,
          completion_time_seconds: completionTimeSeconds,
          cultural_context: culturalContext,
          consent_timestamp: consentTs,
        };

        const client = getSupabaseClient();
        if (!client) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[PCMS data-collection] Supabase not configured, skipping profile database save');
          }
          remoteOk = false;
        } else if (remoteOk) {
          try {
            const { error: profileError } = await client.from('profiles').insert(profileData);
            if (profileError) {
              logSupabaseFailure('saveFinalPipeline/profiles.insert', profileError);
              remoteOk = false;
            }
          } catch (err) {
            logSupabaseFailure('saveFinalPipeline/profiles.insert', err);
            remoteOk = false;
          }

          if (remoteOk) {
            try {
              const pipelineRow = toPipelineSessionRow(this.sessionId, this.assessmentVersion, stored);
              const { error: pipelineError } = await client
                .from('pipeline_sessions')
                .upsert(pipelineRow, { onConflict: 'session_id' });
              if (pipelineError) {
                logSupabaseFailure('saveFinalPipeline/pipeline_sessions.upsert', pipelineError);
                remoteOk = false;
              }
            } catch (err) {
              logSupabaseFailure('saveFinalPipeline/pipeline_sessions.upsert', err);
              remoteOk = false;
            }
          }
        }

        if (remoteOk) {
          const sessionClient = getSupabaseClient();
          if (sessionClient) {
            try {
              const { error: sessionError } = await sessionClient
                .from('sessions')
                .update({
                  completed_at: new Date().toISOString(),
                  completion_status: completionForRemote,
                  assessment_version: this.assessmentVersion,
                  question_path: this.questionPath,
                  duration_ms: durationMs,
                })
                .eq('id', this.sessionId);

              if (sessionError) {
                logSupabaseFailure('saveFinalPipeline/sessions.update', sessionError);
                remoteOk = false;
              }
            } catch (err) {
              logSupabaseFailure('saveFinalPipeline/sessions.update', err);
              remoteOk = false;
            }
          }
        }
      }

      if (!remoteOk) {
        try {
          const bank = getQuestionBankSync();
          const byId = new Map(bank.map((q) => [q.id, q]));
          const responseRows = questionResponsesToOfflineRows(questionHistory, (id) => {
            const q = byId.get(id);
            return q
              ? { category: q.category || 'general', dimensionWeights: q.dimensionWeights as Record<string, number> }
              : null;
          });
          await attachOfflineCompletion(this.sessionId, {
            profile: stored,
            research: researchData,
            completionTimeSeconds: Math.round(durationMs / 1000),
            completionStatus,
            consentTimestamp: consentTs,
            responseRows,
          });
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[PCMS data-collection] Failed to queue offline completion', e);
          }
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PCMS data-collection] Supabase not configured, skipping database operations');
      }
      // Store research data locally as fallback
      localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
    }

    if (isSupabaseConfigured()) {
      recordCloudSyncAttempt('assessment_complete', remoteOk);
    }

    localStorage.removeItem('pcms-question-history');
    localStorage.removeItem('pcms-session-id');

    this.questionPath = [];
    this.responses = [];
    this.sessionId = null;
    this.startTime = null;
    this.assessmentTracker = new AssessmentTracker(this.assessmentVersion);
    await this.initializeSession();
  }

  // RESEARCH-GRADE: Save structured research data
  /** @returns false when Supabase insert failed (caller should queue offline sync). */
  private async saveResearchData(researchData: ResearchAssessmentData): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PCMS data-collection] Supabase not configured, storing research data locally');
      }
      localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
      return true;
    }

    try {
      const client = getSupabaseClient();
      if (!client) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PCMS data-collection] Supabase not configured, storing research data locally');
        }
        localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
        return false;
      }

      const { error } = await client.from('research_assessments').insert(researchData);

      if (error) {
        logSupabaseFailure('saveResearchData/insert', error);
        localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
        return false;
      }
      return true;
    } catch (error) {
      logSupabaseFailure('saveResearchData', error);
      localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
      return false;
    }
  }

  async recordAbandonment() {
    if (!this.sessionId) return;

    const client = getSupabaseClient();
    if (!client) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PCMS data-collection] Supabase not configured, skipping abandonment recording');
      }
      return;
    }

    try {
      const { error } = await client
        .from('sessions')
        .update({
          completion_status: 'abandoned',
        })
        .eq('id', this.sessionId);

      if (error) {
        logSupabaseFailure('recordAbandonment/update', error);
      }
    } catch (err) {
      logSupabaseFailure('recordAbandonment', err);
    }
  }

  // For research analytics
  async getResearchStats() {
    try {
      const client = getSupabaseClient();
      if (!client) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PCMS data-collection] Supabase not configured, returning mock stats');
        }
        return {
          totalProfiles: 0,
          averageCompletionTime: 0,
          totalResponses: 0,
        };
      }

      const { count: profileCount, error: countError } = await client
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const { count: responseCount, error: responseCountError } = await client
        .from('question_responses')
        .select('id', { count: 'exact', head: true });

      const { data: avgCompletionTime, error: timeError } = await client
        .from('profiles')
        .select('completion_time_seconds');

      if (countError || timeError || responseCountError) {
        logSupabaseFailure(
          'getResearchStats/query',
          countError || timeError || responseCountError
        );
        return null;
      }

      type ProfileTimeRow = { completion_time_seconds: number | null };

      const rows = (avgCompletionTime ?? []) as ProfileTimeRow[];
      const avgTime =
        rows.length > 0
          ? rows.reduce((sum, p) => sum + (p.completion_time_seconds ?? 0), 0) / rows.length
          : 0;

      return {
        totalProfiles: profileCount ?? 0,
        averageCompletionTime: Math.round(avgTime),
        totalResponses: responseCount ?? 0,
      };
    } catch (err) {
      logSupabaseFailure('getResearchStats', err);
      return null;
    }
  }

  // RESEARCH-GRADE: Get current assessment data for research purposes
  getCurrentAssessmentData(): Partial<ResearchAssessmentData> | null {
    if (!this.sessionId || !this.startTime) return null;

    const currentDuration = new Date().getTime() - this.startTime.getTime();

    const culturalContext = readAssessmentContextFromStorage()?.culturalContext ?? 'universal';
    return {
      session_id: this.sessionId,
      assessment_version: this.assessmentVersion,
      timestamp: new Date().toISOString(),
      duration_ms: currentDuration,
      question_path: [...this.questionPath],
      responses: [...this.responses],
      cultural_context: culturalContext
    };
  }

  // RESEARCH-GRADE: Get assessment version
  getAssessmentVersion(): string {
    return this.assessmentVersion;
  }

  // RESEARCH-GRADE: Set assessment version (for future upgrades)
  setAssessmentVersion(version: string): void {
    this.assessmentVersion = version;
    this.assessmentTracker = new AssessmentTracker(version);
  }

  // RESEARCH-GRADE: Get assessment tracking data
  getAssessmentTrackingData(): ReturnType<AssessmentTracker['generateTrackingData']> {
    return this.assessmentTracker.generateTrackingData();
  }

  // RESEARCH-GRADE: Validate current assessment data
  validateCurrentAssessmentData(): ReturnType<typeof validateAssessmentVersion> {
    const currentData = this.getCurrentAssessmentData();
    if (!currentData) {
      return {
        isValid: false,
        version: 'unknown',
        errors: ['No assessment data available'],
        warnings: []
      };
    }
    return validateAssessmentVersion(currentData);
  }

  // Handle page visibility changes for abandonment tracking
  setupAbandonmentTracking() {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is leaving the page
        const consent = localStorage.getItem('pcms-consent-timestamp');
        const hasProfile = localStorage.getItem('pcms-pipeline-result');
        
        if (consent && !hasProfile) {
          // User consented but didn't complete
          this.recordAbandonment();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle page unload
    window.addEventListener('beforeunload', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleVisibilityChange);
    };
  }
}

// Singleton instance
export const dataCollectionService = new DataCollectionService();
