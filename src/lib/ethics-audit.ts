import type { Json } from '@/types/database.types';

export type EthicsAuditEventType =
  | 'consent_step_completed'
  | 'consent_flow_completed'
  | 'results_assent_completed'
  | 'data_deletion_requested'
  | 'data_deletion_completed'
  | 'data_deletion_failed';

export interface EthicsAuditEvent {
  type: EthicsAuditEventType;
  /** ISO time; optional when emitting from server routes (filled before persist). */
  timestamp?: string;
  stepId?: string;
  sessionId?: string;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = 'pcms-ethics-audit-log-v1';
const MAX_LOCAL_EVENTS = 2000;

function readLocal(): EthicsAuditEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EthicsAuditEvent[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(events: EthicsAuditEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = events.slice(-MAX_LOCAL_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota / private mode */
  }
}

/** Append a consent, assent, or deletion-related event (browser + optional server mirror). */
export function appendEthicsAuditEvent(
  event: Omit<EthicsAuditEvent, 'timestamp'> & { timestamp?: string }
): EthicsAuditEvent {
  const full: EthicsAuditEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
  const next = [...readLocal(), full];
  writeLocal(next);

  if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
    void fetch('/api/ethics-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
      keepalive: true,
    }).catch(() => {
      /* offline — local log remains */
    });
  }

  return full;
}

export function getEthicsAuditLog(): EthicsAuditEvent[] {
  return readLocal();
}

/** Aggregated view suitable for IRB / ethics committee periodic review. */
export function generateEthicsComplianceReport(options?: { windowDays?: number }): {
  generatedAt: string;
  windowDays: number;
  counts: Record<string, number>;
  consentStepsCompleted: number;
  consentsCompleted: number;
  assentsCompleted: number;
  deletionRequests: number;
  deletionsCompleted: number;
  recentEvents: EthicsAuditEvent[];
} {
  const windowDays = options?.windowDays ?? 90;
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const events = readLocal().filter((e) => new Date(e.timestamp ?? 0).getTime() >= cutoff);
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    counts,
    consentStepsCompleted: counts.consent_step_completed ?? 0,
    consentsCompleted: counts.consent_flow_completed ?? 0,
    assentsCompleted: counts.results_assent_completed ?? 0,
    deletionRequests: counts.data_deletion_requested ?? 0,
    deletionsCompleted: counts.data_deletion_completed ?? 0,
    recentEvents: events.slice(-50),
  };
}

export function ethicsEventToJsonPayload(e: EthicsAuditEvent): Json {
  return JSON.parse(JSON.stringify(e)) as Json;
}
