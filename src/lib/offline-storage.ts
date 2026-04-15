/**
 * IndexedDB persistence for offline questionnaire use (Ghana / low connectivity).
 * Does not import Supabase — see `offline-supabase-sync.ts`.
 */

import type { AssessmentQuestion } from '@/data/questions';
import type { QuestionResponse } from '@/data/questions';
import type { StoredPipelineSession } from '@/types/pipeline-session';
import type { ResearchAssessmentData } from '@/lib/data-collection';

const DB_NAME = 'PCMSOffline';
const DB_VERSION = 1;
const STORE_BANKS = 'questionBanks';
const STORE_SESSIONS = 'offlineSessions';

export interface OfflineResponseRow {
  questionId: string;
  response: number;
  responseTimeMs: number;
  timestamp: string;
  questionCategory: string;
  dimensionWeights: Record<string, number>;
}

/** Serializable snapshot for replay to Supabase when back online. */
export interface OfflineSession {
  sessionId: string;
  responses: OfflineResponseRow[];
  /** Present when assessment finished locally. */
  profile: StoredPipelineSession | null;
  timestamp: string;
  synced: boolean;
  completionStatus?: 'confidence_met' | 'max_questions' | 'user_exit';
  culturalContext?: 'western' | 'ghana' | 'universal';
  /** For `sessions` / `profiles` rows when syncing. */
  consentTimestamp?: string;
  /** Full row for `research_assessments` when completed. */
  research?: ResearchAssessmentData;
  completionTimeSeconds?: number;
}

export interface SyncResult {
  ok: boolean;
  syncedSessionIds: string[];
  errors: string[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BANKS)) {
        db.createObjectStore(STORE_BANKS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'sessionId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function bankKey(locale: string, type: string): string {
  return `${locale}|${type}`;
}

export async function putQuestionBankCache(locale: string, type: string, questions: AssessmentQuestion[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BANKS, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_BANKS).put({ key: bankKey(locale, type), questions, updatedAt: new Date().toISOString() });
  });
  db.close();
}

export async function getQuestionBankCache(locale: string, type: string): Promise<AssessmentQuestion[] | null> {
  try {
    const db = await openDb();
    const row = await new Promise<{ questions: AssessmentQuestion[] } | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_BANKS, 'readonly');
      const req = tx.objectStore(STORE_BANKS).get(bankKey(locale, type));
      req.onsuccess = () => resolve(req.result as { questions: AssessmentQuestion[] } | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return row?.questions ?? null;
  } catch {
    return null;
  }
}

async function getSessionRow(sessionId: string): Promise<OfflineSession | undefined> {
  const db = await openDb();
  const row = await new Promise<OfflineSession | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, 'readonly');
    const req = tx.objectStore(STORE_SESSIONS).get(sessionId);
    req.onsuccess = () => resolve(req.result as OfflineSession | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return row;
}

export async function saveSessionOffline(session: OfflineSession): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_SESSIONS).put({ ...session, synced: session.synced });
  });
  db.close();
}

export async function appendOfflineResponseRow(
  sessionId: string,
  row: OfflineResponseRow,
  partial?: Pick<OfflineSession, 'culturalContext'>
): Promise<void> {
  const existing = (await getSessionRow(sessionId)) ?? {
    sessionId,
    responses: [],
    profile: null,
    timestamp: new Date().toISOString(),
    synced: false,
    culturalContext: partial?.culturalContext,
  };
  existing.responses = existing.responses.filter((r) => r.questionId !== row.questionId);
  existing.responses.push(row);
  existing.timestamp = new Date().toISOString();
  existing.synced = false;
  if (partial?.culturalContext) existing.culturalContext = partial.culturalContext;
  await saveSessionOffline(existing);
}

export async function attachOfflineCompletion(
  sessionId: string,
  payload: {
    profile: StoredPipelineSession;
    research: ResearchAssessmentData;
    completionTimeSeconds: number;
    completionStatus: 'confidence_met' | 'max_questions' | 'user_exit';
    consentTimestamp: string;
    /** When no per-answer IDB rows exist (e.g. failed only at finalize), pass replay rows for Supabase. */
    responseRows?: OfflineResponseRow[];
  }
): Promise<void> {
  const existing = (await getSessionRow(sessionId)) ?? {
    sessionId,
    responses: [],
    profile: null,
    timestamp: new Date().toISOString(),
    synced: false,
  };
  if (payload.responseRows?.length) {
    existing.responses = payload.responseRows;
  }
  existing.profile = payload.profile;
  existing.research = payload.research;
  existing.completionTimeSeconds = payload.completionTimeSeconds;
  existing.completionStatus = payload.completionStatus;
  existing.consentTimestamp = payload.consentTimestamp;
  existing.timestamp = new Date().toISOString();
  existing.synced = false;
  await saveSessionOffline(existing);
}

export async function getPendingSessions(): Promise<OfflineSession[]> {
  try {
    const db = await openDb();
    const all = await new Promise<OfflineSession[]>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const req = tx.objectStore(STORE_SESSIONS).getAll();
      req.onsuccess = () => resolve((req.result as OfflineSession[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return all.filter((s) => !s.synced && s.profile && s.research);
  } catch {
    return [];
  }
}

export async function markSessionSynced(sessionId: string): Promise<void> {
  const row = await getSessionRow(sessionId);
  if (!row) return;
  row.synced = true;
  await saveSessionOffline(row);
}

/** Map in-memory history to rows (weights from current question — caller supplies rows). */
export function questionResponsesToOfflineRows(
  history: QuestionResponse[],
  resolveMeta: (questionId: string) => { category: string; dimensionWeights: Record<string, number> } | null
): OfflineResponseRow[] {
  const out: OfflineResponseRow[] = [];
  for (const q of history) {
    const meta = resolveMeta(q.questionId);
    if (!meta) continue;
    out.push({
      questionId: q.questionId,
      response: q.response,
      responseTimeMs: q.responseTimeMs,
      timestamp: q.timestamp.toISOString(),
      questionCategory: meta.category,
      dimensionWeights: meta.dimensionWeights,
    });
  }
  return out;
}
