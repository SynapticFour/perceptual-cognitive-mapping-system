/**
 * Flags question stems that may be hard to read (long sentences, rare words).
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/readability-audit.ts
 */
import fs from 'fs';
import path from 'path';

const BANKS = [
  'content/questions/universal/core.json',
  'content/questions/universal/refinement.json',
  'content/questions/universal/tiav-extension-v1.json',
  'content/questions/cultural-adaptive-v1/bank.json',
];

function syllableEstimate(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  return Math.max(1, w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)?.length ?? 1);
}

function fkGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return 0;
  const syllables = words.reduce((s, w) => s + syllableEstimate(w), 0);
  return 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
}

function auditText(id: string, text: string, label: string): string[] {
  const issues: string[] = [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 28) issues.push('long_sentence');
  if (fkGrade(text) > 10) issues.push('high_fk_grade');
  if (/\b(disorder|deficit|impairment|diagnos)\b/i.test(text)) issues.push('clinical_term');
  if (issues.length) issues.unshift(`${label}:${id}`);
  return issues;
}

function main(): void {
  const all: string[] = [];
  for (const rel of BANKS) {
    const file = path.join(process.cwd(), rel);
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
    const arr = Array.isArray(data) ? data : [];
    for (const row of arr) {
      const r = row as Record<string, unknown>;
      if (typeof r.text === 'string') {
        all.push(...auditText(String(r.id), r.text, rel));
      }
      const variants = r.variants as Record<string, string> | undefined;
      if (variants) {
        for (const [k, v] of Object.entries(variants)) {
          all.push(...auditText(`${r.id}:${k}`, v, rel));
        }
      }
    }
  }
  if (all.length === 0) {
    console.log('OK: no readability flags');
    return;
  }
  console.log(`Flags (${all.length}):`);
  for (const line of all.slice(0, 40)) console.log(' ', line);
  if (all.length > 40) console.log(`  ... and ${all.length - 40} more`);
  process.exitCode = 0;
}

main();
