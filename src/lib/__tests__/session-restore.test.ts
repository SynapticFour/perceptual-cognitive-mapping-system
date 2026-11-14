import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as restorePost } from "@/app/api/session/restore/route";
import { POST as deletePost } from "@/app/api/delete-session/route";
import { restoreApiLimiter } from "@/lib/rate-limiter";
import { hashRestoreSecret } from "@/lib/restore-secret";

const SECRET_A = "restore-secret-alpha-256-bits-placeholder";
const SECRET_B = "restore-secret-bravo-256-bits-placeholder";
const WRONG = "restore-secret-wrong-value-not-stored";
const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

type Row = Record<string, unknown>;

const store: Record<string, Row[]> = {};

function matched(table: string, filters: Array<[string, string]>): Row[] {
  return (store[table] ?? []).filter((row) => filters.every(([col, val]) => row[col] === val));
}

function makeAdmin() {
  return {
    from(table: string) {
      const filters: Array<[string, string]> = [];
      const api = {
        select() {
          return api;
        },
        eq(col: string, val: string) {
          filters.push([col, val]);
          return api;
        },
        async maybeSingle() {
          return { data: matched(table, filters)[0] ?? null, error: null };
        },
        update(patch: Row) {
          return {
            eq(col: string, val: string) {
              for (const row of store[table] ?? []) {
                if (row[col] === val) Object.assign(row, patch);
              }
              return Promise.resolve({ error: null });
            },
          };
        },
        delete() {
          return {
            eq(col: string, val: string) {
              store[table] = (store[table] ?? []).filter((row) => row[col] !== val);
              return Promise.resolve({});
            },
          };
        },
        then(
          resolve: (value: { data: Row[]; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          return Promise.resolve({ data: matched(table, filters), error: null }).then(
            resolve,
            reject,
          );
        },
      };
      return api;
    },
  };
}

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdminClient: () => makeAdmin(),
}));

function emptyStore() {
  for (const table of [
    "sessions",
    "question_responses",
    "profiles",
    "pipeline_sessions",
    "research_assessments",
    "data_processing_records",
    "ethics_audit_events",
    "atlas_self_nominations",
    "atlas_sessions",
    "data_subject_requests",
    "audit_log",
  ]) {
    store[table] = [];
  }
}

async function seed() {
  emptyStore();
  const hashA = await hashRestoreSecret(SECRET_A);
  const hashB = await hashRestoreSecret(SECRET_B);
  store.sessions = [
    {
      id: ID_A,
      restore_secret_hash: hashA,
      consent_timestamp: "2026-01-01T00:00:00.000Z",
      cultural_context: "universal",
      completion_status: "completed",
    },
    {
      id: ID_B,
      restore_secret_hash: hashB,
      consent_timestamp: "2026-02-01T00:00:00.000Z",
      cultural_context: "western",
      completion_status: "completed",
    },
  ];
  store.question_responses = [
    { id: "r1", session_id: ID_A, question_id: "q-a", response: 4 },
    { id: "r2", session_id: ID_B, question_id: "q-b", response: 2 },
  ];
  store.profiles = [
    { id: "p1", session_id: ID_A, cognitive_vector: { F: 1 } },
    { id: "p2", session_id: ID_B, cognitive_vector: { F: 0 } },
  ];
  store.pipeline_sessions = [
    { session_id: ID_A, final_profile: { sessionId: ID_A, marker: "only-a" } },
    { session_id: ID_B, final_profile: { sessionId: ID_B, marker: "only-b" } },
  ];
  store.research_assessments = [
    { session_id: ID_A, responses: [] },
    { session_id: ID_B, responses: [] },
  ];
  store.ethics_audit_events = [{ session_id: ID_A }, { session_id: ID_B }];
  store.atlas_self_nominations = [
    { linked_pcms_session_id: ID_A },
    { linked_pcms_session_id: ID_B },
  ];
  store.atlas_sessions = [{ anonymous_id: ID_A }, { anonymous_id: ID_B }];
  store.data_processing_records = [{ session_id: ID_A }, { session_id: ID_B }];
  store.data_subject_requests = [{ session_identifier: ID_A }, { session_identifier: ID_B }];
  store.audit_log = [{ record_id: ID_A }, { record_id: ID_B }];
}

function request(url: string, secret: string) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret }),
  });
}

describe("restore and delete by secret", () => {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(async () => {
    restoreApiLimiter.reset("ip:unknown");
    log.mockClear();
    info.mockClear();
    warn.mockClear();
    error.mockClear();
    await seed();
  });

  it("rejects a wrong secret and does not return the other session", async () => {
    const res = await restorePost(request("http://localhost/api/session/restore", WRONG));
    expect(res.status).toBe(404);
    expect(store.sessions).toHaveLength(2);
    expect(store.question_responses).toHaveLength(2);
  });

  it("returns only the session that matches the secret", async () => {
    const res = await restorePost(request("http://localhost/api/session/restore", SECRET_A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.id).toBe(ID_A);
    expect(body.questionResponses).toEqual([
      expect.objectContaining({ session_id: ID_A, question_id: "q-a" }),
    ]);
    expect(JSON.stringify(body)).not.toContain(ID_B);
    expect(JSON.stringify(body)).not.toContain("q-b");
    expect(body.pipelineFinalProfile).toEqual({ sessionId: ID_A, marker: "only-a" });
    expect(body.session.restore_secret_hash).toBeUndefined();
  });

  it("deletes every row of that session and leaves the other session", async () => {
    const res = await deletePost(request("http://localhost/api/delete-session", SECRET_A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deletedRemote).toBe(true);
    expect(body.sessionId).toBe(ID_A);
    expect(store.sessions.map((row) => row.id)).toEqual([ID_B]);
    for (const table of [
      "question_responses",
      "profiles",
      "pipeline_sessions",
      "research_assessments",
      "data_processing_records",
      "ethics_audit_events",
    ]) {
      expect(store[table].some((row) => row.session_id === ID_A)).toBe(false);
      expect(store[table].some((row) => row.session_id === ID_B)).toBe(true);
    }
    expect(store.atlas_self_nominations.some((row) => row.linked_pcms_session_id === ID_A)).toBe(
      false,
    );
    expect(store.atlas_sessions.some((row) => row.anonymous_id === ID_A)).toBe(false);
    expect(store.data_subject_requests.some((row) => row.session_identifier === ID_A)).toBe(false);
    expect(store.audit_log.some((row) => row.record_id === ID_A)).toBe(false);
    expect(store.atlas_self_nominations.some((row) => row.linked_pcms_session_id === ID_B)).toBe(
      true,
    );
  });

  it("does not put the secret in a log line", async () => {
    await restorePost(request("http://localhost/api/session/restore", SECRET_A));
    await deletePost(request("http://localhost/api/delete-session", SECRET_B));
    const dumped = JSON.stringify([
      log.mock.calls,
      info.mock.calls,
      warn.mock.calls,
      error.mock.calls,
    ]);
    expect(dumped).not.toContain(SECRET_A);
    expect(dumped).not.toContain(SECRET_B);
    expect(dumped).not.toContain(WRONG);
  });
});

describe("anonymous read of sessions stays closed in the migration", () => {
  it("drops public select policies and does not add one", () => {
    const sql = readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20261114220000_restore_secret_close_anon_read.sql",
      ),
      "utf8",
    );
    expect(sql).toContain('DROP POLICY IF EXISTS "Allow read access for research" ON sessions');
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]*ON sessions[\s\S]*FOR SELECT/i);
    expect(sql).toContain("restore_secret_hash");
  });
});
