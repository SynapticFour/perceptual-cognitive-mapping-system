/**
 * CI hook: cultural-adaptive bank structure + stem similarity audit.
 * Run: npm run audit-cultural-stems
 */
import fs from 'fs';
import path from 'path';
import { validateCulturalAdaptiveBankArray } from '../src/lib/cultural-adaptive-bank';
import { auditCulturalAdaptiveStemSimilarity } from '../src/lib/cultural-adaptive-stem-audit';

const bankPath = path.join(process.cwd(), 'content', 'questions', 'cultural-adaptive-v1', 'bank.json');

function main(): void {
  const raw = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  const locale = process.env.PCMS_VALIDATE_LOCALE ?? 'fr';
  const qs = validateCulturalAdaptiveBankArray(raw, bankPath, locale);
  const audit = auditCulturalAdaptiveStemSimilarity(raw as Parameters<typeof auditCulturalAdaptiveStemSimilarity>[0]);
  const low = audit.filter((a) => a.maxPairSimilarity > 0.85);
  console.log(`OK: ${qs.length} items; stem audit flags=${audit.length}; high_overlap=${low.length}`);
  if (low.length > 0) {
    console.warn('Warning: some stem pairs are very similar (may be intentional paraphrases):');
    for (const row of low.slice(0, 5)) console.warn(' ', row.id, row.pair, row.maxPairSimilarity);
  }
}

main();
