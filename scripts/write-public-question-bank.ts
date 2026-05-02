/**
 * Writes `public/data/question-bank-universal-all.json` for offline cold-start and PWA precache.
 * Run: npm run export-public-bank
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadQuestionsFromDiskImpl } from '../src/data/question-loader-fs';

async function main(): Promise<void> {
  const merged = await loadQuestionsFromDiskImpl('universal');
  const outDir = path.join(process.cwd(), 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'question-bank-universal-all.json');
  fs.writeFileSync(outFile, JSON.stringify(merged), 'utf8');
  console.log(`Wrote ${outFile} (${merged.length} questions)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
