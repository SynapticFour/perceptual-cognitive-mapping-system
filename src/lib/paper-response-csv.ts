import type { LikertResponse, QuestionResponse } from '@/data/questions';

function parseLikert(n: number): LikertResponse | null {
  if (!Number.isInteger(n)) return null;
  if (n >= 1 && n <= 5) return n as LikertResponse;
  if (n >= 1 && n <= 3) return n as LikertResponse;
  return null;
}

/**
 * CSV with header: questionId,response[,responseTimeMs[,timestamp]]
 * Timestamp ISO 8601 optional; defaults to now per row.
 */
export function parsePaperResponsesCsv(text: string): QuestionResponse[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const header = lines[0]!.split(',').map((c) => c.trim().toLowerCase());
  const iId = header.indexOf('questionid');
  const iResp = header.indexOf('response');
  if (iId < 0 || iResp < 0) {
    throw new Error('CSV must include headers questionId and response');
  }
  const iRt = header.indexOf('responsetimems');
  const iTs = header.indexOf('timestamp');

  const out: QuestionResponse[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r]!.split(',').map((c) => c.trim());
    const id = cols[iId];
    if (!id) continue;
    const rv = Number(cols[iResp]);
    const lik = parseLikert(rv);
    if (lik === null) continue;
    const rt = iRt >= 0 && cols[iRt] !== undefined ? Number(cols[iRt]) : 0;
    const tsRaw = iTs >= 0 ? cols[iTs] : undefined;
    const timestamp = tsRaw ? new Date(tsRaw) : new Date();
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error(`Invalid timestamp row ${r + 1}`);
    }
    out.push({
      questionId: id,
      response: lik,
      responseTimeMs: Number.isFinite(rt) ? rt : 0,
      timestamp,
    });
  }
  return out;
}
