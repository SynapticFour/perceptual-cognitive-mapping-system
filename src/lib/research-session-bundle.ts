/**
 * Research export: ZIP with manifest, long CSV, pipeline JSON, optional RO-Crate metadata.
 * RO-Crate improves FAIR repository ingest; plain JSON+CSV remain the most portable interchange.
 */
import { strToU8, zipSync } from 'fflate';
import type { QuestionResponse } from '@/data/questions';
import type { StoredPipelineSession } from '@/types/pipeline-session';
import { PIPELINE_STORAGE_VERSION } from '@/types/pipeline-session';

/** Bump when bundle layout or manifest semantics change materially. */
const PCM_EXPORT_VERSION = 2 as const;

export type ResearchBundleManifest = {
  pcmsExportVersion: typeof PCM_EXPORT_VERSION;
  pipelineStorageVersion: typeof PIPELINE_STORAGE_VERSION;
  exportedAt: string;
  locale: string;
  sessionId?: string;
  completedAt: string;
  responseCount: number;
  consentTimestamp?: string | null;
  questionBank: {
    label: string;
    itemCount: number;
  };
  /** Present when the saved pipeline session carries reproducibility fields (see `docs/RESEARCH-ROADMAP.md`). */
  reproducibility?: {
    questionBankId?: string;
    bankVersion?: string;
    stemRegionUsed?: string;
    adaptiveMode?: string;
    /** 1 = research deployment flag was on at completion. */
    researchMode?: number;
    profileSessionConfidence?: number;
    profileMeanContradiction01?: number;
  };
  integrity: {
    pipelineSessionSha256: string;
    questionHistorySha256: string;
    fullSessionSha256: string;
  };
  notes: string;
};

/** Wrapper JSON: pipeline + history in one file for archival / offline handoff. */
export const FULL_SESSION_BUNDLE_SCHEMA_VERSION = 1 as const;

export type SerializableQuestionResponse = {
  questionId: string;
  response: number;
  responseTimeMs: number;
  timestamp: string;
};

export type FullSessionExportV1 = {
  schemaVersion: typeof FULL_SESSION_BUNDLE_SCHEMA_VERSION;
  exportedAt: string;
  pipelineSession: StoredPipelineSession;
  questionHistory: SerializableQuestionResponse[];
};

export function serializeQuestionHistoryForExport(history: QuestionResponse[]): SerializableQuestionResponse[] {
  return history.map((h) => ({
    questionId: h.questionId,
    response: h.response,
    responseTimeMs: h.responseTimeMs,
    timestamp: h.timestamp.toISOString(),
  }));
}

export function buildFullSessionExportV1(
  stored: StoredPipelineSession,
  history: QuestionResponse[],
  exportedAt: string = new Date().toISOString()
): FullSessionExportV1 {
  return {
    schemaVersion: FULL_SESSION_BUNDLE_SCHEMA_VERSION,
    exportedAt,
    pipelineSession: stored,
    questionHistory: serializeQuestionHistoryForExport(history),
  };
}

