import {
  mkdtempSync,
  realpathSync,
  rmSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { SqliteStateStore } from "../src/state-store.ts";
import type { ObservedApproval } from "../src/approvals.ts";

const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const cwd = fileURLToPath(new URL("../../..", import.meta.url));

const tempDirs: string[] = [];

function createDatabasePath(name = "orchestrator.sqlite"): string {
  const dir = realpathSync(
    mkdtempSync(join(tmpdir(), "anklo-orchestrator-r2-")),
  );
  tempDirs.push(dir);
  return join(dir, name);
}

function createStore(): { store: SqliteStateStore; path: string } {
  const path = createDatabasePath();
  return { store: SqliteStateStore.open(path), path };
}

function runCli(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    ["--experimental-strip-types", cli, ...args],
    { cwd, encoding: "utf8" },
  );
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("Remediation 16.4-R2 Verification", () => {
  it("enforces schema v3 and audit hardening (ANKLO-16-004, ANKLO-16-006)", () => {
    const { store } = createStore();
    const diag = store.runtimeDiagnostics();
    expect(diag.schemaVersion).toBe(8);

    const now = new Date("2026-07-26T12:00:00Z");
    store.createRun({
      runId: "run-v3",
      repository: "Ciesparza29/ANKLO_OS",
      issueNumber: 24,
      idempotencyKey: "run-v3-key",
      baseSha: "7".repeat(40),
      planHash: "1".repeat(64),
      sourceSnapshotHash: "2".repeat(64),
      now,
    });

    const run = store.getRun("run-v3");
    expect(run).not.toBeNull();
    expect(run?.revalidationEpoch).toBe(1);

    const events = store.listAuditEvents("run-v3");
    expect(events).toHaveLength(1);
    const firstEvent = events[0];
    expect(firstEvent).toBeDefined();
    expect(firstEvent?.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(firstEvent?.schemaVersion).toBe("1.0");
    expect(firstEvent?.actorType).toBe("SYSTEM");
    expect(firstEvent?.result).toBe("OK");
    store.close();
  });

  it("migrates v2 database to v3 and creates backup via VACUUM INTO (ANKLO-RR-001)", () => {
    const dbPath = createDatabasePath("v2-migration.sqlite");
    const db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(
      "CREATE TABLE schema_meta (singleton_id INTEGER PRIMARY KEY CHECK(singleton_id = 1), version INTEGER NOT NULL, migration_state TEXT NOT NULL, applied_at TEXT NOT NULL);",
    );
    db.exec(
      "INSERT INTO schema_meta VALUES (1, 2, 'COMPLETE', '2026-07-26T10:00:00Z');",
    );
    db.exec(
      "CREATE TABLE runs (run_id TEXT PRIMARY KEY, repository TEXT NOT NULL, issue_number INTEGER NOT NULL, state TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE, base_sha TEXT NOT NULL, plan_hash TEXT NOT NULL, source_snapshot_hash TEXT NOT NULL, target_repository TEXT, target_remote TEXT, target_branch TEXT, target_head_sha TEXT, worktree_id TEXT, authorized_files_hash TEXT, package_hash TEXT, pull_request_number INTEGER, pull_request_head_sha TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);",
    );
    db.exec(
      "CREATE TABLE transitions (sequence INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT REFERENCES runs(run_id), from_state TEXT NOT NULL, to_state TEXT NOT NULL, reason TEXT NOT NULL, correlation_id TEXT NOT NULL, created_at TEXT NOT NULL);",
    );
    db.exec(
      "CREATE TABLE leases (lease_id TEXT PRIMARY KEY, kind TEXT NOT NULL, run_id TEXT REFERENCES runs(run_id), issue_number INTEGER, worktree_id TEXT, status TEXT NOT NULL, holder_pid INTEGER NOT NULL, acquired_at TEXT NOT NULL, expires_at TEXT NOT NULL, heartbeat_at TEXT NOT NULL, released_at TEXT);",
    );
    db.exec(
      "CREATE UNIQUE INDEX one_active_issue_lease ON leases(issue_number) WHERE status = 'ACTIVE' AND issue_number IS NOT NULL;",
    );
    db.exec(
      "CREATE UNIQUE INDEX one_active_worktree_lease ON leases(worktree_id) WHERE status = 'ACTIVE' AND worktree_id IS NOT NULL;",
    );
    db.exec(
      "CREATE TABLE approvals (approval_event_id TEXT PRIMARY KEY, nonce TEXT NOT NULL, effect TEXT NOT NULL, run_id TEXT REFERENCES runs(run_id), approval_kind TEXT NOT NULL, repository TEXT NOT NULL, issue_number INTEGER NOT NULL, expires_at TEXT NOT NULL, body_json TEXT NOT NULL, approval_comment_id INTEGER NOT NULL, approval_author_login TEXT NOT NULL, approval_comment_created_at TEXT NOT NULL, approval_comment_updated_at TEXT NOT NULL, observed_at TEXT NOT NULL, UNIQUE(run_id, effect));",
    );
    db.exec(
      "CREATE TABLE audit_events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, correlation_id TEXT NOT NULL, run_id TEXT REFERENCES runs(run_id), event_type TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL);",
    );
    db.exec(
      "CREATE TABLE control_flags (scope TEXT PRIMARY KEY, active INTEGER NOT NULL CHECK(active IN (0, 1)), reason TEXT, updated_at TEXT NOT NULL);",
    );
    db.exec(
      "CREATE TABLE quarantine_events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT REFERENCES runs(run_id), reason TEXT NOT NULL, correlation_id TEXT NOT NULL, created_at TEXT NOT NULL);",
    );
    db.exec("PRAGMA user_version = 2;");
    db.close();

    const store = SqliteStateStore.open(dbPath);
    expect(store.runtimeDiagnostics().schemaVersion).toBe(8);
    store.close();

    const files = readdirSync(join(dbPath, ".."));
    const backupFiles = files.filter((f) => f.includes(".backup-v2-"));
    expect(backupFiles.length).toBeGreaterThan(0);
  });

  it("handles concurrent createRun with observable coordination (ANKLO-RR-002)", () => {
    const dbPath = createDatabasePath("concurrent.sqlite");
    const store1 = SqliteStateStore.open(dbPath);
    const store2 = SqliteStateStore.open(dbPath);

    const now = new Date("2026-07-26T12:00:00Z");
    const res1 = store1.createRun({
      runId: "run-concurrent",
      repository: "Ciesparza29/ANKLO_OS",
      issueNumber: 24,
      idempotencyKey: "concurrent-key",
      baseSha: "7".repeat(40),
      planHash: "1".repeat(64),
      sourceSnapshotHash: "2".repeat(64),
      now,
    });

    const res2 = store2.createRun({
      runId: "run-concurrent",
      repository: "Ciesparza29/ANKLO_OS",
      issueNumber: 24,
      idempotencyKey: "concurrent-key",
      baseSha: "7".repeat(40),
      planHash: "1".repeat(64),
      sourceSnapshotHash: "2".repeat(64),
      now,
    });

    expect(res1.created).toBe(true);
    expect(res2.created).toBe(false);
    expect(res2.run.runId).toBe("run-concurrent");

    expect(() => {
      store2.createRun({
        runId: "run-different",
        repository: "Ciesparza29/ANKLO_OS",
        issueNumber: 24,
        idempotencyKey: "concurrent-key",
        baseSha: "8".repeat(40),
        planHash: "1".repeat(64),
        sourceSnapshotHash: "2".repeat(64),
        now,
      });
    }).toThrow(/Existing run belongs to different immutable inputs/);

    store1.close();
    store2.close();
  });

  it("invalidates target binding and increments revalidationEpoch on CHANGES_REQUESTED -> PLAN_READY (ANKLO-16-007)", () => {
    const { store } = createStore();
    const now = new Date("2026-07-26T12:00:00Z");
    store.createRun({
      runId: "run-reval",
      repository: "Ciesparza29/ANKLO_OS",
      issueNumber: 24,
      idempotencyKey: "run-reval-key",
      baseSha: "7".repeat(40),
      planHash: "1".repeat(64),
      sourceSnapshotHash: "2".repeat(64),
      now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "PLAN_READY",
      reason: "Plan ready",
      correlationId: "corr-1",
      now,
    });

    const planApprove: ObservedApproval = {
      body: {
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
      },
      approval_comment_id: 240024,
      approval_author_login: "Ciesparza29",
      approval_comment_created_at: "2026-07-26T12:00:00Z",
      approval_comment_updated_at: "2026-07-26T12:00:00Z",
    };

    store.recordApprovalEffect({
      observedApproval: planApprove,
      effect: "PLAN_APPROVED",
      runId: "run-reval",
      observedAt: now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "PLAN_APPROVED",
      reason: "Plan approved",
      correlationId: "corr-2",
      now,
    });

    store.bindImplementationTarget({
      runId: "run-reval",
      targetRepository: "Ciesparza29/ANKLO_OS",
      targetRemote: "origin",
      targetBranch: "feat/24",
      targetHeadSha: "9".repeat(40),
      worktreeId: "wt-1",
      authorizedFilesHash: "3".repeat(64),
      packageHash: "4".repeat(64),
      planApprovalBinding: {
        approvalEventId: "evt_1",
        approvalCommentId: 100,
        approvalAuthorLogin: "testuser",
        approvalCommentUpdatedAt: "2026-07-26T00:00:00.000Z",
        expiresAt: "2026-08-01T00:00:00.000Z",
        baseSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        planHash:
          "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        sourceSnapshotHash:
          "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      },
      correlationId: "corr-bind",
      now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "READY_TO_DISPATCH",
      reason: "Ready to dispatch",
      correlationId: "corr-3",
      now,
    });

    const implApprove: ObservedApproval = {
      body: {
        schema_version: "1.0",
        approval_kind: "IMPLEMENT_APPROVED",
        repository: "Ciesparza29/ANKLO_OS",
        issue_number: 24,
        expires_at: "2099-12-31T23:59:59Z",
        approval_event_id: "00000000-0000-4000-8000-000000000025",
        nonce: "11111111-1111-4111-8111-111111111125",
        base_sha: "7".repeat(40),
        plan_hash: "1".repeat(64),
        source_snapshot_hash: "2".repeat(64),
        target_branch: "feat/24",
        target_head_sha: "9".repeat(40),
        target_worktree_id: "wt-1",
        authorized_files_hash: "3".repeat(64),
        package_hash: "4".repeat(64),
      },
      approval_comment_id: 240025,
      approval_author_login: "Ciesparza29",
      approval_comment_created_at: "2026-07-26T12:00:00Z",
      approval_comment_updated_at: "2026-07-26T12:00:00Z",
    };

    store.recordApprovalEffect({
      observedApproval: implApprove,
      effect: "IMPLEMENT_APPROVED",
      runId: "run-reval",
      observedAt: now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "RUNNING_IMPLEMENTATION",
      reason: "Running implementation",
      correlationId: "corr-4",
      now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "IMPLEMENTATION_COMPLETE",
      reason: "Implementation complete",
      correlationId: "corr-5",
      now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "READY_FOR_REVIEW",
      reason: "Ready for review",
      correlationId: "corr-6",
      now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "RUNNING_REVIEW",
      reason: "Running review",
      correlationId: "corr-7",
      now,
    });

    store.transitionRun({
      runId: "run-reval",
      to: "CHANGES_REQUESTED",
      reason: "Changes needed",
      correlationId: "corr-8",
      now,
    });

    let run = store.getRun("run-reval");
    expect(run?.state).toBe("CHANGES_REQUESTED");
    expect(run?.worktreeId).toBe("wt-1");
    expect(run?.revalidationEpoch).toBe(1);

    store.transitionRun({
      runId: "run-reval",
      to: "PLAN_READY",
      reason: "Revalidating plan",
      correlationId: "corr-9",
      now,
    });

    run = store.getRun("run-reval");
    expect(run?.state).toBe("PLAN_READY");
    expect(run?.worktreeId).toBeNull();
    expect(run?.targetRepository).toBeNull();
    expect(run?.revalidationEpoch).toBe(2);
    store.close();
  });

  it("supports read-only inspection and explicit quarantine recovery (ANKLO-16-008, ANKLO-RR-003)", () => {
    const { store, path } = createStore();
    store.activateKillSwitch({
      scope: "GLOBAL",
      reason: "Manual test quarantine",
      now: new Date(),
    });

    expect(() =>
      store.createRun({
        runId: "run-blocked",
        repository: "Ciesparza29/ANKLO_OS",
        issueNumber: 24,
        idempotencyKey: "key-blocked",
        baseSha: "7".repeat(40),
        planHash: "1".repeat(64),
        sourceSnapshotHash: "2".repeat(64),
        now: new Date(),
      }),
    ).toThrow(/Persistent global kill switch blocks all effects/);

    store.close();

    const readOnlyStore = SqliteStateStore.openReadOnly(path);
    expect(readOnlyStore.readOnly).toBe(true);
    expect(() =>
      readOnlyStore.createRun({
        runId: "run-ro",
        repository: "Ciesparza29/ANKLO_OS",
        issueNumber: 24,
        idempotencyKey: "key-ro",
        baseSha: "7".repeat(40),
        planHash: "1".repeat(64),
        sourceSnapshotHash: "2".repeat(64),
        now: new Date(),
      }),
    ).toThrow(/read-only mode/);
    readOnlyStore.close();

    const recoveryStore = SqliteStateStore.openForRecovery(path);
    const recRes = recoveryStore.recoverFromQuarantine({
      reason: "Authorized recovery",
      now: new Date(),
    });
    expect(recRes.recovered).toBe(true);
    recoveryStore.close();

    const normalStore = SqliteStateStore.open(path);
    expect(normalStore.runtimeDiagnostics().schemaVersion).toBe(8);
    normalStore.close();
  });

  it("tests CLI commands state:inspect and state:recover", () => {
    const tempDir = realpathSync(
      mkdtempSync(join(tmpdir(), "anklo-orchestrator-cli-")),
    );
    tempDirs.push(tempDir);
    const configPath = join(tempDir, "config.json");

    writeFileSync(
      configPath,
      JSON.stringify({
        schemaVersion: "1.0",
        repository: "Ciesparza29/ANKLO_OS",
        repoRoot: cwd,
        runtimeDir: tempDir,
        approvedActors: ["Ciesparza29"],
        orchestratorActor: "anklo-orchestrator",
        dryRunDefault: true,
        networkListeners: false,
        productionAccess: false,
        allowedCapabilities: [
          "DIAGNOSE",
          "PLAN",
          "STATE_READ",
          "STATE_WRITE",
          "LEASE_WRITE",
          "APPROVAL_VALIDATE",
        ],
      }),
      "utf8",
    );

    let res = runCli(["state:init", "--config", configPath, "--apply"]);
    expect(res.status).toBe(0);

    res = runCli(["state:inspect", "--config", configPath, "--format", "json"]);
    expect(res.status).toBe(0);
    let output = JSON.parse(res.stdout);
    expect(output.data.read_only).toBe(true);
    expect(output.data.schema_version).toBe(8);

    res = runCli(["state:recover", "--config", configPath, "--format", "json"]);
    expect(res.status).toBe(0);
    output = JSON.parse(res.stdout);
    expect(output.result).toBe("DRY_RUN");

    res = runCli([
      "state:recover",
      "--config",
      configPath,
      "--apply",
      "--reason",
      "Test recovery",
      "--format",
      "json",
    ]);
    expect(res.status).toBe(0);
    output = JSON.parse(res.stdout);
    expect(output.data.recovered).toBe(true);
  });
});
