/**
 * Supabase schema typing for the PCMS Postgres layout (see supabase-schema.sql).
 * Regenerate from Supabase CLI when the schema evolves: `supabase gen types typescript`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          started_at: string;
          completed_at: string | null;
          cultural_context: string;
          user_agent: string | null;
          ip_hash: string | null;
          consent_timestamp: string;
          completion_status: string;
          assessment_version: string;
          question_path: string[] | null;
          duration_ms: number | null;
          created_at: string;
          updated_at: string;
          session_identifier?: string | null;
          data_retention_until?: string | null;
          consent_ip_hash?: string | null;
        };
        Insert: {
          id?: string;
          started_at?: string;
          completed_at?: string | null;
          cultural_context?: string;
          user_agent?: string | null;
          ip_hash?: string | null;
          consent_timestamp?: string;
          completion_status?: string;
          assessment_version?: string;
          question_path?: string[] | null;
          duration_ms?: number | null;
          created_at?: string;
          updated_at?: string;
          session_identifier?: string | null;
          data_retention_until?: string | null;
          consent_ip_hash?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          session_id: string;
          cognitive_vector: Json;
          confidence_vector: Json;
          response_count: number;
          completion_time_seconds: number;
          cultural_context: string;
          consent_timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          cognitive_vector: Json;
          confidence_vector: Json;
          response_count?: number;
          completion_time_seconds: number;
          cultural_context?: string;
          consent_timestamp: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      question_responses: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          response: number;
          response_time_ms: number;
          question_category: string;
          dimension_weights: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          response: number;
          response_time_ms: number;
          question_category: string;
          dimension_weights: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['question_responses']['Insert']>;
        Relationships: [];
      };
      research_assessments: {
        Row: {
          id: string;
          session_id: string;
          assessment_version: string;
          timestamp: string;
          duration_ms: number;
          question_path: string[];
          responses: Json;
          final_profile: Json;
          completion_status: string;
          cultural_context: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          assessment_version?: string;
          timestamp?: string;
          duration_ms: number;
          question_path: string[];
          responses: Json;
          final_profile: Json;
          completion_status: string;
          cultural_context?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['research_assessments']['Insert']>;
        Relationships: [];
      };
      data_processing_records: {
        Row: {
          id: string;
          session_id: string | null;
          processing_purpose: string;
          legal_basis: string;
          data_categories: Json;
          retention_period_months: number;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          processing_purpose?: string;
          legal_basis?: string;
          data_categories?: string[];
          retention_period_months?: number;
        };
        Update: Partial<Database['public']['Tables']['data_processing_records']['Insert']>;
        Relationships: [];
      };
      data_subject_requests: {
        Row: {
          id: string;
          request_type: string;
          session_identifier: string | null;
          request_data: Json;
          request_status: string;
          response_data: Json | null;
          processed_at: string | null;
          processed_by: string | null;
        };
        Insert: {
          id?: string;
          request_type?: string;
          session_identifier?: string | null;
          request_data?: Json;
          request_status?: string;
          response_data?: Json | null;
          processed_at?: string | null;
          processed_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['data_subject_requests']['Insert']>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          operation: string;
          record_id: string;
          new_values: Json;
          change_reason: string;
        };
        Insert: {
          id?: string;
          table_name?: string;
          operation?: string;
          record_id?: string;
          new_values?: Json;
          change_reason?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
        Relationships: [];
      };
      ethics_audit_events: {
        Row: {
          id: string;
          event_type: string;
          session_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          session_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ethics_audit_events']['Insert']>;
        Relationships: [];
      };
      atlas_self_nominations: {
        Row: {
          id: string;
          anonymous_id: string;
          created_at: string;
          locale: string;
          selected_descriptor_ids: string[];
          linked_pcms_session_id: string | null;
          linked_atlas_session_id: string | null;
        };
        Insert: {
          id?: string;
          anonymous_id: string;
          locale: string;
          selected_descriptor_ids: string[];
          linked_pcms_session_id?: string | null;
          linked_atlas_session_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['atlas_self_nominations']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      research_analytics: {
        Row: Record<string, Json | undefined>;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
