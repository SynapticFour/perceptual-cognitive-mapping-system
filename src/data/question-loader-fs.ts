import path from 'path';
import fs from 'fs/promises';

import { assertResearchBankConstraints, validateQuestionBankArray } from '../lib/question-validator';
import type { AssessmentQuestion } from './questions';

const BANK_FILES = ['core.json', 'refinement.json'] as const;

const QUESTION_ROOT = path.join(process.cwd(), 'content', 'questions');

/**
 * Locales that merge universal + Ghana-specific items (same filtering as `culturalContext: ghana` in questions).
 * `en`, `de`, and unknown strings load the universal bank only (English items).
 */
function bankFoldersForLocale(locale: string): string[] {
  const l = locale.toLowerCase();
  if (l === 'ghana' || l === 'gh-en') {
    return ['universal', 'ghana'];
  }
  return ['universal'];
}

async function readValidatedJsonFile(filePath: string): Promise<AssessmentQuestion[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (e) {
    throw new Error(`Missing question file: ${filePath}`, { cause: e });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}`, { cause: err });
  }
  return validateQuestionBankArray(parsed, filePath);
}

/**
 * Loads `content/questions/universal/*.json` for all non-Ghana locales, and adds
 * `content/questions/ghana/*.json` when locale is `ghana` or `gh-en`.
 */
export async function loadQuestionsFromDiskImpl(locale: string): Promise<AssessmentQuestion[]> {
  const folders = bankFoldersForLocale(locale);
  const merged: AssessmentQuestion[] = [];

  for (const folder of folders) {
    for (const fileName of BANK_FILES) {
      const filePath = path.join(QUESTION_ROOT, folder, fileName);
      const chunk = await readValidatedJsonFile(filePath);
      merged.push(...chunk);
    }
  }

  const seen = new Set<string>();
  for (const q of merged) {
    if (seen.has(q.id)) {
      throw new Error(`Duplicate question id "${q.id}" after merging question banks (locale="${locale}")`);
    }
    seen.add(q.id);
  }

  assertResearchBankConstraints(merged, `merged question bank (locale=${locale})`);
  return merged;
}
