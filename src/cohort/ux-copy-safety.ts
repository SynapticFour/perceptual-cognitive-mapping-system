import { BANNED_DIAGNOSTIC_TERMS } from '@/cohort/cohort-validation';
import { MAX_GUIDANCE_INSIGHTS } from '@/cohort/ux-types';

/** Case-insensitive removal of blocked substrings (UI guardrail). */
export function sanitizeGuidanceText(input: string): string {
  let s = input;
  for (const term of BANNED_DIAGNOSTIC_TERMS) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    s = s.replace(re, '');
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}

export function clampInsightList<T>(items: T[], max: number = MAX_GUIDANCE_INSIGHTS): T[] {
  return items.slice(0, max);
}
