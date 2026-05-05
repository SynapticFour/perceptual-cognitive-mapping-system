import { beforeEach, describe, expect, it } from 'vitest';
import {
  CLOUD_SYNC_TELEMETRY_HISTORY_KEY,
  CLOUD_SYNC_TELEMETRY_KEY,
  extractCloudErrorDetails,
  readCloudSyncTelemetry,
  readCloudSyncTelemetryHistory,
  recordCloudSyncAttempt,
} from '@/lib/cloud-sync-telemetry';

function installStorageMock() {
  const store = new Map<string, string>();
  const mock = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: mock, dispatchEvent: () => true },
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    configurable: true,
  });
}

describe('cloud sync telemetry', () => {
  beforeEach(() => {
    installStorageMock();
    localStorage.removeItem(CLOUD_SYNC_TELEMETRY_KEY);
    localStorage.removeItem(CLOUD_SYNC_TELEMETRY_HISTORY_KEY);
  });

  it('records latest entry with optional error details', () => {
    recordCloudSyncAttempt('question_response', false, {
      errorCode: '42501',
      errorMessage: 'permission denied for table question_responses',
    });

    const latest = readCloudSyncTelemetry();
    expect(latest).toBeTruthy();
    expect(latest?.context).toBe('question_response');
    expect(latest?.ok).toBe(false);
    expect(latest?.errorCode).toBe('42501');
    expect(latest?.errorMessage).toContain('permission denied');
  });

  it('keeps rolling history and trims entries', () => {
    for (let i = 0; i < 25; i += 1) {
      recordCloudSyncAttempt(`ctx_${i}`, i % 2 === 0);
    }
    const history = readCloudSyncTelemetryHistory();
    expect(history.length).toBe(20);
    expect(history[0]?.context).toBe('ctx_5');
    expect(history[19]?.context).toBe('ctx_24');
    expect(localStorage.getItem(CLOUD_SYNC_TELEMETRY_KEY)).toBeTruthy();
    expect(localStorage.getItem(CLOUD_SYNC_TELEMETRY_HISTORY_KEY)).toBeTruthy();
  });

  it('extracts details from common error shapes', () => {
    expect(extractCloudErrorDetails(new Error('boom'))).toEqual({ errorCode: undefined, errorMessage: 'boom' });
    expect(extractCloudErrorDetails({ code: '401', message: 'Unauthorized' })).toEqual({
      errorCode: '401',
      errorMessage: 'Unauthorized',
    });
    expect(extractCloudErrorDetails('simple')).toEqual({ errorMessage: 'simple' });
  });
});