function manifestReproducibility(stored: StoredPipelineSession): ResearchBundleManifest['reproducibility'] | undefined {
  const pa = stored.profileAdaptiveSummary;
  const out: Record<string, string | number> = {};
  if (stored.questionBankId) out.questionBankId = stored.questionBankId;
  if (stored.bankVersion) out.bankVersion = stored.bankVersion;
  if (stored.stemRegionUsed) out.stemRegionUsed = stored.stemRegionUsed;
  if (stored.adaptiveMode) out.adaptiveMode = stored.adaptiveMode;
  if (stored.researchMode === true) out.researchMode = 1;
  if (stored.researchMode === false) out.researchMode = 0;
  if (pa) {
    out.profileSessionConfidence = pa.sessionConfidence;
    out.profileMeanContradiction01 = pa.meanContradiction01;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

async function sha256HexUtf8(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function buildResponsesLongCsv(sessionId: string | undefined, history: QuestionResponse[]): string {
  const rows = ['session_id,question_id,response,response_time_ms,timestamp_iso'];
  const sid = sessionId ?? '';
  for (const h of history) {
    rows.push(
      `${JSON.stringify(sid)},${JSON.stringify(h.questionId)},${h.response},${h.responseTimeMs},${h.timestamp.toISOString()}`
    );
  }
  return rows.join('\n');
}

function buildRoCrateMinimal(manifest: ResearchBundleManifest, fileNames: string[]): Record<string, unknown> {
  const parts = fileNames.map((name) => ({ '@id': name }));
  return {
    '@context': 'https://w3id.org/ro/crate/1.1/context',
    '@graph': [
      {
        '@id': 'ro-crate-metadata.json',
        '@type': 'CreativeWork',
        conformsTo: { '@id': 'https://w3id.org/ro/crate/1.1' },
        about: { '@id': './' },
      },
      {
        '@id': './',
        '@type': 'Dataset',
        name: 'PCMS research session export',
        description:
          'Perceptual & Cognitive Mapping System — session data for research and reflection (descriptive mapping).',
        datePublished: manifest.exportedAt,
        hasPart: parts,
      },
    ],
  };
}

export type BuildResearchBundleInput = {
  stored: StoredPipelineSession;
  history: QuestionResponse[];
  locale: string;
  consentTimestamp?: string | null;
  bankItemCount: number;
  bankLabel?: string;
};

/**
 * Returns a ZIP file as Uint8Array (browser download).
 * Includes a minimal RO-Crate `ro-crate-metadata.json` for FAIR tooling; CSV + JSON remain primary.
 */
export async function buildResearchSessionZip(input: BuildResearchBundleInput): Promise<Uint8Array> {
  const pipelineJson = JSON.stringify(input.stored, null, 2);
  const historyJson = JSON.stringify(
    input.history.map((h) => ({
      questionId: h.questionId,
      response: h.response,
      responseTimeMs: h.responseTimeMs,
      timestamp: h.timestamp.toISOString(),
    })),
    null,
    2
  );
  const fullSession = buildFullSessionExportV1(input.stored, input.history, new Date().toISOString());
  const fullSessionJson = JSON.stringify(fullSession, null, 2);

  const rep = manifestReproducibility(input.stored);

  const manifest: ResearchBundleManifest = {
    pcmsExportVersion: PCM_EXPORT_VERSION,
    pipelineStorageVersion: PIPELINE_STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    locale: input.locale,
    sessionId: input.stored.sessionId,
    completedAt: input.stored.completedAt,
    responseCount: input.stored.responseCount,
    consentTimestamp: input.consentTimestamp ?? null,
    questionBank: {
      label: input.bankLabel ?? 'universal-all',
      itemCount: input.bankItemCount,
    },
    ...(rep ? { reproducibility: rep } : {}),
    integrity: {
      pipelineSessionSha256: await sha256HexUtf8(pipelineJson),
      questionHistorySha256: await sha256HexUtf8(historyJson),
      fullSessionSha256: await sha256HexUtf8(fullSessionJson),
    },
    notes:
      'RO-Crate wrapper is minimal (1.1). For repositories that do not use RO-Crate, use manifest.json and CSV/JSON directly. Widespread interchange in psychology remains CSV long format + JSON sidecars. `full-session.json` combines pipeline-session + question-history for one-file archival.',
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const csv = buildResponsesLongCsv(input.stored.sessionId, input.history);
  const roCrate = buildRoCrateMinimal(manifest, [
    'manifest.json',
    'pipeline-session.json',
    'question-history.json',
    'full-session.json',
    'responses-long.csv',
    'ro-crate-metadata.json',
  ]);
  const roCrateJson = JSON.stringify(roCrate, null, 2);

  const files: Record<string, Uint8Array> = {
    'manifest.json': strToU8(manifestJson),
    'pipeline-session.json': strToU8(pipelineJson),
    'question-history.json': strToU8(historyJson),
    'full-session.json': strToU8(fullSessionJson),
    'responses-long.csv': strToU8(csv),
    'ro-crate-metadata.json': strToU8(roCrateJson),
  };

  return zipSync(files, { level: 6 });
}

export function downloadUint8ArrayFile(data: Uint8Array, filename: string, mime = 'application/zip'): void {
  const blob = new Blob([new Uint8Array(data)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
