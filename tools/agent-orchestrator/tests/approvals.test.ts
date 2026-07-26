import { describe, expect, it } from "vitest";
import {
  parseApprovalBody,
  validateObservedApproval,
} from "../src/approvals.ts";

const body = {
  schema_version: "1.0",
  approval_kind: "PLAN_APPROVED",
  repository: "Ciesparza29/ANKLO_OS",
  issue_number: 24,
  expires_at: "2099-12-31T23:59:59Z",
  approval_event_id: "00000000-0000-4000-8000-000000000024",
  nonce: "11111111-1111-4111-8111-111111111124",
  base_sha: "7".repeat(40),
  plan_hash: "1".repeat(64),
  source_snapshot_hash: "2".repeat(64),
} as const;

const observed = {
  body,
  approval_comment_id: 2401,
  approval_author_login: "Ciesparza29",
  approval_comment_created_at: "2026-07-26T12:00:00Z",
  approval_comment_updated_at: "2026-07-26T12:00:00Z",
} as const;

const context = {
  repository: "Ciesparza29/ANKLO_OS",
  issueNumber: 24,
  approvedActors: ["Ciesparza29"],
  orchestratorActor: "anklo-orchestrator",
  now: new Date("2026-07-26T13:00:00Z"),
} as const;

describe("structured approvals", () => {
  it("accepts a strict, unedited and current approval", () => {
    expect(validateObservedApproval(observed, context).body.approval_kind).toBe(
      "PLAN_APPROVED",
    );
  });

  it("rejects free text", () => {
    expect(() => parseApprovalBody("aprobado")).toThrow(/structured object/u);
  });

  it("rejects fields from another approval kind", () => {
    expect(() =>
      parseApprovalBody({ ...body, package_hash: "3".repeat(64) }),
    ).toThrow(/do not match/u);
  });

  it.each([
    "9999-99-99T99:99:99Z",
    "2026-02-30T12:00:00Z",
    "2026-07-26T12:00:60Z",
  ])("rejects impossible UTC timestamp %s", (expiresAt: string) => {
    expect(() => parseApprovalBody({ ...body, expires_at: expiresAt })).toThrow(
      /real UTC instant|canonical UTC timestamp/u,
    );
  });

  it("rejects impossible observed timestamps", () => {
    expect(() =>
      validateObservedApproval(
        {
          ...observed,
          approval_comment_created_at: "2026-02-30T12:00:00Z",
          approval_comment_updated_at: "2026-02-30T12:00:00Z",
        },
        context,
      ),
    ).toThrow(/canonical UTC timestamp/u);
  });

  it("rejects expired approvals", () => {
    expect(() =>
      validateObservedApproval(
        { ...observed, body: { ...body, expires_at: "2026-07-26T12:59:59Z" } },
        context,
      ),
    ).toThrow(/expired/u);
  });

  it("rejects edited comments", () => {
    expect(() =>
      validateObservedApproval(
        {
          ...observed,
          approval_comment_updated_at: "2026-07-26T12:01:00Z",
        },
        context,
      ),
    ).toThrow(/unedited/u);
  });

  it("rejects orchestrator self-approval", () => {
    expect(() =>
      validateObservedApproval(
        { ...observed, approval_author_login: "anklo-orchestrator" },
        { ...context, approvedActors: ["anklo-orchestrator"] },
      ),
    ).toThrow(/cannot approve/u);
  });
});
