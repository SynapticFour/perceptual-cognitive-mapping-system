import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database.types';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseEnvConfigured } from '@/config/env';

export type PcmsSupabaseClient = SupabaseClient<Database>;

export const isSupabaseConfigured = (): boolean => isSupabaseEnvConfigured();

let supabaseClient: PcmsSupabaseClient | null = null;

function warnSupabaseMissing(): void {
  const msg =
    'Supabase not configured — using local storage only (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable cloud sync).';
  if (typeof window !== 'undefined') {
    console.warn(msg);
  } else if (process.env.NODE_ENV !== 'production') {
    console.warn(msg);
  }
}

export const getSupabaseClient = (): PcmsSupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    warnSupabaseMissing();
    return null;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    warnSupabaseMissing();
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient<Database>(url, key);
    } catch (error) {
      if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
        console.warn('Failed to create Supabase client — using local storage only:', error);
      }
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
