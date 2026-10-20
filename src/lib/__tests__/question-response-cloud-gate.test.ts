import { beforeEach, describe, expect, it, vi } from "vitest";
import { PCMS_CLOUD_SYNC_OPT_IN_KEY } from "@/lib/research-cloud-consent";
import type { QuestionResponse } from "@/data/questions";

const { insert, from } = vi.hoisted(() => {
  const insert = vi.fn(async () => ({ error: null }));
  const from = vi.fn(() => ({
    insert,
    upsert: vi.fn(async () => ({ error: null })),
    select: vi.fn(),
    update: vi.fn(),
  }));
  return { insert, from };
});

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => ({ from }),
  isSupabaseConfigured: () => true,
  generateSessionId: () => "session-test",
}));

vi.mock("@/lib/offline-storage", () => ({
  appendOfflineResponseRow: vi.fn(async () => undefined),
  attachOfflineCompletion: vi.fn(async () => undefined),
  questionResponsesToOfflineRows: vi.fn(() => []),
}));

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
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: mock, dispatchEvent: () => true },
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: mock,
    configurable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true },
    configurable: true,
  });
}

const sampleResponse: QuestionResponse = {
  questionId: "q-test",
  response: 3,
  timestamp: new Date("2026-01-01T00:00:00.000Z"),
  responseTimeMs: 120,
};

async function recordOnce() {
  const { DataCollectionService } = await import("@/lib/data-collection");
  const service = new DataCollectionService();
  await service.recordQuestionResponse(sampleResponse, "general", { F: 1 });
}

describe("recordQuestionResponse cloud opt-in gate", () => {
  beforeEach(() => {
    vi.resetModules();
    insert.mockClear();
    from.mockClear();
    installStorageMock();
  });

  it("does not insert when the opt-in flag is absent (default off)", async () => {
    expect(localStorage.getItem(PCMS_CLOUD_SYNC_OPT_IN_KEY)).toBeNull();
    await recordOnce();
    expect(insert).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("does not insert when the opt-in flag is off", async () => {
    localStorage.setItem(PCMS_CLOUD_SYNC_OPT_IN_KEY, "0");
    await recordOnce();
    expect(insert).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("inserts a question response when the opt-in flag is on", async () => {
    localStorage.setItem(PCMS_CLOUD_SYNC_OPT_IN_KEY, "1");
    await recordOnce();
    expect(from).toHaveBeenCalledWith("question_responses");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "session-test",
        question_id: "q-test",
        response: 3,
      }),
    );
  });
});
