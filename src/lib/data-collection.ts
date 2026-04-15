import { getSupabaseClient, DatabaseProfile, DatabaseQuestionResponse, DatabaseSession, generateSessionId, getUserAgent, isSupabaseConfigured } from './supabase';
import { assessmentDimensionWeightsToDbJson } from './supabase-mappers';
import { QuestionResponse } from '@/data/questions';
import { validateAssessmentVersion, AssessmentTracker } from './assessment-versioning';
import type { StoredPipelineSession } from '@/types/pipeline-session';
import type { Json } from '@/types/database.types';
import { readAssessmentContextFromStorage } from '@/types/assessment-context';
import { appendOfflineResponseRow, attachOfflineCompletion, questionResponsesToOfflineRows } from '@/lib/offline-storage';
import { getQuestionBankSync } from '@/data/question-bank-state';

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
    await this.createOrUpdateSession();
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
      user_agent: getUserAgent(),
      completion_status: 'in_progress'
    };

    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping session creation');
      return;
    }

    const client = getSupabaseClient();
    if (!client) return;

    const { error } = await client
      .from('sessions')
      .upsert(sessionData, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Error creating/updating session:', error);
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
      console.warn('Supabase not configured, skipping database recording');
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
      return;
    }

    const { error } = await client.from('question_responses').insert(responseData);

    if (error) {
      console.error('Error recording question response:', error);
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
    }
  }

  async saveFinalPipeline(
    stored: StoredPipelineSession,
    questionHistory: QuestionResponse[],
    completionStatus: 'confidence_met' | 'max_questions' | 'user_exit' = 'user_exit'
  ) {
    if (!this.sessionId || !this.startTime) return;

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
      completion_status: completionStatus,
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
          console.warn('Supabase not configured, skipping profile database save');
          remoteOk = false;
        } else if (remoteOk) {
          const { error: profileError } = await client.from('profiles').insert(profileData);
          if (profileError) {
            console.error('Error saving profile:', profileError);
            remoteOk = false;
          }
        }

        if (remoteOk) {
          const sessionClient = getSupabaseClient();
          if (sessionClient) {
            const { error: sessionError } = await sessionClient
              .from('sessions')
              .update({
                completed_at: new Date().toISOString(),
                completion_status: completionStatus,
                assessment_version: this.assessmentVersion,
                question_path: this.questionPath,
                duration_ms: durationMs,
              })
              .eq('id', this.sessionId);

            if (sessionError) {
              console.error('Error updating session:', sessionError);
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
          console.error('Failed to queue offline completion:', e);
        }
      }
    } else {
      console.warn('Supabase not configured, skipping database operations');
      // Store research data locally as fallback
      localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
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
      console.warn('Supabase not configured, storing research data locally');
      localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
      return true;
    }

    try {
      const client = getSupabaseClient();
      if (!client) {
        console.warn('Supabase not configured, storing research data locally');
        localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
        return false;
      }

      const { error } = await client.from('research_assessments').insert(researchData);

      if (error) {
        console.error('Error saving research data:', error);
        localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to save research data:', error);
      localStorage.setItem(`pcms-research-${this.sessionId}`, JSON.stringify(researchData));
      return false;
    }
  }

  async recordAbandonment() {
    if (!this.sessionId) return;

    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase not configured, skipping abandonment recording');
      return;
    }

    const { error } = await client
      .from('sessions')
      .update({ 
        completion_status: 'abandoned'
      })
      .eq('id', this.sessionId);

    if (error) {
      console.error('Error recording abandonment:', error);
    }
  }

  // For research analytics
  async getResearchStats() {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase not configured, returning mock stats');
      return {
        totalProfiles: 0,
        averageCompletionTime: 0,
        totalResponses: 0
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
      console.error('Error fetching research stats:', countError || timeError || responseCountError);
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
      totalResponses: responseCount ?? 0
    };
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
