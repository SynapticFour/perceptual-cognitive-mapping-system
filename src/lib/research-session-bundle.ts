/**
 * Research export: ZIP with manifest, long CSV, pipeline JSON, optional RO-Crate metadata.
 * RO-Crate improves FAIR repository ingest; plain JSON+CSV remain the most portable interchange.
 */
import { strToU8, zipSync } from 'fflate';
import type { QuestionResponse } from '@/data/questions';
import type { StoredPipelineSession } from '@/types/pipeline-session';
import { PIPELINE_STORAGE_VERSION } from '@/types/pipeline-session';

const PCM_EXPORT_VERSION = 1 as const;

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
  integrity: {
    pipelineSessionSha256: string;
    questionHistorySha256: string;
  };
  notes: string;
};

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
          'Perceptual & Cognitive Mapping System — session data for research. Not a clinical record.',
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
    integrity: {
      pipelineSessionSha256: await sha256HexUtf8(pipelineJson),
      questionHistorySha256: await sha256HexUtf8(historyJson),
    },
    notes:
      'RO-Crate wrapper is minimal (1.1). For repositories that do not use RO-Crate, use manifest.json and CSV/JSON directly. Widespread interchange in psychology remains CSV long format + JSON sidecars.',
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  const csv = buildResponsesLongCsv(input.stored.sessionId, input.history);
  const roCrate = buildRoCrateMinimal(manifest, [
    'manifest.json',
    'pipeline-session.json',
    'question-history.json',
    'responses-long.csv',
    'ro-crate-metadata.json',
  ]);
  const roCrateJson = JSON.stringify(roCrate, null, 2);

  const files: Record<string, Uint8Array> = {
    'manifest.json': strToU8(manifestJson),
    'pipeline-session.json': strToU8(pipelineJson),
    'question-history.json': strToU8(historyJson),
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
