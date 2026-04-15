import type { BrowserContextOptions } from '@playwright/test';
import { PCMS_ASSESSMENT_CONTEXT_KEY, type AssessmentContext } from '../../src/types/assessment-context';
import { sampleQuestionHistory, sampleStoredSession } from './results-session';

const e2eAssessmentContext: AssessmentContext = {
  culturalContext: 'universal',
  intendedUse: 'research',
  userAcknowledgedNonDiagnostic: true,
  userAcknowledgedResearchOnly: true,
};

const e2ePort = process.env.PLAYWRIGHT_PORT ?? '3040';
const resultsOrigin = `http://127.0.0.1:${e2ePort}`;

/** Playwright `storageState` for a completed results session (matches questionnaire + pipeline keys). */
export const resultsPlaywrightStorage: NonNullable<BrowserContextOptions['storageState']> = {
  cookies: [],
  origins: [
    {
      origin: resultsOrigin,
      localStorage: [
        { name: 'pcms-consent-timestamp', value: '2026-04-12T12:00:00.000Z' },
        { name: PCMS_ASSESSMENT_CONTEXT_KEY, value: JSON.stringify(e2eAssessmentContext) },
        { name: 'pcms-pipeline-result', value: JSON.stringify(sampleStoredSession) },
        { name: 'pcms-question-history', value: JSON.stringify(sampleQuestionHistory) },
      ],
    },
  ],
};
