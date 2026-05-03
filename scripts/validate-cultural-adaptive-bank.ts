import fs from 'fs';
import path from 'path';

import { validateCulturalAdaptiveBankArray } from '../src/lib/cultural-adaptive-bank';

const bankPath = path.join(process.cwd(), 'content', 'questions', 'cultural-adaptive-v1', 'bank.json');

function main(): void {
  const raw = fs.readFileSync(bankPath, 'utf8');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${bankPath}`, { cause: e });
  }
  const locale = process.env.PCMS_VALIDATE_LOCALE ?? 'universal';
  const qs = validateCulturalAdaptiveBankArray(data, bankPath, locale);
  console.log(`OK: ${qs.length} items (${bankPath}, stem locale=${locale})`);
}

main();
