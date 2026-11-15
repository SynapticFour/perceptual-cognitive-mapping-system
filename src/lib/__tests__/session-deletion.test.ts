import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteRemoteSessionData } from "@/lib/session-deletion";

const { getSupabaseAdminClient } = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdminClient,
}));

describe("deleteRemoteSessionData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns skipped when server admin client is unavailable", async () => {
    getSupabaseAdminClient.mockReturnValue(null);
    await expect(deleteRemoteSessionData("s1")).resolves.toEqual({
      status: "skipped_no_server",
      sessionId: "s1",
    });
  });

  it("deletes all related tables when admin client exists", async () => {
    const eq = vi.fn().mockResolvedValue({});
    const del = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ delete: del }));
    getSupabaseAdminClient.mockReturnValue({ from });

    await expect(deleteRemoteSessionData("s2")).resolves.toEqual({
      status: "deleted",
      sessionId: "s2",
    });
    const tables = (from.mock.calls as unknown as string[][]).map((call) => call[0]);
    expect(tables).toEqual([
      "research_assessments",
      "question_responses",
      "profiles",
      "pipeline_sessions",
      "data_processing_records",
      "ethics_audit_events",
      "atlas_self_nominations",
      "atlas_sessions",
      "data_subject_requests",
      "audit_log",
      "sessions",
    ]);
    expect(eq).toHaveBeenCalledWith("id", "s2");
    expect(eq).toHaveBeenCalledWith("session_id", "s2");
  });

  it("returns error when deletion throws", async () => {
    const del = vi.fn(() => {
      throw new Error("boom");
    });
    const from = vi.fn(() => ({ delete: del }));
    getSupabaseAdminClient.mockReturnValue({ from });

    await expect(deleteRemoteSessionData("s3")).resolves.toEqual({
      status: "error",
      sessionId: "s3",
      message: "boom",
    });
  });
});
