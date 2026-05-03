import path from 'path';
import fs from 'fs/promises';

import { assertResearchBankConstraints, validateQuestionBankArray } from '../lib/question-validator';
import { validateGlobalBehavioralBankArray } from '../lib/global-behavior-bank-validator';
import { validateCulturalAdaptiveBankArray } from '../lib/cultural-adaptive-bank';
import type { AssessmentQuestion } from './questions';

const BANK_FILES = ['core.json', 'refinement.json'] as const;

const QUESTION_ROOT = path.join(process.cwd(), 'content', 'questions');

/**
 * - `classic` — `universal` / `ghana` JSON packs.
 * - `global_v2` — `global-behavioral-v2/bank.json`.
 * - `cultural_adaptive_v1` — `cultural-adaptive-v1/bank.json` (see `.env.example`).
 */
function questionSourceMode(): 'classic' | 'global_v2' | 'cultural_adaptive_v1' {
  const raw = process.env.NEXT_PUBLIC_PCMS_QUESTION_SOURCE?.trim().toLowerCase();
  if (raw === 'global_v2') return 'global_v2';
  if (raw === 'cultural_adaptive_v1' || raw === 'cultural_adaptive') return 'cultural_adaptive_v1';
  return 'classic';
}

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
  if (questionSourceMode() === 'global_v2') {
    const filePath = path.join(QUESTION_ROOT, 'global-behavioral-v2', 'bank.json');
    let raw: string;
    try {
      raw = await fs.readFile(filePath, 'utf8');
    } catch (e) {
      throw new Error(`Global behavioral bank missing: ${filePath}`, { cause: e });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON in ${filePath}`, { cause: err });
    }
    return validateGlobalBehavioralBankArray(parsed, filePath);
  }

  if (questionSourceMode() === 'cultural_adaptive_v1') {
    const filePath = path.join(QUESTION_ROOT, 'cultural-adaptive-v1', 'bank.json');
    let raw: string;
    try {
      raw = await fs.readFile(filePath, 'utf8');
    } catch (e) {
      throw new Error(`Cultural adaptive bank missing: ${filePath}`, { cause: e });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON in ${filePath}`, { cause: err });
    }
    return validateCulturalAdaptiveBankArray(parsed, filePath, locale);
  }

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
