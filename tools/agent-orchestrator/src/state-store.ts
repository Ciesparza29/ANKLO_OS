import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ApprovalKind, ObservedApproval } from "./approvals.ts";
import { OrchestratorError } from "./errors.ts";
import {
  assertTransition,
  isRunState,
  type RunState,
} from "./state-machine.ts";

const STATE_SCHEMA_VERSION = 2;
const BUSY_TIMEOUT_MS = 5_000;

export type RunRecord = Readonly<{
  runId: string;
  repository: string;
  issueNumber: number;
  state: RunState;
  idempotencyKey: string;
  baseSha: string;
  planHash: string;
  sourceSnapshotHash: string;
  targetRepository: string | null;
  targetRemote: string | null;
  targetBranch: string | null;
  targetHeadSha: string | null;
  worktreeId: string | null;
  authorizedFilesHash: string | null;
  packageHash: string | null;
  pullRequestNumber: number | null;
  pullRequestHeadSha: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type LeaseRecord = Readonly<{
  leaseId: string;
  kind: "ISSUE" | "WORKTREE";
  runId: string;
  issueNumber: number | null;
  worktreeId: string | null;
  status: "ACTIVE" | "RELEASED" | "EXPIRED";
  holderPid: number;
  acquiredAt: string;
  expiresAt: string;
  heartbeatAt: string;
}>;

export type RuntimeDiagnostics = Readonly<{
  schemaVersion: number;
  journalMode: string;
  foreignKeys: boolean;
  busyTimeoutMs: number;
  integrityCheck: "ok";
}>;

export interface StateStore {
  integrityCheck(): void;
  runtimeDiagnostics(): RuntimeDiagnostics;
  assertEffectsAllowed(runId?: string): void;
  activateKillSwitch(input: {
    scope: "GLOBAL" | `RUN:${string}`;
    reason: string;
    now: Date;
  }): { activated: boolean };
  quarantineRun(input: {
    runId: string;
    reason: string;
    correlationId: string;
    now: Date;
  }): RunRecord;
  createRun(input: {
    runId: string;
    repository: string;
    issueNumber: number;
    idempotencyKey: string;
    baseSha: string;
    planHash: string;
    sourceSnapshotHash: string;
    now: Date;
  }): { created: boolean; run: RunRecord };
  getRun(runId: string): RunRecord | null;
  bindImplementationTarget(input: {
    runId: string;
    targetRepository: string;
    targetRemote: string;
    targetBranch: string;
    targetHeadSha: string;
    worktreeId: string;
    authorizedFilesHash: string;
    packageHash: string;
    correlationId: string;
    now: Date;
  }): RunRecord;
  transitionRun(input: {
    runId: string;
    to: RunState;
    reason: string;
    correlationId: string;
    now: Date;
  }): RunRecord;
  acquireDispatchLeases(input: {
    runId: string;
    issueNumber: number;
    worktreeId: string;
    ttlMs: number;
    holderPid: number;
    now: Date;
  }): {
    issueLease: LeaseRecord;
    worktreeLease: LeaseRecord;
    idempotent: boolean;
  };
  heartbeatDispatchLeases(input: {
    runId: string;
    holderPid: number;
    ttlMs: number;
    now: Date;
  }): readonly LeaseRecord[];
  releaseDispatchLeases(input: {
    runId: string;
    holderPid: number;
    reason: string;
    now: Date;
  }): { released: number; idempotent: boolean };
  recoverStaleLeases(input: {
    now: Date;
    isProcessAlive: (pid: number) => boolean;
  }): {
    recoveredRunIds: readonly string[];
    quarantinedRunIds: readonly string[];
  };
  recordApprovalEffect(input: {
    observedApproval: ObservedApproval;
    effect: ApprovalKind;
    runId: string;
    observedAt: Date;
  }): { recorded: boolean };
  listAuditEvents(runId: string): readonly Readonly<Record<string, unknown>>[];
  close(): void;
}

type DbRow = Record<string, string | number | null>;

const APPROVAL_GUARDS: Readonly<Partial<Record<RunState, ApprovalKind>>> = {
  PLAN_APPROVED: "PLAN_APPROVED",
  RUNNING_IMPLEMENTATION: "IMPLEMENT_APPROVED",
  PUSH_AUTHORIZED: "PUSH_APPROVED",
};

const EXTERNAL_GUARD_STATES = new Set<RunState>([
  "PUSHED",
  "PR_OPEN",
  "CI_PENDING",
  "CI_RUNNING",
  "CI_FAILED",
  "CI_PASSED",
  "READY_FOR_HUMAN_MERGE",
  "DONE",
]);

const TERMINAL_STATES = new Set<RunState>(["DONE", "CANCELLED", "QUARANTINED"]);

function asRow(value: unknown): DbRow {
  return (value ?? {}) as DbRow;
}

function scalarNumber(value: unknown): number {
  const row = asRow(value);
  return Number(Object.values(row)[0]);
}

function scalarString(value: unknown): string {
  const row = asRow(value);
  return String(Object.values(row)[0] ?? "");
}

function toRun(row: DbRow): RunRecord {
  const state = String(row.state);
  if (!isRunState(state)) {
    throw new OrchestratorError(
      "STATE_STORE_CORRUPT",
      `Unknown persisted state ${state}`,
    );
  }
  return Object.freeze({
    runId: String(row.run_id),
    repository: String(row.repository),
    issueNumber: Number(row.issue_number),
    state,
    idempotencyKey: String(row.idempotency_key),
    baseSha: String(row.base_sha),
    planHash: String(row.plan_hash),
    sourceSnapshotHash: String(row.source_snapshot_hash),
    targetRepository:
      row.target_repository === null ? null : String(row.target_repository),
    targetRemote: row.target_remote === null ? null : String(row.target_remote),
    targetBranch: row.target_branch === null ? null : String(row.target_branch),
    targetHeadSha:
      row.target_head_sha === null ? null : String(row.target_head_sha),
    worktreeId: row.worktree_id === null ? null : String(row.worktree_id),
    authorizedFilesHash:
      row.authorized_files_hash === null
        ? null
        : String(row.authorized_files_hash),
    packageHash: row.package_hash === null ? null : String(row.package_hash),
    pullRequestNumber:
      row.pull_request_number === null ? null : Number(row.pull_request_number),
    pullRequestHeadSha:
      row.pull_request_head_sha === null
        ? null
        : String(row.pull_request_head_sha),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  });
}

function toLease(row: DbRow): LeaseRecord {
  const kind = String(row.kind);
  const status = String(row.status);
  if (kind !== "ISSUE" && kind !== "WORKTREE") {
    throw new OrchestratorError("STATE_STORE_CORRUPT", "Unknown lease kind");
  }
  if (status !== "ACTIVE" && status !== "RELEASED" && status !== "EXPIRED") {
    throw new OrchestratorError("STATE_STORE_CORRUPT", "Unknown lease status");
  }
  return Object.freeze({
    leaseId: String(row.lease_id),
    kind,
    runId: String(row.run_id),
    issueNumber: row.issue_number === null ? null : Number(row.issue_number),
    worktreeId: row.worktree_id === null ? null : String(row.worktree_id),
    status,
    holderPid: Number(row.holder_pid),
    acquiredAt: String(row.acquired_at),
    expiresAt: String(row.expires_at),
    heartbeatAt: String(row.heartbeat_at),
  });
}

export class SqliteStateStore implements StateStore {
  readonly #db: DatabaseSync;
  readonly #databasePath: string;
  readonly #quarantineMarkerPath: string | null;

  private constructor(databasePath: string) {
    this.#databasePath = databasePath;
    this.#quarantineMarkerPath =
      databasePath === ":memory:" ? null : `${databasePath}.quarantine.json`;

    if (this.#quarantineMarkerPath && existsSync(this.#quarantineMarkerPath)) {
      throw new OrchestratorError(
        "PERSISTENT_KILL_SWITCH_ACTIVE",
        "State store has a persistent quarantine marker; effects are blocked",
        { details: { marker: this.#quarantineMarkerPath } },
      );
    }
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
    }

    this.#db = new DatabaseSync(databasePath);
    try {
      this.#initialize();
    } catch (error) {
      this.#persistFatalMarker(error);
      try {
        this.#db.close();
      } catch {
        // Preserve the original initialization error.
      }
      throw error;
    }
  }

  static open(databasePath: string): SqliteStateStore {
    return new SqliteStateStore(databasePath);
  }

  #persistFatalMarker(error: unknown): void {
    if (!this.#quarantineMarkerPath) return;
    try {
      const reason =
        error instanceof Error ? error.message : "Unknown state-store failure";
      writeFileSync(
        this.#quarantineMarkerPath,
        `${JSON.stringify(
          {
            schema_version: "1.0",
            active: true,
            database_path: this.#databasePath,
            reason,
            created_at: new Date().toISOString(),
          },
          null,
          2,
        )}\n`,
        { encoding: "utf8", flag: "wx", mode: 0o600 },
      );
    } catch {
      // A pre-existing marker or filesystem failure must not mask the original error.
    }
  }

  #withImmediate<T>(operation: () => T): T {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.#db.exec("COMMIT");
      return result;
    } catch (error) {
      try {
        this.#db.exec("ROLLBACK");
      } catch {
        // Preserve the original error.
      }
      throw error;
    }
  }

  #initialize(): void {
    this.#db.exec("PRAGMA foreign_keys = ON;");
    this.#db.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS};`);
    this.#db.exec("PRAGMA journal_mode = WAL;");

    const userVersion = scalarNumber(
      this.#db.prepare("PRAGMA user_version").get(),
    );
    if (userVersion === 0) {
      const existingApplicationTables = scalarNumber(
        this.#db
          .prepare(
            `SELECT COUNT(*) AS count
             FROM sqlite_master
             WHERE type = 'table'
               AND name IN (
                 'schema_meta', 'runs', 'transitions', 'leases', 'approvals',
                 'audit_events', 'control_flags', 'quarantine_events'
               )`,
          )
          .get(),
      );
      if (existingApplicationTables !== 0) {
        throw new OrchestratorError(
          "STATE_STORE_SCHEMA_UNVERSIONED",
          "Existing state schema has no supported version and cannot be migrated automatically",
        );
      }
      this.#createSchema();
      this.#db.exec(`PRAGMA user_version = ${STATE_SCHEMA_VERSION};`);
    } else if (userVersion !== STATE_SCHEMA_VERSION) {
      throw new OrchestratorError(
        "STATE_STORE_SCHEMA_UNSUPPORTED",
        `Unsupported state schema version ${userVersion}`,
        { details: { expected: STATE_SCHEMA_VERSION, actual: userVersion } },
      );
    }

    this.#verifySchema();
    this.#verifyPragmas();
    this.integrityCheck();
  }

  #createSchema(): void {
    this.#db.exec(`
      CREATE TABLE schema_meta (
        singleton_id INTEGER PRIMARY KEY CHECK(singleton_id = 1),
        version INTEGER NOT NULL,
        migration_state TEXT NOT NULL CHECK(migration_state = 'COMPLETE'),
        applied_at TEXT NOT NULL
      );
      INSERT INTO schema_meta(singleton_id, version, migration_state, applied_at)
      VALUES (1, ${STATE_SCHEMA_VERSION}, 'COMPLETE', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

      CREATE TABLE runs (
        run_id TEXT PRIMARY KEY,
        repository TEXT NOT NULL,
        issue_number INTEGER NOT NULL,
        state TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        base_sha TEXT NOT NULL,
        plan_hash TEXT NOT NULL,
        source_snapshot_hash TEXT NOT NULL,
        target_repository TEXT,
        target_remote TEXT,
        target_branch TEXT,
        target_head_sha TEXT,
        worktree_id TEXT,
        authorized_files_hash TEXT,
        package_hash TEXT,
        pull_request_number INTEGER,
        pull_request_head_sha TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE transitions (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL REFERENCES runs(run_id),
        from_state TEXT NOT NULL,
        to_state TEXT NOT NULL,
        reason TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE leases (
        lease_id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK(kind IN ('ISSUE', 'WORKTREE')),
        run_id TEXT NOT NULL REFERENCES runs(run_id),
        issue_number INTEGER,
        worktree_id TEXT,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'RELEASED', 'EXPIRED')),
        holder_pid INTEGER NOT NULL,
        acquired_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        heartbeat_at TEXT NOT NULL,
        released_at TEXT,
        CHECK(
          (kind = 'ISSUE' AND issue_number IS NOT NULL AND worktree_id IS NULL)
          OR
          (kind = 'WORKTREE' AND issue_number IS NULL AND worktree_id IS NOT NULL)
        )
      );

      CREATE UNIQUE INDEX one_active_issue_lease
      ON leases(issue_number)
      WHERE kind = 'ISSUE' AND status = 'ACTIVE';

      CREATE UNIQUE INDEX one_active_worktree_lease
      ON leases(worktree_id)
      WHERE kind = 'WORKTREE' AND status = 'ACTIVE';

      CREATE TABLE approvals (
        approval_event_id TEXT PRIMARY KEY,
        nonce TEXT NOT NULL UNIQUE,
        effect TEXT NOT NULL,
        run_id TEXT NOT NULL REFERENCES runs(run_id),
        approval_kind TEXT NOT NULL,
        repository TEXT NOT NULL,
        issue_number INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        body_json TEXT NOT NULL,
        approval_comment_id INTEGER NOT NULL UNIQUE,
        approval_author_login TEXT NOT NULL,
        approval_comment_created_at TEXT NOT NULL,
        approval_comment_updated_at TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        UNIQUE(run_id, effect)
      );

      CREATE TABLE audit_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        correlation_id TEXT NOT NULL,
        run_id TEXT REFERENCES runs(run_id),
        event_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE control_flags (
        scope TEXT PRIMARY KEY,
        active INTEGER NOT NULL CHECK(active IN (0, 1)),
        reason TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE quarantine_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT REFERENCES runs(run_id),
        reason TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  #verifySchema(): void {
    const row = asRow(
      this.#db
        .prepare(
          "SELECT version, migration_state FROM schema_meta WHERE singleton_id = 1",
        )
        .get(),
    );
    if (
      Number(row.version) !== STATE_SCHEMA_VERSION ||
      String(row.migration_state) !== "COMPLETE"
    ) {
      throw new OrchestratorError(
        "STATE_STORE_SCHEMA_INCOMPLETE",
        "State schema version or migration state is invalid",
      );
    }
    const count = scalarNumber(
      this.#db.prepare("SELECT COUNT(*) AS count FROM schema_meta").get(),
    );
    if (count !== 1) {
      throw new OrchestratorError(
        "STATE_STORE_SCHEMA_INCOMPLETE",
        "State schema metadata must contain exactly one version row",
      );
    }
  }

  #verifyPragmas(): void {
    const foreignKeys = scalarNumber(
      this.#db.prepare("PRAGMA foreign_keys").get(),
    );
    const busyTimeout = scalarNumber(
      this.#db.prepare("PRAGMA busy_timeout").get(),
    );
    const journalMode = scalarString(
      this.#db.prepare("PRAGMA journal_mode").get(),
    ).toLowerCase();
    const expectedJournal =
      this.#databasePath === ":memory:" ? "memory" : "wal";

    if (foreignKeys !== 1) {
      throw new OrchestratorError(
        "STATE_STORE_CONFIGURATION_FAILED",
        "SQLite foreign keys are not active",
      );
    }
    if (!Number.isFinite(busyTimeout) || busyTimeout < BUSY_TIMEOUT_MS) {
      throw new OrchestratorError(
        "STATE_STORE_CONFIGURATION_FAILED",
        "SQLite busy_timeout is below the required value",
        { details: { busyTimeout, required: BUSY_TIMEOUT_MS } },
      );
    }
    if (journalMode !== expectedJournal) {
      throw new OrchestratorError(
        "STATE_STORE_CONFIGURATION_FAILED",
        "SQLite journal mode is not the required mode",
        { details: { journalMode, expectedJournal } },
      );
    }
  }

  runtimeDiagnostics(): RuntimeDiagnostics {
    this.#verifyPragmas();
    this.integrityCheck();
    return Object.freeze({
      schemaVersion: scalarNumber(
        this.#db.prepare("PRAGMA user_version").get(),
      ),
      journalMode: scalarString(
        this.#db.prepare("PRAGMA journal_mode").get(),
      ).toLowerCase(),
      foreignKeys:
        scalarNumber(this.#db.prepare("PRAGMA foreign_keys").get()) === 1,
      busyTimeoutMs: scalarNumber(
        this.#db.prepare("PRAGMA busy_timeout").get(),
      ),
      integrityCheck: "ok",
    });
  }

  integrityCheck(): void {
    const result = scalarString(
      this.#db.prepare("PRAGMA integrity_check").get(),
    );
    if (result !== "ok") {
      const error = new OrchestratorError(
        "STATE_STORE_INTEGRITY_FAILED",
        "SQLite integrity check failed; dispatch is blocked",
        { details: { result } },
      );
      this.#persistFatalMarker(error);
      throw error;
    }
  }

  #appendAudit(input: {
    correlationId: string;
    runId: string | null;
    eventType: string;
    payload: Readonly<Record<string, unknown>>;
    now: Date;
  }): void {
    this.#db
      .prepare(
        `INSERT INTO audit_events(
          correlation_id, run_id, event_type, payload_json, created_at
        ) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        input.correlationId,
        input.runId,
        input.eventType,
        JSON.stringify(input.payload),
        input.now.toISOString(),
      );
  }

  #isControlActive(scope: string): boolean {
    const row = this.#db
      .prepare("SELECT active FROM control_flags WHERE scope = ?")
      .get(scope);
    return row ? Number(asRow(row).active) === 1 : false;
  }

  assertEffectsAllowed(runId?: string): void {
    if (this.#quarantineMarkerPath && existsSync(this.#quarantineMarkerPath)) {
      throw new OrchestratorError(
        "PERSISTENT_KILL_SWITCH_ACTIVE",
        "State store quarantine marker blocks all effects",
      );
    }
    if (this.#isControlActive("GLOBAL")) {
      throw new OrchestratorError(
        "PERSISTENT_KILL_SWITCH_ACTIVE",
        "Persistent global kill switch blocks all effects",
      );
    }
    if (runId && this.#isControlActive(`RUN:${runId}`)) {
      throw new OrchestratorError(
        "RUN_QUARANTINED",
        `Run ${runId} is quarantined`,
      );
    }
  }

  activateKillSwitch(input: {
    scope: "GLOBAL" | `RUN:${string}`;
    reason: string;
    now: Date;
  }): { activated: boolean } {
    return this.#withImmediate(() => {
      const existing = this.#db
        .prepare("SELECT active, reason FROM control_flags WHERE scope = ?")
        .get(input.scope);
      if (existing && Number(asRow(existing).active) === 1) {
        return { activated: false };
      }
      this.#db
        .prepare(
          `INSERT INTO control_flags(scope, active, reason, updated_at)
           VALUES (?, 1, ?, ?)
           ON CONFLICT(scope) DO UPDATE SET
             active = 1,
             reason = excluded.reason,
             updated_at = excluded.updated_at`,
        )
        .run(input.scope, input.reason, input.now.toISOString());
      this.#appendAudit({
        correlationId: input.scope,
        runId: input.scope.startsWith("RUN:")
          ? input.scope.slice("RUN:".length)
          : null,
        eventType: "KILL_SWITCH_ACTIVATED",
        payload: { scope: input.scope, reason: input.reason },
        now: input.now,
      });
      return { activated: true };
    });
  }

  #quarantineRunInTransaction(input: {
    runId: string;
    reason: string;
    correlationId: string;
    now: Date;
  }): RunRecord {
    const row = this.#db
      .prepare("SELECT * FROM runs WHERE run_id = ?")
      .get(input.runId);
    if (!row) {
      throw new OrchestratorError(
        "RUN_NOT_FOUND",
        `Run ${input.runId} was not found`,
      );
    }
    const run = toRun(asRow(row));
    const now = input.now.toISOString();

    this.#db
      .prepare(
        `INSERT INTO control_flags(scope, active, reason, updated_at)
         VALUES (?, 1, ?, ?)
         ON CONFLICT(scope) DO UPDATE SET
           active = 1,
           reason = excluded.reason,
           updated_at = excluded.updated_at`,
      )
      .run(`RUN:${input.runId}`, input.reason, now);

    if (run.state !== "QUARANTINED") {
      this.#db
        .prepare(
          "UPDATE runs SET state = 'QUARANTINED', updated_at = ? WHERE run_id = ?",
        )
        .run(now, input.runId);
      this.#db
        .prepare(
          `INSERT INTO transitions(
            run_id, from_state, to_state, reason, correlation_id, created_at
          ) VALUES (?, ?, 'QUARANTINED', ?, ?, ?)`,
        )
        .run(input.runId, run.state, input.reason, input.correlationId, now);
    }

    this.#db
      .prepare(
        `INSERT INTO quarantine_events(run_id, reason, correlation_id, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(input.runId, input.reason, input.correlationId, now);
    this.#appendAudit({
      correlationId: input.correlationId,
      runId: input.runId,
      eventType: "RUN_QUARANTINED",
      payload: { from: run.state, reason: input.reason },
      now: input.now,
    });

    const updated = this.#db
      .prepare("SELECT * FROM runs WHERE run_id = ?")
      .get(input.runId);
    return toRun(asRow(updated));
  }

  quarantineRun(input: {
    runId: string;
    reason: string;
    correlationId: string;
    now: Date;
  }): RunRecord {
    return this.#withImmediate(() => this.#quarantineRunInTransaction(input));
  }

  createRun(input: {
    runId: string;
    repository: string;
    issueNumber: number;
    idempotencyKey: string;
    baseSha: string;
    planHash: string;
    sourceSnapshotHash: string;
    now: Date;
  }): { created: boolean; run: RunRecord } {
    this.assertEffectsAllowed();
    const existing = this.#db
      .prepare("SELECT * FROM runs WHERE idempotency_key = ? OR run_id = ?")
      .get(input.idempotencyKey, input.runId);
    if (existing) {
      const run = toRun(asRow(existing));
      if (
        run.runId !== input.runId ||
        run.repository !== input.repository ||
        run.issueNumber !== input.issueNumber ||
        run.baseSha !== input.baseSha ||
        run.planHash !== input.planHash ||
        run.sourceSnapshotHash !== input.sourceSnapshotHash
      ) {
        throw new OrchestratorError(
          "IDEMPOTENCY_COLLISION",
          "Existing run belongs to different immutable inputs",
        );
      }
      return { created: false, run };
    }

    const now = input.now.toISOString();
    this.#withImmediate(() => {
      this.#db
        .prepare(
          `INSERT INTO runs(
            run_id, repository, issue_number, state, idempotency_key,
            base_sha, plan_hash, source_snapshot_hash,
            target_repository, target_remote, target_branch, target_head_sha,
            worktree_id, authorized_files_hash, package_hash,
            pull_request_number, pull_request_head_sha,
            created_at, updated_at
          ) VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, NULL, NULL, NULL, NULL,
                    NULL, NULL, NULL, NULL, NULL, ?, ?)`,
        )
        .run(
          input.runId,
          input.repository,
          input.issueNumber,
          input.idempotencyKey,
          input.baseSha,
          input.planHash,
          input.sourceSnapshotHash,
          now,
          now,
        );
      this.#appendAudit({
        correlationId: input.runId,
        runId: input.runId,
        eventType: "RUN_CREATED",
        payload: {
          issue_number: input.issueNumber,
          idempotency_key: input.idempotencyKey,
          base_sha: input.baseSha,
          plan_hash: input.planHash,
          source_snapshot_hash: input.sourceSnapshotHash,
        },
        now: input.now,
      });
    });

    const run = this.getRun(input.runId);
    if (!run) {
      throw new OrchestratorError(
        "STATE_STORE_WRITE_FAILED",
        "Run was not persisted",
      );
    }
    return { created: true, run };
  }

  getRun(runId: string): RunRecord | null {
    const row = this.#db
      .prepare("SELECT * FROM runs WHERE run_id = ?")
      .get(runId);
    if (!row) return null;
    try {
      return toRun(asRow(row));
    } catch (error) {
      this.#persistFatalMarker(error);
      throw error;
    }
  }

  bindImplementationTarget(input: {
    runId: string;
    targetRepository: string;
    targetRemote: string;
    targetBranch: string;
    targetHeadSha: string;
    worktreeId: string;
    authorizedFilesHash: string;
    packageHash: string;
    correlationId: string;
    now: Date;
  }): RunRecord {
    this.assertEffectsAllowed(input.runId);
    return this.#withImmediate(() => {
      const row = this.#db
        .prepare("SELECT * FROM runs WHERE run_id = ?")
        .get(input.runId);
      if (!row) {
        throw new OrchestratorError(
          "RUN_NOT_FOUND",
          `Run ${input.runId} was not found`,
        );
      }
      const run = toRun(asRow(row));
      if (run.state !== "PLAN_APPROVED" && run.state !== "READY_TO_DISPATCH") {
        throw new OrchestratorError(
          "INVALID_TARGET_BINDING_STATE",
          "Implementation target can only be bound after plan approval and before implementation",
        );
      }

      const requested = [
        input.targetRepository,
        input.targetRemote,
        input.targetBranch,
        input.targetHeadSha,
        input.worktreeId,
        input.authorizedFilesHash,
        input.packageHash,
      ];
      const existing = [
        run.targetRepository,
        run.targetRemote,
        run.targetBranch,
        run.targetHeadSha,
        run.worktreeId,
        run.authorizedFilesHash,
        run.packageHash,
      ];
      const isUnbound = existing.every((value) => value === null);
      const isSame = existing.every(
        (value, index) => value === requested[index],
      );
      if (!isUnbound && !isSame) {
        throw new OrchestratorError(
          "TARGET_BINDING_MISMATCH",
          "Run is already bound to a different implementation target",
        );
      }
      if (isSame) return run;

      const now = input.now.toISOString();
      this.#db
        .prepare(
          `UPDATE runs SET
             target_repository = ?, target_remote = ?, target_branch = ?,
             target_head_sha = ?, worktree_id = ?, authorized_files_hash = ?,
             package_hash = ?, updated_at = ?
           WHERE run_id = ?`,
        )
        .run(
          input.targetRepository,
          input.targetRemote,
          input.targetBranch,
          input.targetHeadSha,
          input.worktreeId,
          input.authorizedFilesHash,
          input.packageHash,
          now,
          input.runId,
        );
      this.#appendAudit({
        correlationId: input.correlationId,
        runId: input.runId,
        eventType: "IMPLEMENTATION_TARGET_BOUND",
        payload: {
          target_repository: input.targetRepository,
          target_remote: input.targetRemote,
          target_branch: input.targetBranch,
          target_head_sha: input.targetHeadSha,
          worktree_id: input.worktreeId,
          authorized_files_hash: input.authorizedFilesHash,
          package_hash: input.packageHash,
        },
        now: input.now,
      });
      const updated = this.#db
        .prepare("SELECT * FROM runs WHERE run_id = ?")
        .get(input.runId);
      return toRun(asRow(updated));
    });
  }

  #hasCurrentApproval(runId: string, effect: ApprovalKind, now: Date): boolean {
    const row = this.#db
      .prepare(
        `SELECT 1 FROM approvals
         WHERE run_id = ? AND effect = ? AND expires_at > ?
         LIMIT 1`,
      )
      .get(runId, effect, now.toISOString());
    return Boolean(row);
  }

  transitionRun(input: {
    runId: string;
    to: RunState;
    reason: string;
    correlationId: string;
    now: Date;
  }): RunRecord {
    this.assertEffectsAllowed(input.runId);
    this.#withImmediate(() => {
      const row = this.#db
        .prepare("SELECT * FROM runs WHERE run_id = ?")
        .get(input.runId);
      if (!row) {
        throw new OrchestratorError(
          "RUN_NOT_FOUND",
          `Run ${input.runId} was not found`,
        );
      }
      const run = toRun(asRow(row));
      assertTransition(run.state, input.to);
      if (EXTERNAL_GUARD_STATES.has(input.to)) {
        throw new OrchestratorError(
          "EXTERNAL_GUARD_REQUIRED",
          `Transition to ${input.to} is disabled until its GitHub/CI guard adapter is implemented`,
        );
      }
      const requiredApproval = APPROVAL_GUARDS[input.to];
      if (
        requiredApproval &&
        !this.#hasCurrentApproval(input.runId, requiredApproval, input.now)
      ) {
        throw new OrchestratorError(
          "APPROVAL_REQUIRED",
          `Transition to ${input.to} requires a current ${requiredApproval}`,
        );
      }
      if (
        input.to === "READY_TO_DISPATCH" &&
        run.state === "PLAN_APPROVED" &&
        run.worktreeId === null
      ) {
        throw new OrchestratorError(
          "TARGET_BINDING_REQUIRED",
          "READY_TO_DISPATCH requires an immutable implementation target binding",
        );
      }

      const now = input.now.toISOString();
      const update = this.#db
        .prepare(
          "UPDATE runs SET state = ?, updated_at = ? WHERE run_id = ? AND state = ?",
        )
        .run(input.to, now, input.runId, run.state);
      if (Number(update.changes) !== 1) {
        throw new OrchestratorError(
          "CONCURRENT_STATE_CHANGE",
          "Run state changed concurrently",
        );
      }
      this.#db
        .prepare(
          `INSERT INTO transitions(
            run_id, from_state, to_state, reason, correlation_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          input.runId,
          run.state,
          input.to,
          input.reason,
          input.correlationId,
          now,
        );
      this.#appendAudit({
        correlationId: input.correlationId,
        runId: input.runId,
        eventType: "STATE_TRANSITION",
        payload: { from: run.state, to: input.to, reason: input.reason },
        now: input.now,
      });
    });

    const updated = this.getRun(input.runId);
    if (!updated) {
      throw new OrchestratorError(
        "STATE_STORE_WRITE_FAILED",
        "Run disappeared after transition",
      );
    }
    return updated;
  }

  acquireDispatchLeases(input: {
    runId: string;
    issueNumber: number;
    worktreeId: string;
    ttlMs: number;
    holderPid: number;
    now: Date;
  }): {
    issueLease: LeaseRecord;
    worktreeLease: LeaseRecord;
    idempotent: boolean;
  } {
    if (!Number.isFinite(input.ttlMs) || input.ttlMs <= 0) {
      throw new OrchestratorError(
        "INVALID_LEASE_TTL",
        "Lease TTL must be positive",
      );
    }
    this.assertEffectsAllowed(input.runId);

    try {
      return this.#withImmediate(() => {
        const runRow = this.#db
          .prepare("SELECT * FROM runs WHERE run_id = ?")
          .get(input.runId);
        if (!runRow) {
          throw new OrchestratorError(
            "RUN_NOT_FOUND",
            `Run ${input.runId} was not found`,
          );
        }
        const run = toRun(asRow(runRow));
        if (run.state !== "READY_TO_DISPATCH") {
          throw new OrchestratorError(
            "LEASE_STATE_MISMATCH",
            "Dispatch leases require READY_TO_DISPATCH",
          );
        }
        if (run.issueNumber !== input.issueNumber) {
          throw new OrchestratorError(
            "LEASE_CONTEXT_MISMATCH",
            "Lease issue does not match the run issue",
          );
        }
        if (run.worktreeId !== input.worktreeId) {
          throw new OrchestratorError(
            "LEASE_CONTEXT_MISMATCH",
            "Lease worktree does not match the immutable run target",
          );
        }

        const now = input.now.toISOString();
        const expiresAt = new Date(
          input.now.getTime() + input.ttlMs,
        ).toISOString();
        this.#db
          .prepare(
            "UPDATE leases SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at <= ?",
          )
          .run(now);

        const existingIssue = this.#db
          .prepare(
            "SELECT * FROM leases WHERE kind = 'ISSUE' AND issue_number = ? AND status = 'ACTIVE'",
          )
          .get(input.issueNumber);
        const existingWorktree = this.#db
          .prepare(
            "SELECT * FROM leases WHERE kind = 'WORKTREE' AND worktree_id = ? AND status = 'ACTIVE'",
          )
          .get(input.worktreeId);

        if (existingIssue || existingWorktree) {
          if (!existingIssue || !existingWorktree) {
            return this.#quarantineAndThrowPartialLease(
              input.runId,
              input.now,
              "Only one dispatch lease exists",
            );
          }
          const issueLease = toLease(asRow(existingIssue));
          const worktreeLease = toLease(asRow(existingWorktree));
          if (
            issueLease.runId !== input.runId ||
            worktreeLease.runId !== input.runId ||
            issueLease.holderPid !== input.holderPid ||
            worktreeLease.holderPid !== input.holderPid
          ) {
            throw new OrchestratorError(
              "LEASE_CONFLICT",
              "Issue or worktree is already leased by another run or process",
            );
          }
          return { issueLease, worktreeLease, idempotent: true };
        }

        const issueLeaseId = randomUUID();
        const worktreeLeaseId = randomUUID();
        const insert = this.#db.prepare(
          `INSERT INTO leases(
          lease_id, kind, run_id, issue_number, worktree_id, status,
          holder_pid, acquired_at, expires_at, heartbeat_at, released_at
        ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, NULL)`,
        );
        insert.run(
          issueLeaseId,
          "ISSUE",
          input.runId,
          input.issueNumber,
          null,
          input.holderPid,
          now,
          expiresAt,
          now,
        );
        insert.run(
          worktreeLeaseId,
          "WORKTREE",
          input.runId,
          null,
          input.worktreeId,
          input.holderPid,
          now,
          expiresAt,
          now,
        );
        this.#appendAudit({
          correlationId: input.runId,
          runId: input.runId,
          eventType: "DISPATCH_LEASES_ACQUIRED",
          payload: {
            issue_number: input.issueNumber,
            worktree_id: input.worktreeId,
            holder_pid: input.holderPid,
            expires_at: expiresAt,
          },
          now: input.now,
        });

        const issueLease = this.#db
          .prepare("SELECT * FROM leases WHERE lease_id = ?")
          .get(issueLeaseId);
        const worktreeLease = this.#db
          .prepare("SELECT * FROM leases WHERE lease_id = ?")
          .get(worktreeLeaseId);
        return {
          issueLease: toLease(asRow(issueLease)),
          worktreeLease: toLease(asRow(worktreeLease)),
          idempotent: false,
        };
      });
    } catch (error) {
      if (
        error instanceof OrchestratorError &&
        error.code === "PARTIAL_LEASE_CONFLICT"
      ) {
        try {
          this.quarantineRun({
            runId: input.runId,
            reason: `PARTIAL_LEASE_CONFLICT: ${error.message}`,
            correlationId: input.runId,
            now: input.now,
          });
        } catch {
          // Preserve the lease conflict as the primary failure.
        }
      }
      throw error;
    }
  }

  #quarantineAndThrowPartialLease(
    _runId: string,
    _now: Date,
    reason: string,
  ): never {
    throw new OrchestratorError("PARTIAL_LEASE_CONFLICT", reason);
  }

  heartbeatDispatchLeases(input: {
    runId: string;
    holderPid: number;
    ttlMs: number;
    now: Date;
  }): readonly LeaseRecord[] {
    if (!Number.isFinite(input.ttlMs) || input.ttlMs <= 0) {
      throw new OrchestratorError(
        "INVALID_LEASE_TTL",
        "Lease TTL must be positive",
      );
    }
    this.assertEffectsAllowed(input.runId);
    try {
      return this.#withImmediate(() => {
        const run = this.getRun(input.runId);
        if (!run) {
          throw new OrchestratorError(
            "RUN_NOT_FOUND",
            `Run ${input.runId} was not found`,
          );
        }
        if (
          run.state !== "READY_TO_DISPATCH" &&
          run.state !== "RUNNING_IMPLEMENTATION"
        ) {
          throw new OrchestratorError(
            "LEASE_STATE_MISMATCH",
            "Lease heartbeat is not allowed in the current run state",
          );
        }
        const active = this.#db
          .prepare(
            "SELECT * FROM leases WHERE run_id = ? AND status = 'ACTIVE' ORDER BY kind",
          )
          .all(input.runId) as unknown[];
        if (active.length !== 2) {
          return this.#quarantineAndThrowPartialLease(
            input.runId,
            input.now,
            "Heartbeat requires a complete lease pair",
          );
        }
        const leases = active.map((row) => toLease(asRow(row)));
        if (leases.some((lease) => lease.holderPid !== input.holderPid)) {
          throw new OrchestratorError(
            "LEASE_HOLDER_MISMATCH",
            "Only the current lease holder may renew leases",
          );
        }
        const now = input.now.toISOString();
        const expiresAt = new Date(
          input.now.getTime() + input.ttlMs,
        ).toISOString();
        const update = this.#db
          .prepare(
            `UPDATE leases SET heartbeat_at = ?, expires_at = ?
           WHERE run_id = ? AND status = 'ACTIVE' AND holder_pid = ?`,
          )
          .run(now, expiresAt, input.runId, input.holderPid);
        if (Number(update.changes) !== 2) {
          return this.#quarantineAndThrowPartialLease(
            input.runId,
            input.now,
            "Heartbeat update did not affect the complete lease pair",
          );
        }
        this.#appendAudit({
          correlationId: input.runId,
          runId: input.runId,
          eventType: "DISPATCH_LEASES_HEARTBEAT",
          payload: { holder_pid: input.holderPid, expires_at: expiresAt },
          now: input.now,
        });
        const renewed = this.#db
          .prepare(
            "SELECT * FROM leases WHERE run_id = ? AND status = 'ACTIVE' ORDER BY kind",
          )
          .all(input.runId) as unknown[];
        return Object.freeze(renewed.map((row) => toLease(asRow(row))));
      });
    } catch (error) {
      if (
        error instanceof OrchestratorError &&
        error.code === "PARTIAL_LEASE_CONFLICT"
      ) {
        try {
          this.quarantineRun({
            runId: input.runId,
            reason: `PARTIAL_LEASE_CONFLICT: ${error.message}`,
            correlationId: input.runId,
            now: input.now,
          });
        } catch {
          // Preserve the lease conflict as the primary failure.
        }
      }
      throw error;
    }
  }

  releaseDispatchLeases(input: {
    runId: string;
    holderPid: number;
    reason: string;
    now: Date;
  }): { released: number; idempotent: boolean } {
    this.assertEffectsAllowed(input.runId);
    try {
      return this.#withImmediate(() => {
        const active = this.#db
          .prepare(
            "SELECT * FROM leases WHERE run_id = ? AND status = 'ACTIVE'",
          )
          .all(input.runId) as unknown[];
        if (active.length === 0) {
          const historical = scalarNumber(
            this.#db
              .prepare(
                `SELECT COUNT(*) AS count FROM leases
               WHERE run_id = ? AND status IN ('RELEASED', 'EXPIRED')`,
              )
              .get(input.runId),
          );
          if (historical >= 2) return { released: 0, idempotent: true };
          throw new OrchestratorError(
            "LEASE_NOT_FOUND",
            "No dispatch leases exist for the run",
          );
        }
        if (active.length !== 2) {
          return this.#quarantineAndThrowPartialLease(
            input.runId,
            input.now,
            "Release requires a complete lease pair",
          );
        }
        const leases = active.map((row) => toLease(asRow(row)));
        if (leases.some((lease) => lease.holderPid !== input.holderPid)) {
          throw new OrchestratorError(
            "LEASE_HOLDER_MISMATCH",
            "Only the current lease holder may release leases",
          );
        }
        const now = input.now.toISOString();
        const update = this.#db
          .prepare(
            `UPDATE leases SET status = 'RELEASED', released_at = ?
           WHERE run_id = ? AND status = 'ACTIVE' AND holder_pid = ?`,
          )
          .run(now, input.runId, input.holderPid);
        if (Number(update.changes) !== 2) {
          return this.#quarantineAndThrowPartialLease(
            input.runId,
            input.now,
            "Release update did not affect the complete lease pair",
          );
        }
        this.#appendAudit({
          correlationId: input.runId,
          runId: input.runId,
          eventType: "DISPATCH_LEASES_RELEASED",
          payload: { holder_pid: input.holderPid, reason: input.reason },
          now: input.now,
        });
        return { released: 2, idempotent: false };
      });
    } catch (error) {
      if (
        error instanceof OrchestratorError &&
        error.code === "PARTIAL_LEASE_CONFLICT"
      ) {
        try {
          this.quarantineRun({
            runId: input.runId,
            reason: `PARTIAL_LEASE_CONFLICT: ${error.message}`,
            correlationId: input.runId,
            now: input.now,
          });
        } catch {
          // Preserve the lease conflict as the primary failure.
        }
      }
      throw error;
    }
  }

  recoverStaleLeases(input: {
    now: Date;
    isProcessAlive: (pid: number) => boolean;
  }): {
    recoveredRunIds: readonly string[];
    quarantinedRunIds: readonly string[];
  } {
    return this.#withImmediate(() => {
      const rows = this.#db
        .prepare(
          "SELECT * FROM leases WHERE status = 'ACTIVE' ORDER BY run_id, kind",
        )
        .all() as unknown[];
      const byRun = new Map<string, LeaseRecord[]>();
      for (const row of rows) {
        const lease = toLease(asRow(row));
        const current = byRun.get(lease.runId) ?? [];
        current.push(lease);
        byRun.set(lease.runId, current);
      }

      const recovered: string[] = [];
      const quarantined: string[] = [];
      for (const [runId, leases] of byRun) {
        const completePair =
          leases.length === 2 &&
          leases.some((lease) => lease.kind === "ISSUE") &&
          leases.some((lease) => lease.kind === "WORKTREE") &&
          leases[0]?.holderPid === leases[1]?.holderPid;
        if (!completePair) {
          this.#quarantineRunInTransaction({
            runId,
            reason: "RECOVERY_FOUND_PARTIAL_LEASE_PAIR",
            correlationId: runId,
            now: input.now,
          });
          quarantined.push(runId);
          continue;
        }

        const holderPid = leases[0]?.holderPid ?? 0;
        const expired = leases.some(
          (lease) => Date.parse(lease.expiresAt) <= input.now.getTime(),
        );
        const dead = !input.isProcessAlive(holderPid);
        if (!expired && !dead) continue;

        const now = input.now.toISOString();
        this.#db
          .prepare(
            `UPDATE leases SET status = 'EXPIRED', released_at = ?
             WHERE run_id = ? AND status = 'ACTIVE'`,
          )
          .run(now, runId);
        const runRow = this.#db
          .prepare("SELECT * FROM runs WHERE run_id = ?")
          .get(runId);
        if (runRow) {
          const run = toRun(asRow(runRow));
          if (!TERMINAL_STATES.has(run.state) && run.state !== "BLOCKED") {
            this.#db
              .prepare(
                "UPDATE runs SET state = 'BLOCKED', updated_at = ? WHERE run_id = ?",
              )
              .run(now, runId);
            this.#db
              .prepare(
                `INSERT INTO transitions(
                  run_id, from_state, to_state, reason, correlation_id, created_at
                ) VALUES (?, ?, 'BLOCKED', ?, ?, ?)`,
              )
              .run(
                runId,
                run.state,
                dead ? "LEASE_HOLDER_PROCESS_DEAD" : "LEASE_EXPIRED",
                runId,
                now,
              );
          }
        }
        this.#appendAudit({
          correlationId: runId,
          runId,
          eventType: "STALE_LEASES_RECOVERED",
          payload: { holder_pid: holderPid, expired, process_dead: dead },
          now: input.now,
        });
        recovered.push(runId);
      }

      return {
        recoveredRunIds: Object.freeze(recovered),
        quarantinedRunIds: Object.freeze(quarantined),
      };
    });
  }

  #assertApprovalBinding(
    run: RunRecord,
    observed: ObservedApproval,
    effect: ApprovalKind,
  ): void {
    const body = observed.body;
    if (body.approval_kind !== effect) {
      throw new OrchestratorError(
        "APPROVAL_EFFECT_MISMATCH",
        "effect must exactly match approval_kind",
      );
    }
    if (
      body.repository !== run.repository ||
      Number(body.issue_number) !== run.issueNumber
    ) {
      throw new OrchestratorError(
        "APPROVAL_RUN_BINDING_MISMATCH",
        "Approval repository or issue does not match the target run",
      );
    }

    if (effect === "PLAN_APPROVED") {
      if (
        String(body.base_sha) !== run.baseSha ||
        String(body.plan_hash) !== run.planHash ||
        String(body.source_snapshot_hash) !== run.sourceSnapshotHash
      ) {
        throw new OrchestratorError(
          "APPROVAL_RUN_BINDING_MISMATCH",
          "PLAN_APPROVED does not match the run base, plan or source snapshot",
        );
      }
      return;
    }

    if (effect === "IMPLEMENT_APPROVED") {
      if (
        run.targetBranch === null ||
        run.targetHeadSha === null ||
        run.worktreeId === null ||
        run.authorizedFilesHash === null ||
        run.packageHash === null ||
        String(body.target_branch) !== run.targetBranch ||
        String(body.target_head_sha) !== run.targetHeadSha ||
        String(body.target_worktree_id) !== run.worktreeId ||
        String(body.authorized_files_hash) !== run.authorizedFilesHash ||
        String(body.package_hash) !== run.packageHash
      ) {
        throw new OrchestratorError(
          "APPROVAL_RUN_BINDING_MISMATCH",
          "IMPLEMENT_APPROVED does not match the immutable implementation target",
        );
      }
      return;
    }

    if (effect === "PUSH_APPROVED") {
      if (
        run.targetRepository === null ||
        run.targetRemote === null ||
        run.targetBranch === null ||
        run.targetHeadSha === null ||
        run.packageHash === null ||
        String(body.target_repository) !== run.targetRepository ||
        String(body.target_remote) !== run.targetRemote ||
        String(body.target_branch) !== run.targetBranch ||
        String(body.target_head_sha) !== run.targetHeadSha ||
        String(body.package_hash) !== run.packageHash
      ) {
        throw new OrchestratorError(
          "APPROVAL_RUN_BINDING_MISMATCH",
          "PUSH_APPROVED does not match the immutable publication target",
        );
      }
      return;
    }

    if (
      run.pullRequestNumber === null ||
      run.pullRequestHeadSha === null ||
      Number(body.pull_request_number) !== run.pullRequestNumber ||
      String(body.pull_request_head_sha) !== run.pullRequestHeadSha
    ) {
      throw new OrchestratorError(
        "EXTERNAL_GUARD_REQUIRED",
        "MERGE_APPROVED cannot be consumed before a verified PR binding exists",
      );
    }
  }

  recordApprovalEffect(input: {
    observedApproval: ObservedApproval;
    effect: ApprovalKind;
    runId: string;
    observedAt: Date;
  }): { recorded: boolean } {
    this.assertEffectsAllowed(input.runId);
    try {
      return this.#withImmediate(() => {
        const runRow = this.#db
          .prepare("SELECT * FROM runs WHERE run_id = ?")
          .get(input.runId);
        if (!runRow) {
          throw new OrchestratorError(
            "RUN_NOT_FOUND",
            `Run ${input.runId} was not found`,
          );
        }
        const run = toRun(asRow(runRow));
        this.#assertApprovalBinding(run, input.observedApproval, input.effect);

        const body = input.observedApproval.body;
        if (Date.parse(body.expires_at) <= input.observedAt.getTime()) {
          throw new OrchestratorError(
            "APPROVAL_EXPIRED",
            "Approval expired before its effect was recorded",
          );
        }
        const bodyJson = JSON.stringify(body);
        const existing = this.#db
          .prepare(
            `SELECT * FROM approvals
             WHERE approval_event_id = ? OR nonce = ? OR approval_comment_id = ?
             LIMIT 1`,
          )
          .get(
            String(body.approval_event_id),
            String(body.nonce),
            input.observedApproval.approval_comment_id,
          );
        if (existing) {
          const row = asRow(existing);
          const exactReplay =
            String(row.approval_event_id) === String(body.approval_event_id) &&
            String(row.nonce) === String(body.nonce) &&
            String(row.effect) === input.effect &&
            String(row.run_id) === input.runId &&
            String(row.body_json) === bodyJson &&
            Number(row.approval_comment_id) ===
              input.observedApproval.approval_comment_id &&
            String(row.approval_author_login) ===
              input.observedApproval.approval_author_login &&
            String(row.approval_comment_created_at) ===
              input.observedApproval.approval_comment_created_at &&
            String(row.approval_comment_updated_at) ===
              input.observedApproval.approval_comment_updated_at;
          if (exactReplay) return { recorded: false };
          throw new OrchestratorError(
            "APPROVAL_REPLAY_DENIED",
            "Approval event, nonce or comment was already consumed with different protected data",
          );
        }

        this.#db
          .prepare(
            `INSERT INTO approvals(
              approval_event_id, nonce, effect, run_id, approval_kind,
              repository, issue_number, expires_at, body_json,
              approval_comment_id, approval_author_login,
              approval_comment_created_at, approval_comment_updated_at,
              observed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            String(body.approval_event_id),
            String(body.nonce),
            input.effect,
            input.runId,
            String(body.approval_kind),
            String(body.repository),
            Number(body.issue_number),
            String(body.expires_at),
            bodyJson,
            input.observedApproval.approval_comment_id,
            input.observedApproval.approval_author_login,
            input.observedApproval.approval_comment_created_at,
            input.observedApproval.approval_comment_updated_at,
            input.observedAt.toISOString(),
          );
        this.#appendAudit({
          correlationId: input.runId,
          runId: input.runId,
          eventType: "APPROVAL_EFFECT_RECORDED",
          payload: {
            approval_event_id: body.approval_event_id,
            nonce: body.nonce,
            approval_comment_id: input.observedApproval.approval_comment_id,
            approval_author_login: input.observedApproval.approval_author_login,
            effect: input.effect,
          },
          now: input.observedAt,
        });
        return { recorded: true };
      });
    } catch (error) {
      if (
        error instanceof OrchestratorError &&
        [
          "APPROVAL_RUN_BINDING_MISMATCH",
          "APPROVAL_REPLAY_DENIED",
          "APPROVAL_EFFECT_MISMATCH",
        ].includes(error.code)
      ) {
        try {
          this.quarantineRun({
            runId: input.runId,
            reason: `${error.code}: ${error.message}`,
            correlationId: input.runId,
            now: input.observedAt,
          });
        } catch {
          // Preserve the approval validation error as the primary failure.
        }
      }
      throw error;
    }
  }

  listAuditEvents(runId: string): readonly Readonly<Record<string, unknown>>[] {
    const rows = this.#db
      .prepare(
        `SELECT sequence, correlation_id, run_id, event_type, payload_json, created_at
         FROM audit_events WHERE run_id = ? ORDER BY sequence ASC`,
      )
      .all(runId) as unknown[];
    return Object.freeze(
      rows.map((row) => {
        const value = asRow(row);
        return Object.freeze({
          sequence: Number(value.sequence),
          correlation_id: String(value.correlation_id),
          run_id: String(value.run_id),
          event_type: String(value.event_type),
          payload: JSON.parse(String(value.payload_json)) as unknown,
          created_at: String(value.created_at),
        });
      }),
    );
  }

  close(): void {
    this.#db.close();
  }
}
