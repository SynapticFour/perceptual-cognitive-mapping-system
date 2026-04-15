import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.types';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseEnvConfigured } from '@/config/env';

export type PcmsSupabaseClient = SupabaseClient<Database>;

export const isSupabaseConfigured = (): boolean => isSupabaseEnvConfigured();

let supabaseClient: PcmsSupabaseClient | null = null;

export const getSupabaseClient = (): PcmsSupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured - using local storage fallback');
    return null;
  }

  const url = getSupabaseUrl()!;
  const key = getSupabaseAnonKey()!;

  if (!supabaseClient) {
    try {
      console.log('Creating Supabase client with:', {
        url: `${url.substring(0, 20)}...`,
        hasKey: !!key,
      });

      supabaseClient = createClient<Database>(url, key);

      console.log('Supabase client created successfully');
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }
  return supabaseClient;
};

export const supabase = getSupabaseClient();

export interface DatabaseProfile {
  id: string;
  session_id: string;
  cognitive_vector: Json;
  confidence_vector: Json;
  response_count: number;
  completion_time_seconds: number;
  cultural_context: string;
  consent_timestamp: string;
  created_at: string;
}

export interface DatabaseQuestionResponse {
  id: string;
  session_id: string;
  question_id: string;
  response: number;
  response_time_ms: number;
  question_category: string;
  dimension_weights: Record<string, number>;
  created_at: string;
}

export interface DatabaseSession {
  id: string;
  started_at: string;
  completed_at: string | null;
  cultural_context: string;
  user_agent: string | null;
  ip_hash: string | null;
  consent_timestamp: string;
  completion_status: 'in_progress' | 'completed' | 'abandoned';
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function getUserAgent(): string | null {
  if (typeof window !== 'undefined') {
    return navigator.userAgent;
  }
  return null;
}
