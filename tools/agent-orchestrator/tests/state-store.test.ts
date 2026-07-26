import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import type { ObservedApproval } from "../src/approvals.ts";
import { SqliteStateStore } from "../src/state-store.ts";

const tempDirs: string[] = [];

function createDatabasePath(name = "orchestrator.sqlite"): string {
  const dir = mkdtempSync(join(tmpdir(), "anklo-orchestrator-"));
  tempDirs.push(dir);
  return join(dir, name);
}

function createStore(): { store: SqliteStateStore; path: string } {
  const path = createDatabasePath();
  return { store: SqliteStateStore.open(path), path };
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

function planApproval(
  issueNumber = 24,
  eventSuffix = "0024",
  nonceSuffix = "1124",
): ObservedApproval {
  return {
    body: {
      schema_version: "1.0",
      approval_kind: "PLAN_APPROVED",
      repository: "Ciesparza29/ANKLO_OS",
      issue_number: issueNumber,
      expires_at: "2099-12-31T23:59:59Z",
      approval_event_id: `00000000-0000-4000-8000-00000000${eventSuffix}`,
      nonce: `11111111-1111-4111-8111-11111111${nonceSuffix}`,
      base_sha: "7".repeat(40),
      plan_hash: "1".repeat(64),
      source_snapshot_hash: "2".repeat(64),
    },
    approval_comment_id: Number(`24${eventSuffix}`),
    approval_author_login: "Ciesparza29",
    approval_comment_created_at: "2026-07-26T12:00:00Z",
    approval_comment_updated_at: "2026-07-26T12:00:00Z",
  };
}

function approvePlan(
  store: SqliteStateStore,
  runId: string,
  issueNumber = 24,
  eventSuffix = "0024",
  nonceSuffix = "1124",
): void {
  store.transitionRun({
    runId,
    to: "PLAN_READY",
    reason: "plan ready",
    correlationId: runId,
    now: new Date("2026-07-26T12:01:00Z"),
  });
  store.recordApprovalEffect({
    observedApproval: planApproval(issueNumber, eventSuffix, nonceSuffix),
    effect: "PLAN_APPROVED",
    runId,
    observedAt: new Date("2026-07-26T12:02:00Z"),
  });
  store.transitionRun({
    runId,
    to: "PLAN_APPROVED",
    reason: "approval validated",
    correlationId: runId,
    now: new Date("2026-07-26T12:03:00Z"),
  });
}

function bindTarget(store: SqliteStateStore, runId: string): void {
  store.bindImplementationTarget({
    runId,
    targetRepository: "Ciesparza29/ANKLO_OS",
    targetRemote: "origin",
    targetBranch: "feat/24-agent-orchestrator",
    targetHeadSha: "7".repeat(40),
    worktreeId: "worktree-24",
    authorizedFilesHash: "3".repeat(64),
    packageHash: "4".repeat(64),
    correlationId: runId,
    now: new Date("2026-07-26T12:04:00Z"),
  });
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("SQLite state store", () => {
  it("verifies schema version, WAL, foreign keys, timeout and integrity", () => {
    const { store } = createStore();
    expect(store.runtimeDiagnostics()).toEqual({
      schemaVersion: 3,
      journalMode: "wal",
      foreignKeys: true,
      busyTimeoutMs: 5000,
      integrityCheck: "ok",
    });
    store.close();
  });

  it("creates runs idempotently and appends audit evidence", () => {
    const { store } = createStore();
    const first = createRun(store, "run-1");
    const second = createRun(store, "run-1");
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(store.listAuditEvents("run-1")).toHaveLength(1);
    store.close();
  });

  it("binds PLAN_APPROVED to the exact run inputs", () => {
    const { store } = createStore();
    createRun(store, "run-approval");
    store.transitionRun({
      runId: "run-approval",
      to: "PLAN_READY",
      reason: "plan ready",
      correlationId: "run-approval",
      now: new Date("2026-07-26T12:01:00Z"),
    });
    expect(
      store.recordApprovalEffect({
        observedApproval: planApproval(),
        effect: "PLAN_APPROVED",
        runId: "run-approval",
        observedAt: new Date("2026-07-26T12:02:00Z"),
      }).recorded,
    ).toBe(true);
    expect(
      store.recordApprovalEffect({
        observedApproval: planApproval(),
        effect: "PLAN_APPROVED",
        runId: "run-approval",
        observedAt: new Date("2026-07-26T12:03:00Z"),
      }).recorded,
    ).toBe(false);
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

  it("quarantines a run when approval protected data does not match", () => {
    const { store } = createStore();
    createRun(store, "run-mismatch", 25);
    expect(() =>
      store.recordApprovalEffect({
        observedApproval: planApproval(24),
        effect: "PLAN_APPROVED",
        runId: "run-mismatch",
        observedAt: new Date("2026-07-26T12:02:00Z"),
      }),
    ).toThrow(/does not match/u);
    expect(store.getRun("run-mismatch")?.state).toBe("QUARANTINED");
    expect(() =>
      store.transitionRun({
        runId: "run-mismatch",
        to: "PLAN_READY",
        reason: "must remain blocked",
        correlationId: "run-mismatch",
        now: new Date("2026-07-26T12:03:00Z"),
      }),
    ).toThrow(/quarantined/u);
    store.close();
  });

  it("denies nonce reuse even with another event id", () => {
    const { store } = createStore();
    createRun(store, "run-nonce");
    const first = planApproval();
    store.recordApprovalEffect({
      observedApproval: first,
      effect: "PLAN_APPROVED",
      runId: "run-nonce",
      observedAt: new Date("2026-07-26T12:02:00Z"),
    });
    const replay = {
      ...first,
      body: {
        ...first.body,
        approval_event_id: "00000000-0000-4000-8000-000000000099",
      },
      approval_comment_id: 2499,
    } as const;
    expect(() =>
      store.recordApprovalEffect({
        observedApproval: replay,
        effect: "PLAN_APPROVED",
        runId: "run-nonce",
        observedAt: new Date("2026-07-26T12:03:00Z"),
      }),
    ).toThrow(/already consumed/u);
    expect(store.getRun("run-nonce")?.state).toBe("QUARANTINED");
    store.close();
  });

  it("requires immutable target binding before dispatch", () => {
    const { store } = createStore();
    createRun(store, "run-target");
    approvePlan(store, "run-target");
    expect(() =>
      store.transitionRun({
        runId: "run-target",
        to: "READY_TO_DISPATCH",
        reason: "missing target",
        correlationId: "run-target",
        now: new Date("2026-07-26T12:04:00Z"),
      }),
    ).toThrow(/target binding/u);
    bindTarget(store, "run-target");
    expect(
      store.transitionRun({
        runId: "run-target",
        to: "READY_TO_DISPATCH",
        reason: "target bound",
        correlationId: "run-target",
        now: new Date("2026-07-26T12:05:00Z"),
      }).state,
    ).toBe("READY_TO_DISPATCH");
    store.close();
  });

  it("binds lease acquisition to run issue, worktree and state", () => {
    const { store } = createStore();
    createRun(store, "run-lease");
    expect(() =>
      store.acquireDispatchLeases({
        runId: "run-lease",
        issueNumber: 24,
        worktreeId: "worktree-24",
        ttlMs: 60_000,
        holderPid: 123,
        now: new Date("2026-07-26T12:00:00Z"),
      }),
    ).toThrow(/READY_TO_DISPATCH/u);
    approvePlan(store, "run-lease");
    bindTarget(store, "run-lease");
    store.transitionRun({
      runId: "run-lease",
      to: "READY_TO_DISPATCH",
      reason: "dispatch",
      correlationId: "run-lease",
      now: new Date("2026-07-26T12:05:00Z"),
    });
    expect(() =>
      store.acquireDispatchLeases({
        runId: "run-lease",
        issueNumber: 25,
        worktreeId: "worktree-24",
        ttlMs: 60_000,
        holderPid: 123,
        now: new Date("2026-07-26T12:06:00Z"),
      }),
    ).toThrow(/issue does not match/u);
    expect(() =>
      store.acquireDispatchLeases({
        runId: "run-lease",
        issueNumber: 24,
        worktreeId: "other-worktree",
        ttlMs: 60_000,
        holderPid: 123,
        now: new Date("2026-07-26T12:06:00Z"),
      }),
    ).toThrow(/worktree does not match/u);
    store.close();
  });

  it("supports heartbeat and release for a complete lease pair", () => {
    const { store } = createStore();
    createRun(store, "run-lifecycle");
    approvePlan(store, "run-lifecycle");
    bindTarget(store, "run-lifecycle");
    store.transitionRun({
      runId: "run-lifecycle",
      to: "READY_TO_DISPATCH",
      reason: "dispatch",
      correlationId: "run-lifecycle",
      now: new Date("2026-07-26T12:05:00Z"),
    });
    const first = store.acquireDispatchLeases({
      runId: "run-lifecycle",
      issueNumber: 24,
      worktreeId: "worktree-24",
      ttlMs: 60_000,
      holderPid: 123,
      now: new Date("2026-07-26T12:06:00Z"),
    });
    expect(first.idempotent).toBe(false);
    const renewed = store.heartbeatDispatchLeases({
      runId: "run-lifecycle",
      holderPid: 123,
      ttlMs: 120_000,
      now: new Date("2026-07-26T12:06:10Z"),
    });
    expect(renewed).toHaveLength(2);
    expect(
      renewed.every((lease) => lease.heartbeatAt.endsWith("10.000Z")),
    ).toBe(true);
    expect(
      store.releaseDispatchLeases({
        runId: "run-lifecycle",
        holderPid: 123,
        reason: "implementation stopped",
        now: new Date("2026-07-26T12:06:20Z"),
      }),
    ).toEqual({ released: 2, idempotent: false });
    expect(
      store.releaseDispatchLeases({
        runId: "run-lifecycle",
        holderPid: 123,
        reason: "idempotent retry",
        now: new Date("2026-07-26T12:06:21Z"),
      }),
    ).toEqual({ released: 0, idempotent: true });
    store.close();
  });

  it("enforces lease uniqueness across two SQLite connections", () => {
    const path = createDatabasePath();
    const first = SqliteStateStore.open(path);
    createRun(first, "run-a");
    approvePlan(first, "run-a");
    bindTarget(first, "run-a");
    first.transitionRun({
      runId: "run-a",
      to: "READY_TO_DISPATCH",
      reason: "dispatch",
      correlationId: "run-a",
      now: new Date("2026-07-26T12:05:00Z"),
    });
    first.acquireDispatchLeases({
      runId: "run-a",
      issueNumber: 24,
      worktreeId: "worktree-24",
      ttlMs: 60_000,
      holderPid: 123,
      now: new Date("2026-07-26T12:06:00Z"),
    });

    const second = SqliteStateStore.open(path);
    createRun(second, "run-b", 25);
    approvePlan(second, "run-b", 25, "0025", "1125");
    second.bindImplementationTarget({
      runId: "run-b",
      targetRepository: "Ciesparza29/ANKLO_OS",
      targetRemote: "origin",
      targetBranch: "feat/25-other",
      targetHeadSha: "7".repeat(40),
      worktreeId: "worktree-24",
      authorizedFilesHash: "3".repeat(64),
      packageHash: "4".repeat(64),
      correlationId: "run-b",
      now: new Date("2026-07-26T12:04:00Z"),
    });
    second.transitionRun({
      runId: "run-b",
      to: "READY_TO_DISPATCH",
      reason: "dispatch",
      correlationId: "run-b",
      now: new Date("2026-07-26T12:05:00Z"),
    });
    expect(() =>
      second.acquireDispatchLeases({
        runId: "run-b",
        issueNumber: 25,
        worktreeId: "worktree-24",
        ttlMs: 60_000,
        holderPid: 456,
        now: new Date("2026-07-26T12:06:10Z"),
      }),
    ).toThrow(/Only one dispatch lease exists/u);
    expect(second.getRun("run-b")?.state).toBe("QUARANTINED");
    second.close();
    first.close();
  });

  it("recovers expired or dead-process leases and blocks the run", () => {
    const { store } = createStore();
    createRun(store, "run-recover");
    approvePlan(store, "run-recover");
    bindTarget(store, "run-recover");
    store.transitionRun({
      runId: "run-recover",
      to: "READY_TO_DISPATCH",
      reason: "dispatch",
      correlationId: "run-recover",
      now: new Date("2026-07-26T12:05:00Z"),
    });
    store.acquireDispatchLeases({
      runId: "run-recover",
      issueNumber: 24,
      worktreeId: "worktree-24",
      ttlMs: 60_000,
      holderPid: 999_999,
      now: new Date("2026-07-26T12:06:00Z"),
    });
    const recovered = store.recoverStaleLeases({
      now: new Date("2026-07-26T12:06:10Z"),
      isProcessAlive: () => false,
    });
    expect(recovered.recoveredRunIds).toEqual(["run-recover"]);
    expect(store.getRun("run-recover")?.state).toBe("BLOCKED");
    store.close();
  });

  it("persists kill switch and run quarantine controls", () => {
    const { store } = createStore();
    expect(
      store.activateKillSwitch({
        scope: "GLOBAL",
        reason: "operator stop",
        now: new Date("2026-07-26T12:00:00Z"),
      }).activated,
    ).toBe(true);
    expect(() => createRun(store, "run-blocked")).toThrow(/kill switch/u);
    store.close();
  });

  it("rejects unknown schemas and writes a persistent quarantine marker", () => {
    const path = createDatabasePath("unknown.sqlite");
    const raw = new DatabaseSync(path);
    raw.exec("PRAGMA user_version = 99;");
    raw.close();
    expect(() => SqliteStateStore.open(path)).toThrow(
      /Unsupported state schema/u,
    );
    expect(existsSync(`${path}.quarantine.json`)).toBe(true);
    expect(() => SqliteStateStore.open(path)).toThrow(/quarantine marker/u);
  });
});
