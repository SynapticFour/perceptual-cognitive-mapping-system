/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const mockPush = vi.fn();

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock('@/lib/use-ui-strings', () => ({
  useUiStrings: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const en = require('../../../../../messages/en.json');
    const flat: Record<string, string> = {};
    const walk = (obj: unknown, prefix: string) => {
      if (typeof obj === 'string') {
        flat[prefix] = obj;
        return;
      }
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          walk(v, prefix ? `${prefix}.${k}` : k);
        }
      }
    };
    walk(en, '');
    return flat;
  },
}));

vi.mock('@/data/question-loader-browser', () => ({
  loadQuestions: vi.fn().mockResolvedValue(undefined),
}));

function ensureStorageApi(): void {
  const hasApi =
    typeof localStorage !== 'undefined' &&
    typeof localStorage.getItem === 'function' &&
    typeof localStorage.setItem === 'function' &&
    typeof localStorage.removeItem === 'function' &&
    typeof localStorage.clear === 'function';
  if (hasApi) return;

  const store = new Map<string, string>();
  const shim = {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
    removeItem(key: string) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: shim,
    configurable: true,
    writable: true,
  });
}

describe('ResultsPage (empty pipeline storage)', () => {
  beforeEach(() => {
    ensureStorageApi();
    mockPush.mockClear();
    localStorage.clear();
    localStorage.setItem('pcms-consent-timestamp', '2026-01-01T00:00:00.000Z');
  });

  it('navigates to questionnaire when no pipeline result is stored', async () => {
    const { default: ResultsPage } = await import('../page');
    render(<ResultsPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/questionnaire');
    });
  });
});
