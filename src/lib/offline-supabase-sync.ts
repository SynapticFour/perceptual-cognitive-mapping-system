/**
 * Pushes queued IndexedDB sessions to Supabase when connectivity returns.
 */

import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { assessmentDimensionWeightsToDbJson } from '@/lib/supabase-mappers';
import {
  getPendingSessions,
  markSessionSynced,
  type OfflineSession,
  type SyncResult,
} from '@/lib/offline-storage';
import type { Json } from '@/types/database.types';
import { toPipelineSessionRow } from '@/lib/pipeline-session-db';

async function pushOneSession(client: NonNullable<ReturnType<typeof getSupabaseClient>>, s: OfflineSession): Promise<void> {
  if (!s.research || !s.profile) throw new Error('incomplete_offline_session');

  const consentTs = s.consentTimestamp ?? '';
  if (!consentTs) throw new Error('missing_consent_timestamp');

  const sessionUpsert = {
    id: s.sessionId,
    consent_timestamp: consentTs,
    cultural_context: s.research.cultural_context,
    completion_status: 'in_progress' as const,
  };

  const { error: sesErr } = await client.from('sessions').upsert(sessionUpsert, { onConflict: 'id' });
  if (sesErr) throw sesErr;

  for (const row of s.responses) {
    const payload = {
      session_id: s.sessionId,
      question_id: row.questionId,
      response: row.response,
      response_time_ms: row.responseTimeMs,
      question_category: row.questionCategory,
      dimension_weights: assessmentDimensionWeightsToDbJson(row.dimensionWeights),
    };
    const { error: rErr } = await client.from('question_responses').insert(payload);
    if (rErr && !String(rErr.message).includes('duplicate')) {
      throw rErr;
    }
  }

  const { error: raErr } = await client.from('research_assessments').insert(s.research);
  if (raErr) throw raErr;

  const profileData = {
    session_id: s.sessionId,
    cognitive_vector: s.profile as unknown as Json,
    confidence_vector: {
      interpretationConfidence: s.profile.publicProfile.confidence,
      embeddingConfidence: s.profile.embedding.confidence,
      highlights: s.profile.featureHighlights,
    } as unknown as Json,
    response_count: s.profile.responseCount,
    completion_time_seconds: s.completionTimeSeconds ?? Math.round(s.research.duration_ms / 1000),
    cultural_context: s.research.cultural_context,
    consent_timestamp: consentTs,
  };

  const { error: pErr } = await client.from('profiles').insert(profileData);
  if (pErr) throw pErr;

  const pipelineRow = toPipelineSessionRow(s.sessionId, s.research.assessment_version, s.profile);
  const { error: psErr } = await client
    .from('pipeline_sessions')
    .upsert(pipelineRow, { onConflict: 'session_id' });
  if (psErr) throw psErr;

  const { error: upErr } = await client
    .from('sessions')
    .update({
      completed_at: new Date().toISOString(),
      completion_status: s.research.completion_status,
      assessment_version: s.research.assessment_version,
      question_path: s.research.question_path,
      duration_ms: s.research.duration_ms,
    })
    .eq('id', s.sessionId);
  if (upErr) throw upErr;
}

export async function syncPendingSessions(): Promise<SyncResult> {
  const errors: string[] = [];
  const syncedSessionIds: string[] = [];

  if (!isSupabaseConfigured()) {
    return { ok: true, syncedSessionIds, errors: ['supabase_not_configured'] };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, syncedSessionIds, errors: ['no_supabase_client'] };
  }

  const pending = await getPendingSessions();
  for (const s of pending) {
    try {
      await pushOneSession(client, s);
      await markSessionSynced(s.sessionId);
      syncedSessionIds.push(s.sessionId);
    } catch (e) {
      errors.push(`${s.sessionId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { ok: errors.length === 0, syncedSessionIds, errors };
}
