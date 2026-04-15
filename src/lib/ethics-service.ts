import { getSupabaseClient } from './supabase';
import type { Json } from '@/types/database.types';

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

export interface ConsentRecord {
  version: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  ageConfirmation: boolean;
  voluntaryParticipation: boolean;
  dataUseAgreement: boolean;
  withdrawalInformation: string;
}

export interface DataSubjectRequest {
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  sessionIdentifier?: string;
  contactEmail?: string;
  requestDetails: string;
}

export interface EthicsConfig {
  minimumAge: number;
  consentVersion: string;
  dataRetentionMonths: number;
  automaticAnonymization: boolean;
  requireExplicitConsent: boolean;
  allowDataWithdrawal: boolean;
}

export class EthicsService {
  private config: EthicsConfig;

  constructor(config: Partial<EthicsConfig> = {}) {
    this.config = {
      minimumAge: 18,
      consentVersion: 'v1.0',
      dataRetentionMonths: 60, // 5 years for research data
      automaticAnonymization: true,
      requireExplicitConsent: true,
      allowDataWithdrawal: true,
      ...config
    };
  }

  /**
   * Records informed consent with full audit trail
   */
  async recordConsent(consentData: ConsentRecord): Promise<{ success: boolean; recordId?: string; error?: string }> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.warn('Database not available, storing consent locally');
        localStorage.setItem('pcms-consent-record', JSON.stringify(consentData));
        return { success: true };
      }

      // Hash IP for privacy but maintain verification capability
      const ipHash = await this.hashString(consentData.ipAddress);
      
      const { data, error } = await client
        .from('data_processing_records')
        .insert({
          session_id: localStorage.getItem('pcms-session-id'),
          processing_purpose: 'cognitive_assessment',
          legal_basis: 'consent',
          data_categories: ['cognitive_profile', 'assessment_responses', 'timing_data'],
          retention_period_months: this.config.dataRetentionMonths
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error recording consent:', error);
        return { success: false, error: error.message };
      }

      // Store detailed consent record locally for backup
      localStorage.setItem('pcms-consent-record', JSON.stringify({
        ...consentData,
        processingRecordId: data.id,
        ipHash
      }));

      return { success: true, recordId: data.id };
    } catch (error) {
      console.error('Unexpected error recording consent:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Validates consent before proceeding with assessment
   */
  validateConsent(): { valid: boolean; issues: string[] } {
    const consentRecord = localStorage.getItem('pcms-consent-record');
    const issues: string[] = [];

    if (!consentRecord) {
      issues.push('No consent record found');
      return { valid: false, issues };
    }

    try {
      const consent = JSON.parse(consentRecord);
      
      // Check consent version
      if (consent.version !== this.config.consentVersion) {
        issues.push('Consent version mismatch');
      }

      // Check required fields
      if (!consent.ageConfirmation) {
        issues.push('Age confirmation missing');
      }

      if (!consent.voluntaryParticipation) {
        issues.push('Voluntary participation confirmation missing');
      }

      if (!consent.dataUseAgreement) {
        issues.push('Data use agreement confirmation missing');
      }

      // Check consent age (should be recent for validity)
      const consentAge = Date.now() - new Date(consent.timestamp).getTime();
      const maxConsentAge = 24 * 60 * 60 * 1000; // 24 hours
      if (consentAge > maxConsentAge) {
        issues.push('Consent has expired');
      }

      return { valid: issues.length === 0, issues };
    } catch {
      issues.push('Invalid consent record format');
      return { valid: false, issues };
    }
  }

  /**
   * Handles data subject access requests (GDPR Article 15)
   */
  async handleDataAccessRequest(request: DataSubjectRequest): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { success: false, error: 'Database not available' };
      }

      // Log the request
      const { data: requestRecord, error: requestError } = await client
        .from('data_subject_requests')
        .insert({
          request_type: request.type,
          session_identifier: request.sessionIdentifier,
          request_data: toJson(request),
          request_status: 'processing'
        })
        .select('id')
        .single();

      if (requestError) {
        return { success: false, error: requestError.message };
      }

      // Retrieve user data
      let userData = null;
      if (request.sessionIdentifier) {
        userData = await this.retrieveUserData(request.sessionIdentifier);
      }

      // Update request record
      await client
        .from('data_subject_requests')
        .update({
          request_status: 'completed',
          response_data: userData ? toJson(userData) : null,
          processed_at: new Date().toISOString(),
          processed_by: 'automated_system'
        })
        .eq('id', requestRecord.id);

      return { success: true, data: userData };
    } catch (error) {
      console.error('Error handling data access request:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Handles data erasure requests (GDPR Article 17 - Right to be forgotten)
   */
  async handleDataErasureRequest(request: DataSubjectRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { success: false, error: 'Database not available' };
      }

      // Log the request
      const { data: requestRecord, error: requestError } = await client
        .from('data_subject_requests')
        .insert({
          request_type: request.type,
          session_identifier: request.sessionIdentifier,
          request_data: toJson(request),
          request_status: 'processing'
        })
        .select('id')
        .single();

      if (requestError) {
        return { success: false, error: requestError.message };
      }

      // Find and delete user data
      if (request.sessionIdentifier) {
        const sessionId = await this.findSessionByIdentifier(request.sessionIdentifier);
        if (sessionId) {
          // Delete in order of dependencies
          await client.from('research_assessments').delete().eq('session_id', sessionId);
          await client.from('question_responses').delete().eq('session_id', sessionId);
          await client.from('profiles').delete().eq('session_id', sessionId);
          await client.from('sessions').delete().eq('id', sessionId);
        }
      }

      // Update request record
      await client
        .from('data_subject_requests')
        .update({
          request_status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: 'automated_system'
        })
        .eq('id', requestRecord.id);

      return { success: true };
    } catch (error) {
      console.error('Error handling data erasure request:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Generates data portability package (GDPR Article 20)
   */
  async generateDataPortabilityPackage(sessionIdentifier: string): Promise<{ success: boolean; package?: Record<string, unknown>; error?: string }> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { success: false, error: 'Database not available' };
      }

      const sessionId = await this.findSessionByIdentifier(sessionIdentifier);
      if (!sessionId) {
        return { success: false, error: 'Session not found' };
      }

      // Collect all user data
      const [session, profile, responses, assessment] = await Promise.all([
        client.from('sessions').select('*').eq('id', sessionId).single(),
        client.from('profiles').select('*').eq('session_id', sessionId).single(),
        client.from('question_responses').select('*').eq('session_id', sessionId),
        client.from('research_assessments').select('*').eq('session_id', sessionId).single()
      ]);

      const portabilityPackage = {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        dataController: 'PCMS Research Team',
        purpose: 'Data portability request under GDPR Article 20',
        sessionData: session.data,
        profileData: profile.data,
        responseData: responses.data,
        assessmentData: assessment.data,
        metadata: {
          totalResponses: responses.data?.length || 0,
          assessmentCompleted: !!profile.data,
          dataRetentionPeriod: this.config.dataRetentionMonths,
          applicableRights: ['access', 'rectification', 'erasure', 'portability', 'restriction']
        }
      };

      return { success: true, package: portabilityPackage };
    } catch (error) {
      console.error('Error generating portability package:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Checks if data should be automatically anonymized
   */
  shouldAnonymizeData(sessionData: Record<string, unknown>): boolean {
    if (!this.config.automaticAnonymization) {
      return false;
    }

    // Check if retention period has passed
    const retentionUntil = sessionData.data_retention_until;
    if (typeof retentionUntil === 'string') {
      return new Date() > new Date(retentionUntil);
    }

    // Check session age
    const createdAt = sessionData.created_at;
    if (typeof createdAt !== 'string') return false;
    const sessionAge = Date.now() - new Date(createdAt).getTime();
    const retentionMs = this.config.dataRetentionMonths * 30 * 24 * 60 * 60 * 1000;
    return sessionAge > retentionMs;
  }

  /**
   * Anonymizes session data while preserving research value
   */
  async anonymizeSessionData(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { success: false, error: 'Database not available' };
      }

      // Replace identifying information with hashes
      const anonymizedData = {
        session_identifier: `anon_${await this.hashString(sessionId)}`,
        ip_hash: null, // Remove IP hash after anonymization
        user_agent: 'anonymized',
        consent_ip_hash: null
      };

      const { error } = await client
        .from('sessions')
        .update(anonymizedData)
        .eq('id', sessionId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Log anonymization
      await client
        .from('audit_log')
        .insert({
          table_name: 'sessions',
          operation: 'UPDATE',
          record_id: sessionId,
          new_values: toJson(anonymizedData),
          change_reason: 'Automatic GDPR anonymization'
        });

      return { success: true };
    } catch (error) {
      console.error('Error anonymizing session data:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Generates ethical compliance report
   */
  async generateComplianceReport(): Promise<Record<string, unknown>> {
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { error: 'Database not available' };
      }

      const [
        totalSessions,
        pendingRequests,
        expiredData,
        recentConsents
      ] = await Promise.all([
        client.from('sessions').select('id', { count: 'exact' }),
        client.from('data_subject_requests').select('id', { count: 'exact' }).eq('request_status', 'pending'),
        client.from('sessions').select('id', { count: 'exact' }).lt('data_retention_until', new Date().toISOString()),
        client.from('sessions').select('id', { count: 'exact' }).gt('consent_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        reportDate: new Date().toISOString(),
        complianceFramework: 'GDPR',
        dataRetention: {
          totalSessions: totalSessions.count || 0,
          expiredSessions: expiredData.count || 0,
          retentionPeriodMonths: this.config.dataRetentionMonths
        },
        consent: {
          recentConsents24h: recentConsents.count || 0,
          consentVersion: this.config.consentVersion,
          explicitConsentRequired: this.config.requireExplicitConsent
        },
        dataSubjectRequests: {
          pendingRequests: pendingRequests.count || 0,
          withdrawalAllowed: this.config.allowDataWithdrawal
        },
        automatedProcesses: {
          anonymizationEnabled: this.config.automaticAnonymization,
          auditLogging: true,
          dataMinimization: true
        }
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return { error: 'Unexpected error occurred' };
    }
  }

  // Helper methods
  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async findSessionByIdentifier(identifier: string): Promise<string | null> {
    try {
      const client = getSupabaseClient();
      if (!client) return null;

      const { data } = await client
        .from('sessions')
        .select('id')
        .eq('session_identifier', identifier)
        .single();

      return data?.id || null;
    } catch (error) {
      console.error('Error finding session:', error);
      return null;
    }
  }

  private async retrieveUserData(sessionIdentifier: string): Promise<Record<string, unknown> | null> {
    try {
      const client = getSupabaseClient();
      if (!client) return null;

      const sessionId = await this.findSessionByIdentifier(sessionIdentifier);
      if (!sessionId) return null;

      const [session, profile, responses] = await Promise.all([
        client.from('sessions').select('*').eq('id', sessionId).single(),
        client.from('profiles').select('*').eq('session_id', sessionId).single(),
        client.from('question_responses').select('*').eq('session_id', sessionId)
      ]);

      return {
        session: session.data,
        profile: profile.data,
        responses: responses.data
      };
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }
}

// Singleton instance
export const ethicsService = new EthicsService();
