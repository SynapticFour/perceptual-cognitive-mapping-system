import { COGNITIVE_DIMENSION_KEYS, type CognitiveVector } from '@/model/cognitive-dimensions';

import type { AssessmentSession, ContextStatistics } from './types';

function csvEscape(cell: string | number): string {
  const s = String(cell);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * SPSS-friendly CSV: short header names, comma-separated, one session per row.
 */
export function exportForSPSS(sessions: AssessmentSession[]): string {
  const dimCols = COGNITIVE_DIMENSION_KEYS.flatMap((d) => [`sc_${d}`, `cf_${d}`]);
  const header = ['anon_id', 'ctx', 'completed_at', 'n_resp', ...dimCols];
  const lines = [header.join(',')];

  for (const s of sessions) {
    const row = [
      csvEscape(s.anonId),
      csvEscape(s.culturalContext),
      csvEscape(s.completedAt),
      csvEscape(s.responseCount),
      ...COGNITIVE_DIMENSION_KEYS.flatMap((d) => [csvEscape(s.scores[d]), csvEscape(s.confidence[d])]),
    ];
    lines.push(row.join(','));
  }
  return lines.join('\n') + '\n';
}

/**
 * Single JSON document for R (`jsonlite::fromJSON`) with export metadata + `sessions` rows.
 */
export function exportForR(sessions: AssessmentSession[]): string {
  const payload = {
    format: 'PCMS_research_export',
    version: 1,
    generatedAt: new Date().toISOString(),
    dimensions: [...COGNITIVE_DIMENSION_KEYS],
    sessions,
  };
  return JSON.stringify(payload, null, 2) + '\n';
}

/**
 * Aggregated descriptive statistics by `culturalContext`.
 * @param sessions Anonymised sessions (same shape as export input).
 */
export function aggregateStatsByContext(sessions: ReadonlyArray<AssessmentSession>): ContextStatistics {
  const groups = new Map<AssessmentSession['culturalContext'], AssessmentSession[]>();
  for (const s of sessions) {
    const arr = groups.get(s.culturalContext) ?? [];
    arr.push(s);
    groups.set(s.culturalContext, arr);
  }

  const out: ContextStatistics['groups'] = [];

  for (const [culturalContext, rows] of groups) {
    const n = rows.length;
    if (n === 0) continue;

    let sumResp = 0;
    const scoreAcc = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, 0])) as CognitiveVector;
    const confAcc = Object.fromEntries(COGNITIVE_DIMENSION_KEYS.map((d) => [d, 0])) as CognitiveVector;

    for (const r of rows) {
      sumResp += r.responseCount;
      for (const d of COGNITIVE_DIMENSION_KEYS) {
        scoreAcc[d] += r.scores[d];
        confAcc[d] += r.confidence[d];
      }
    }

    const dimensionScoreMeans = { ...scoreAcc };
    const dimensionConfidenceMeans = { ...confAcc };
    for (const d of COGNITIVE_DIMENSION_KEYS) {
      dimensionScoreMeans[d] /= n;
      dimensionConfidenceMeans[d] /= n;
    }

    out.push({
      culturalContext,
      n,
      meanResponseCount: sumResp / n,
      dimensionScoreMeans,
      dimensionConfidenceMeans,
    });
  }

  return { groups: out };
}
