import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { OrchestratorError } from "./errors.ts";
import {
  assertTransition,
  isRunState,
  type RunState,
} from "./state-machine.ts";

export type RunRecord = Readonly<{
  runId: string;
  repository: string;
  issueNumber: number;
  state: RunState;
  idempotencyKey: string;
  baseSha: string;
  planHash: string;
  sourceSnapshotHash: string;
  worktreeId: string | null;
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

export interface StateStore {
  integrityCheck(): void;
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
  recordApprovalEffect(input: {
    approvalEventId: string;
    effect: string;
    runId: string;
    observedAt: Date;
  }): { recorded: boolean };
  listAuditEvents(runId: string): readonly Readonly<Record<string, unknown>>[];
  close(): void;
}

type DbRow = Record<string, string | number | null>;

const APPROVAL_GUARDS: Readonly<Partial<Record<RunState, string>>> = {
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

function asRow(value: unknown): DbRow {
  return (value ?? {}) as DbRow;
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
    worktreeId: row.worktree_id === null ? null : String(row.worktree_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  });
}

function toLease(row: DbRow): LeaseRecord {
  return Object.freeze({
    leaseId: String(row.lease_id),
    kind: String(row.kind) as LeaseRecord["kind"],
    runId: String(row.run_id),
    issueNumber: row.issue_number === null ? null : Number(row.issue_number),
    worktreeId: row.worktree_id === null ? null : String(row.worktree_id),
    status: String(row.status) as LeaseRecord["status"],
    holderPid: Number(row.holder_pid),
    acquiredAt: String(row.acquired_at),
    expiresAt: String(row.expires_at),
    heartbeatAt: String(row.heartbeat_at),
  });
}

export class SqliteStateStore implements StateStore {
  readonly #db: DatabaseSync;

  private constructor(databasePath: string) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
    }
    this.#db = new DatabaseSync(databasePath);
    this.#initialize();
  }

  static open(databasePath: string): SqliteStateStore {
    return new SqliteStateStore(databasePath);
  }

  #initialize(): void {
    this.#db.exec("PRAGMA foreign_keys = ON;");
    this.#db.exec("PRAGMA busy_timeout = 5000;");
    this.#db.exec("PRAGMA journal_mode = WAL;");
    this.#db.exec(`
      CREATE TABLE IF NOT EXISTS schema_meta (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
      INSERT OR IGNORE INTO schema_meta(version, applied_at)
      VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

      CREATE TABLE IF NOT EXISTS runs (
        run_id TEXT PRIMARY KEY,
        repository TEXT NOT NULL,
        issue_number INTEGER NOT NULL,
        state TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        base_sha TEXT NOT NULL,
        plan_hash TEXT NOT NULL,
        source_snapshot_hash TEXT NOT NULL,
        worktree_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transitions (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL REFERENCES runs(run_id),
        from_state TEXT NOT NULL,
        to_state TEXT NOT NULL,
        reason TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS leases (
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
        CHECK(
          (kind = 'ISSUE' AND issue_number IS NOT NULL AND worktree_id IS NULL)
          OR
          (kind = 'WORKTREE' AND issue_number IS NULL AND worktree_id IS NOT NULL)
        )
      );

      CREATE UNIQUE INDEX IF NOT EXISTS one_active_issue_lease
      ON leases(issue_number)
      WHERE kind = 'ISSUE' AND status = 'ACTIVE';

      CREATE UNIQUE INDEX IF NOT EXISTS one_active_worktree_lease
      ON leases(worktree_id)
      WHERE kind = 'WORKTREE' AND status = 'ACTIVE';

      CREATE TABLE IF NOT EXISTS approval_effects (
        approval_event_id TEXT NOT NULL,
        effect TEXT NOT NULL,
        run_id TEXT NOT NULL REFERENCES runs(run_id),
        observed_at TEXT NOT NULL,
        PRIMARY KEY (approval_event_id, effect)
      );

      CREATE TABLE IF NOT EXISTS audit_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        correlation_id TEXT NOT NULL,
        run_id TEXT REFERENCES runs(run_id),
        event_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    this.integrityCheck();
  }

  integrityCheck(): void {
    const row = asRow(this.#db.prepare("PRAGMA integrity_check").get());
    const result = String(row.integrity_check ?? "");
    if (result !== "ok") {
      throw new OrchestratorError(
        "STATE_STORE_INTEGRITY_FAILED",
        "SQLite integrity check failed; dispatch is blocked",
        { details: { result } },
      );
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
    const existing = this.#db
      .prepare("SELECT * FROM runs WHERE idempotency_key = ?")
      .get(input.idempotencyKey);
    if (existing) {
      const run = toRun(asRow(existing));
      const same =
        run.repository === input.repository &&
        run.issueNumber === input.issueNumber &&
        run.baseSha === input.baseSha &&
        run.planHash === input.planHash &&
        run.sourceSnapshotHash === input.sourceSnapshotHash;
      if (!same) {
        throw new OrchestratorError(
          "IDEMPOTENCY_COLLISION",
          "Idempotency key already belongs to different immutable inputs",
        );
      }
      return { created: false, run };
    }

    const now = input.now.toISOString();
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      this.#db
        .prepare(
          `INSERT INTO runs(
            run_id, repository, issue_number, state, idempotency_key,
            base_sha, plan_hash, source_snapshot_hash, worktree_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, NULL, ?, ?)`,
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
        },
        now: input.now,
      });
      this.#db.exec("COMMIT");
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
    const run = this.getRun(input.runId);
    if (!run)
      throw new OrchestratorError(
        "STATE_STORE_WRITE_FAILED",
        "Run was not persisted",
      );
    return { created: true, run };
  }

  getRun(runId: string): RunRecord | null {
    const row = this.#db
      .prepare("SELECT * FROM runs WHERE run_id = ?")
      .get(runId);
    return row ? toRun(asRow(row)) : null;
  }

  transitionRun(input: {
    runId: string;
    to: RunState;
    reason: string;
    correlationId: string;
    now: Date;
  }): RunRecord {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
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
      if (requiredApproval) {
        const approval = this.#db
          .prepare(
            "SELECT 1 FROM approval_effects WHERE run_id = ? AND effect = ? LIMIT 1",
          )
          .get(input.runId, requiredApproval);
        if (!approval) {
          throw new OrchestratorError(
            "APPROVAL_REQUIRED",
            `Transition to ${input.to} requires ${requiredApproval}`,
          );
        }
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
      this.#db.exec("COMMIT");
    } catch (error) {
      this.#db.exec("ROLLBACK");
      throw error;
    }
    const updated = this.getRun(input.runId);
    if (!updated)
      throw new OrchestratorError(
        "STATE_STORE_WRITE_FAILED",
        "Run disappeared after transition",
      );
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
    const run = this.getRun(input.runId);
    if (!run)
      throw new OrchestratorError(
        "RUN_NOT_FOUND",
        `Run ${input.runId} was not found`,
      );

    const now = input.now.toISOString();
    const expiresAt = new Date(input.now.getTime() + input.ttlMs).toISOString();
    this.#db.exec("BEGIN IMMEDIATE");
    try {
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
          throw new OrchestratorError(
            "PARTIAL_LEASE_CONFLICT",
            "Only one dispatch lease exists; manual recovery is required",
          );
        }
        const issueLease = toLease(asRow(existingIssue));
        const worktreeLease = toLease(asRow(existingWorktree));
        if (
          issueLease.runId !== input.runId ||
          worktreeLease.runId !== input.runId
        ) {
          throw new OrchestratorError(
            "LEASE_CONFLICT",
            "Issue or worktree is already leased by another run",
          );
        }
        this.#db.exec("COMMIT");
        return { issueLease, worktreeLease, idempotent: true };
      }

      const issueLeaseId = randomUUID();
      const worktreeLeaseId = randomUUID();
      const insert = this.#db.prepare(
        `INSERT INTO leases(
          lease_id, kind, run_id, issue_number, worktree_id, status,
          holder_pid, acquired_at, expires_at, heartbeat_at
        ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
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
      this.#db
        .prepare(
          "UPDATE runs SET worktree_id = ?, updated_at = ? WHERE run_id = ?",
        )
        .run(input.worktreeId, now, input.runId);
      this.#appendAudit({
        correlationId: input.runId,
        runId: input.runId,
        eventType: "DISPATCH_LEASES_ACQUIRED",
        payload: {
          issue_number: input.issueNumber,
          worktree_id: input.worktreeId,
          expires_at: expiresAt,
        },
        now: input.now,
      });
      this.#db.exec("COMMIT");

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
    } catch (error) {
      try {
        this.#db.exec("ROLLBACK");
      } catch {
        // The transaction may already have committed in the idempotent branch.
      }
      throw error;
    }
  }

  recordApprovalEffect(input: {
    approvalEventId: string;
    effect: string;
    runId: string;
    observedAt: Date;
  }): { recorded: boolean } {
    const existing = this.#db
      .prepare(
        "SELECT run_id FROM approval_effects WHERE approval_event_id = ? AND effect = ?",
      )
      .get(input.approvalEventId, input.effect);
    if (existing) {
      if (String(asRow(existing).run_id) !== input.runId) {
        throw new OrchestratorError(
          "APPROVAL_REPLAY_DENIED",
          "Approval effect was already consumed by another run",
        );
      }
      return { recorded: false };
    }
    this.#db
      .prepare(
        `INSERT INTO approval_effects(
          approval_event_id, effect, run_id, observed_at
        ) VALUES (?, ?, ?, ?)`,
      )
      .run(
        input.approvalEventId,
        input.effect,
        input.runId,
        input.observedAt.toISOString(),
      );
    this.#appendAudit({
      correlationId: input.runId,
      runId: input.runId,
      eventType: "APPROVAL_EFFECT_RECORDED",
      payload: {
        approval_event_id: input.approvalEventId,
        effect: input.effect,
      },
      now: input.observedAt,
    });
    return { recorded: true };
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
