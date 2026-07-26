import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteStateStore } from "../src/state-store.ts";

const tempDirs: string[] = [];

function createStore(): { store: SqliteStateStore; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "anklo-orchestrator-"));
  tempDirs.push(dir);
  return {
    store: SqliteStateStore.open(join(dir, "orchestrator.sqlite")),
    dir,
  };
}

function createRun(store: SqliteStateStore, runId: string, issueNumber = 24) {
  return store.createRun({
    runId,
    repository: "Ciesparza29/ANKLO_OS",
    issueNumber,
    idempotencyKey: `${runId}-key`,
    baseSha: "7".repeat(40),
    planHash: "1".repeat(64),
    sourceSnapshotHash: "2".repeat(64),
    now: new Date("2026-07-26T12:00:00Z"),
  });
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("SQLite state store", () => {
  it("creates runs idempotently and appends audit evidence", () => {
    const { store } = createStore();
    const first = createRun(store, "run-1");
    const second = createRun(store, "run-1");
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(store.listAuditEvents("run-1")).toHaveLength(1);
    store.close();
  });

  it("persists only valid transitions", () => {
    const { store } = createStore();
    createRun(store, "run-2");
    const updated = store.transitionRun({
      runId: "run-2",
      to: "PLAN_READY",
      reason: "plan rendered",
      correlationId: "corr-2",
      now: new Date("2026-07-26T12:01:00Z"),
    });
    expect(updated.state).toBe("PLAN_READY");
    expect(() =>
      store.transitionRun({
        runId: "run-2",
        to: "DONE",
        reason: "invalid shortcut",
        correlationId: "corr-2",
        now: new Date("2026-07-26T12:02:00Z"),
      }),
    ).toThrow(/not allowed/u);
    expect(store.getRun("run-2")?.state).toBe("PLAN_READY");
    store.close();
  });

  it("requires persisted approvals for approval-gated transitions", () => {
    const { store } = createStore();
    createRun(store, "run-approval");
    store.transitionRun({
      runId: "run-approval",
      to: "PLAN_READY",
      reason: "plan ready",
      correlationId: "run-approval",
      now: new Date("2026-07-26T12:01:00Z"),
    });
    expect(() =>
      store.transitionRun({
        runId: "run-approval",
        to: "PLAN_APPROVED",
        reason: "approval missing",
        correlationId: "run-approval",
        now: new Date("2026-07-26T12:02:00Z"),
      }),
    ).toThrow(/requires PLAN_APPROVED/u);
    store.recordApprovalEffect({
      approvalEventId: "00000000-0000-4000-8000-000000000025",
      effect: "PLAN_APPROVED",
      runId: "run-approval",
      observedAt: new Date("2026-07-26T12:03:00Z"),
    });
    expect(
      store.transitionRun({
        runId: "run-approval",
        to: "PLAN_APPROVED",
        reason: "approval validated",
        correlationId: "run-approval",
        now: new Date("2026-07-26T12:04:00Z"),
      }).state,
    ).toBe("PLAN_APPROVED");
    store.close();
  });

  it("blocks externally observed states until their adapters exist", () => {
    const { store } = createStore();
    createRun(store, "run-external");
    expect(() =>
      store.transitionRun({
        runId: "run-external",
        to: "DONE",
        reason: "must not bypass GitHub evidence",
        correlationId: "run-external",
        now: new Date("2026-07-26T12:01:00Z"),
      }),
    ).toThrow();
    store.close();
  });

  it("enforces one active issue and worktree lease", () => {
    const { store } = createStore();
    createRun(store, "run-3");
    createRun(store, "run-4");
    const first = store.acquireDispatchLeases({
      runId: "run-3",
      issueNumber: 24,
      worktreeId: "worktree-24",
      ttlMs: 60_000,
      holderPid: 123,
      now: new Date("2026-07-26T12:00:00Z"),
    });
    expect(first.idempotent).toBe(false);
    const repeated = store.acquireDispatchLeases({
      runId: "run-3",
      issueNumber: 24,
      worktreeId: "worktree-24",
      ttlMs: 60_000,
      holderPid: 123,
      now: new Date("2026-07-26T12:00:10Z"),
    });
    expect(repeated.idempotent).toBe(true);
    expect(() =>
      store.acquireDispatchLeases({
        runId: "run-4",
        issueNumber: 24,
        worktreeId: "worktree-24",
        ttlMs: 60_000,
        holderPid: 456,
        now: new Date("2026-07-26T12:00:20Z"),
      }),
    ).toThrow(/already leased/u);
    store.close();
  });

  it("denies approval replay across runs", () => {
    const { store } = createStore();
    createRun(store, "run-5");
    createRun(store, "run-6", 25);
    const first = store.recordApprovalEffect({
      approvalEventId: "00000000-0000-4000-8000-000000000024",
      effect: "PLAN_EFFECT",
      runId: "run-5",
      observedAt: new Date("2026-07-26T12:00:00Z"),
    });
    expect(first.recorded).toBe(true);
    expect(
      store.recordApprovalEffect({
        approvalEventId: "00000000-0000-4000-8000-000000000024",
        effect: "PLAN_EFFECT",
        runId: "run-5",
        observedAt: new Date("2026-07-26T12:01:00Z"),
      }).recorded,
    ).toBe(false);
    expect(() =>
      store.recordApprovalEffect({
        approvalEventId: "00000000-0000-4000-8000-000000000024",
        effect: "PLAN_EFFECT",
        runId: "run-6",
        observedAt: new Date("2026-07-26T12:02:00Z"),
      }),
    ).toThrow(/another run/u);
    store.close();
  });
});
