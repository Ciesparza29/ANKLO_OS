import { readFile } from "node:fs/promises";

import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import {
  assertGitSha,
  assertSha256,
  createDefaultConfig,
  createStructuredResult,
  parseConfig,
  type OrchestratorConfig,
  type OutputFormat,
  type StructuredResult,
} from "./contracts.ts";
import {
  APPROVAL_KINDS,
  validateObservedApproval,
  type ApprovalKind,
} from "./approvals.ts";
import { normalizeError, OrchestratorError } from "./errors.ts";
import {
  assertKillSwitchOff,
  deterministicIdempotencyKey,
  isProcessAlive,
  newRunId,
  openStateStore,
  openStateStoreReadOnly,
  openStateStoreForRecovery,
  resolveStateDatabasePath,
} from "./orchestrator.ts";
import { assertCapability, DENIED_CAPABILITIES } from "./policy.ts";
import { isRunState } from "./state-machine.ts";
import { runPilotPreflight, type PreflightInput } from "./pilot-preflight.ts";

const COMMANDS = [
  "diagnose",
  "plan",
  "state:init",
  "state:inspect",
  "state:recover",
  "run:create",
  "run:bind-target",
  "run:transition",
  "run:quarantine",
  "lease:acquire",
  "lease:heartbeat",
  "lease:release",
  "lease:recover",
  "approval:validate",
  "safety:activate",
  "pilot:preflight",
] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(value: string): value is Command {
  return (COMMANDS as readonly string[]).includes(value);
}

function isApprovalKind(value: string): value is ApprovalKind {
  return (APPROVAL_KINDS as readonly string[]).includes(value);
}

function parsePositiveInteger(
  value: string | undefined,
  field: string,
): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new OrchestratorError(
      "INVALID_ARGUMENT",
      `${field} must be a positive integer`,
    );
  }
  return parsed;
}

function requireString(value: string | undefined, field: string): string {
  if (!value) {
    throw new OrchestratorError("INVALID_ARGUMENT", `${field} is required`);
  }
  return value;
}

async function loadConfig(
  path: string | undefined,
  cwd: string,
): Promise<OrchestratorConfig> {
  if (!path) return createDefaultConfig(cwd);
  const raw = await readFile(path, "utf8");
  return parseConfig(JSON.parse(raw) as unknown);
}

function renderHuman(result: StructuredResult): string {
  const lines = [
    `COMMAND=${result.command}`,
    `RESULT=${result.result}`,
    `DRY_RUN=${result.dry_run ? "YES" : "NO"}`,
    `SCHEMA_VERSION=${result.schema_version}`,
  ];
  for (const [key, value] of Object.entries(result.data)) {
    lines.push(
      `${key.toUpperCase()}=${typeof value === "string" ? value : JSON.stringify(value)}`,
    );
  }
  for (const error of result.errors) {
    lines.push(`ERROR=${error.code}|${error.message}`);
  }
  return `${lines.join("\n")}\n`;
}

function writeResult(result: StructuredResult, format: OutputFormat): void {
  process.stdout.write(
    format === "json" ? `${JSON.stringify(result)}\n` : renderHuman(result),
  );
}

function writeSuccess(input: {
  command: string;
  dryRun: boolean;
  data: Readonly<Record<string, unknown>>;
  format: OutputFormat;
}): void {
  writeResult(
    createStructuredResult({
      command: input.command,
      result: input.dryRun ? "DRY_RUN" : "PASS",
      dryRun: input.dryRun,
      data: input.data,
    }),
    input.format,
  );
}

export async function runCli(
  argv: readonly string[],
  context: { cwd?: string } = {},
): Promise<number> {
  let command = "unknown";
  let format: OutputFormat = "human";
  let attemptedApply = false;
  try {
    const parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      strict: true,
      options: {
        config: { type: "string" },
        format: { type: "string", default: "human" },
        issue: { type: "string" },
        apply: { type: "boolean", default: false },
        "state-db": { type: "string" },
        "run-id": { type: "string" },
        "base-sha": { type: "string" },
        "plan-hash": { type: "string" },
        "source-snapshot-hash": { type: "string" },
        to: { type: "string" },
        reason: { type: "string" },
        "worktree-id": { type: "string" },
        "ttl-seconds": { type: "string", default: "900" },
        "holder-pid": { type: "string" },
        "approval-file": { type: "string" },
        effect: { type: "string" },
        "target-repository": { type: "string" },
        "target-remote": { type: "string" },
        "target-branch": { type: "string" },
        "target-head-sha": { type: "string" },
        "authorized-files-hash": { type: "string" },
        "package-hash": { type: "string" },
        scope: { type: "string" },
      },
    });

    command = parsed.positionals[0] ?? "";
    if (!isCommand(command)) {
      throw new OrchestratorError(
        "UNKNOWN_COMMAND",
        `Unknown command: ${command || "<empty>"}`,
      );
    }
    if (parsed.values.format !== "human" && parsed.values.format !== "json") {
      throw new OrchestratorError(
        "INVALID_ARGUMENT",
        "format must be human or json",
      );
    }
    format = parsed.values.format;

    if (
      command === "pilot:preflight" &&
      parsed.values["state-db"] !== undefined
    ) {
      throw new OrchestratorError(
        "INVALID_ARGUMENT",
        "pilot:preflight does not accept --state-db; the canonical configured StateStore path is mandatory",
      );
    }

    const cwd = context.cwd ?? process.cwd();
    const config = await loadConfig(parsed.values.config, cwd);
    const apply = parsed.values.apply;
    attemptedApply = apply;

    if (command === "diagnose") {
      assertCapability(config.allowedCapabilities, "DIAGNOSE");
      const databasePath = resolveStateDatabasePath(
        config,
        parsed.values["state-db"],
      );
      writeSuccess({
        command,
        dryRun: true,
        format,
        data: {
          repository: config.repository,
          repo_root: config.repoRoot,
          runtime_dir: config.runtimeDir,
          state_db: databasePath,
          node_version: process.versions.node,
          dry_run_default: config.dryRunDefault,
          network_listeners: config.networkListeners,
          production_access: config.productionAccess,
          denied_capabilities: DENIED_CAPABILITIES,
          available_commands: COMMANDS,
        },
      });
      return 0;
    }

    if (command === "plan") {
      assertCapability(config.allowedCapabilities, "PLAN");
      if (apply) {
        throw new OrchestratorError(
          "APPLY_NOT_SUPPORTED",
          "plan never executes effects",
        );
      }
      const issue = parsePositiveInteger(parsed.values.issue, "issue");
      writeSuccess({
        command,
        dryRun: true,
        format,
        data: {
          repository: config.repository,
          issue,
          intended_effects: [
            "validate structured approval",
            "validate exact base SHA",
            "bind immutable implementation target",
            "acquire issue and worktree leases",
            "create isolated worktree",
            "generate immutable work package",
          ],
          effects_executed: 0,
        },
      });
      return 0;
    }

    if (command === "state:inspect") {
      assertCapability(config.allowedCapabilities, "STATE_READ");
      const databasePath = resolveStateDatabasePath(
        config,
        parsed.values["state-db"],
      );
      const store = openStateStoreReadOnly(config, parsed.values["state-db"]);
      try {
        const diagnostics = store.runtimeDiagnostics();
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: {
            state_db: databasePath,
            read_only: true,
            schema_version: diagnostics.schemaVersion,
            journal_mode: diagnostics.journalMode,
            foreign_keys: diagnostics.foreignKeys,
            busy_timeout_ms: diagnostics.busyTimeoutMs,
            integrity_check: diagnostics.integrityCheck,
          },
        });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "state:recover") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: {
            intended_effects: [
              "verify integrity",
              "verify structural schema",
              "verify pragmas",
              "record recovery audit event",
              "deactivate kill switch if active",
              "remove quarantine marker",
            ],
            effects_executed: 0,
          },
        });
        return 0;
      }
      const reason = requireString(parsed.values.reason, "reason");
      const store = openStateStoreForRecovery(
        config,
        parsed.values["state-db"],
      );
      try {
        const result = store.recoverFromQuarantine({
          reason,
          now: new Date(),
        });
        writeSuccess({
          command,
          dryRun: false,
          format,
          data: {
            recovered: result.recovered,
            reason,
          },
        });
      } finally {
        store.close();
      }
      return 0;
    }

    assertKillSwitchOff();

    if (command === "state:init") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      const databasePath = resolveStateDatabasePath(
        config,
        parsed.values["state-db"],
      );
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: { database_path: databasePath, effects_executed: 0 },
        });
        return 0;
      }
      const store = openStateStore(config, databasePath);
      try {
        const diagnostics = store.runtimeDiagnostics();
        writeSuccess({
          command,
          dryRun: false,
          format,
          data: { database_path: databasePath, ...diagnostics },
        });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "run:create") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      const issueNumber = parsePositiveInteger(parsed.values.issue, "issue");
      const baseSha = assertGitSha(
        requireString(parsed.values["base-sha"], "base-sha"),
        "base-sha",
      );
      const planHash = assertSha256(
        requireString(parsed.values["plan-hash"], "plan-hash"),
        "plan-hash",
      );
      const sourceSnapshotHash = assertSha256(
        requireString(
          parsed.values["source-snapshot-hash"],
          "source-snapshot-hash",
        ),
        "source-snapshot-hash",
      );
      const idempotencyKey = deterministicIdempotencyKey({
        repository: config.repository,
        issueNumber,
        baseSha,
        planHash,
        sourceSnapshotHash,
      });
      const runId = parsed.values["run-id"] ?? newRunId();
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: {
            run_id: runId,
            idempotency_key: idempotencyKey,
            effects_executed: 0,
          },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const created = store.createRun({
          runId,
          repository: config.repository,
          issueNumber,
          idempotencyKey,
          baseSha,
          planHash,
          sourceSnapshotHash,
          now: new Date(),
        });
        writeSuccess({
          command,
          dryRun: false,
          format,
          data: { created: created.created, run: created.run },
        });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "run:bind-target") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      // Reject --apply before touching StateStore: run:bind-target never
      // opens or mutates the state database when --apply is supplied without
      // a fully-structured plan-approval binding provided through the normal
      // approval:validate pathway.
      if (apply) {
        throw new OrchestratorError(
          "APPLY_NOT_SUPPORTED",
          "run:bind-target --apply is rejected: use approval:validate to record a plan approval binding before binding the implementation target",
        );
      }
      const runId = requireString(parsed.values["run-id"], "run-id");
      const targetRepository = requireString(
        parsed.values["target-repository"],
        "target-repository",
      );
      const targetRemote = requireString(
        parsed.values["target-remote"],
        "target-remote",
      );
      const targetBranch = requireString(
        parsed.values["target-branch"],
        "target-branch",
      );
      const targetHeadSha = assertGitSha(
        requireString(parsed.values["target-head-sha"], "target-head-sha"),
        "target-head-sha",
      );
      const worktreeId = requireString(
        parsed.values["worktree-id"],
        "worktree-id",
      );
      const authorizedFilesHash = assertSha256(
        requireString(
          parsed.values["authorized-files-hash"],
          "authorized-files-hash",
        ),
        "authorized-files-hash",
      );
      const packageHash = assertSha256(
        requireString(parsed.values["package-hash"], "package-hash"),
        "package-hash",
      );
      writeSuccess({
        command,
        dryRun: true,
        format,
        data: {
          run_id: runId,
          target_repository: targetRepository,
          target_remote: targetRemote,
          target_branch: targetBranch,
          target_head_sha: targetHeadSha,
          worktree_id: worktreeId,
          authorized_files_hash: authorizedFilesHash,
          package_hash: packageHash,
          effects_executed: 0,
        },
      });
      return 0;
    }

    if (command === "run:transition") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      const runId = requireString(parsed.values["run-id"], "run-id");
      const to = requireString(parsed.values.to, "to");
      if (!isRunState(to)) {
        throw new OrchestratorError("INVALID_ARGUMENT", `Unknown state: ${to}`);
      }
      const reason = requireString(parsed.values.reason, "reason");
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: { run_id: runId, to, reason, effects_executed: 0 },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const run = store.transitionRun({
          runId,
          to,
          reason,
          correlationId: runId,
          now: new Date(),
        });
        writeSuccess({ command, dryRun: false, format, data: { run } });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "run:quarantine") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      const runId = requireString(parsed.values["run-id"], "run-id");
      const reason = requireString(parsed.values.reason, "reason");
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: { run_id: runId, reason, effects_executed: 0 },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const run = store.quarantineRun({
          runId,
          reason,
          correlationId: runId,
          now: new Date(),
        });
        writeSuccess({ command, dryRun: false, format, data: { run } });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "lease:acquire") {
      assertCapability(config.allowedCapabilities, "LEASE_WRITE");
      const runId = requireString(parsed.values["run-id"], "run-id");
      const issueNumber = parsePositiveInteger(parsed.values.issue, "issue");
      const worktreeId = requireString(
        parsed.values["worktree-id"],
        "worktree-id",
      );
      const ttlSeconds = parsePositiveInteger(
        parsed.values["ttl-seconds"],
        "ttl-seconds",
      );
      const holderPid = parsed.values["holder-pid"]
        ? parsePositiveInteger(parsed.values["holder-pid"], "holder-pid")
        : process.pid;
      if (!isProcessAlive(holderPid)) {
        throw new OrchestratorError(
          "LEASE_HOLDER_NOT_ALIVE",
          "holder-pid must identify a live process",
        );
      }
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: {
            run_id: runId,
            issue: issueNumber,
            worktree_id: worktreeId,
            ttl_seconds: ttlSeconds,
            holder_pid: holderPid,
            effects_executed: 0,
          },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const leases = store.acquireDispatchLeases({
          runId,
          issueNumber,
          worktreeId,
          ttlMs: ttlSeconds * 1000,
          holderPid,
          now: new Date(),
        });
        writeSuccess({ command, dryRun: false, format, data: leases });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "lease:heartbeat") {
      assertCapability(config.allowedCapabilities, "LEASE_WRITE");
      const runId = requireString(parsed.values["run-id"], "run-id");
      const ttlSeconds = parsePositiveInteger(
        parsed.values["ttl-seconds"],
        "ttl-seconds",
      );
      const holderPid = parsed.values["holder-pid"]
        ? parsePositiveInteger(parsed.values["holder-pid"], "holder-pid")
        : process.pid;
      if (!isProcessAlive(holderPid)) {
        throw new OrchestratorError(
          "LEASE_HOLDER_NOT_ALIVE",
          "holder-pid must identify a live process",
        );
      }
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: {
            run_id: runId,
            ttl_seconds: ttlSeconds,
            holder_pid: holderPid,
            effects_executed: 0,
          },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const leases = store.heartbeatDispatchLeases({
          runId,
          holderPid,
          ttlMs: ttlSeconds * 1000,
          now: new Date(),
        });
        writeSuccess({ command, dryRun: false, format, data: { leases } });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "lease:release") {
      assertCapability(config.allowedCapabilities, "LEASE_WRITE");
      const runId = requireString(parsed.values["run-id"], "run-id");
      const reason = requireString(parsed.values.reason, "reason");
      const holderPid = parsed.values["holder-pid"]
        ? parsePositiveInteger(parsed.values["holder-pid"], "holder-pid")
        : process.pid;
      if (!isProcessAlive(holderPid)) {
        throw new OrchestratorError(
          "LEASE_HOLDER_NOT_ALIVE",
          "holder-pid must identify a live process",
        );
      }
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: {
            run_id: runId,
            reason,
            holder_pid: holderPid,
            effects_executed: 0,
          },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const result = store.releaseDispatchLeases({
          runId,
          holderPid,
          reason,
          now: new Date(),
        });
        writeSuccess({ command, dryRun: false, format, data: result });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "lease:recover") {
      assertCapability(config.allowedCapabilities, "LEASE_WRITE");
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: { effects_executed: 0 },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const result = store.recoverStaleLeases({
          now: new Date(),
          isProcessAlive,
        });
        writeSuccess({ command, dryRun: false, format, data: result });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "safety:activate") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      const scope = requireString(parsed.values.scope, "scope");
      if (scope !== "GLOBAL" && !scope.startsWith("RUN:")) {
        throw new OrchestratorError(
          "INVALID_ARGUMENT",
          "scope must be GLOBAL or RUN:<run-id>",
        );
      }
      const reason = requireString(parsed.values.reason, "reason");
      if (!apply) {
        writeSuccess({
          command,
          dryRun: true,
          format,
          data: { scope, reason, effects_executed: 0 },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      try {
        const result = store.activateKillSwitch({
          scope: scope as "GLOBAL" | `RUN:${string}`,
          reason,
          now: new Date(),
        });
        writeSuccess({ command, dryRun: false, format, data: result });
      } finally {
        store.close();
      }
      return 0;
    }

    if (command === "pilot:preflight") {
      assertCapability(config.allowedCapabilities, "DIAGNOSE");
      if (apply) {
        throw new OrchestratorError(
          "APPLY_NOT_SUPPORTED",
          "pilot:preflight is diagnostic-only and never executes effects",
        );
      }
      const repoRoot = cwd;
      const ghConfigDirectory = process.env.GH_CONFIG_DIR ?? "/nonexistent";
      const databasePath = resolveStateDatabasePath(config, undefined);

      const preflightInput: PreflightInput = {
        repoRoot,
        ghConfigDirectory,
        databasePath,
        allowedCapabilities: config.allowedCapabilities,
      };

      const report = await runPilotPreflight(preflightInput, false);

      writeSuccess({
        command,
        dryRun: true,
        format,
        data: {
          schema_version: report.schemaVersion,
          issue_number: report.issueNumber,
          repository: report.repository,
          base_sha: report.baseSha,
          branch: report.branch,
          issue_body_sha256: report.issueBodySha256,
          checks: report.checks,
          passed: report.passed,
          effects_executed: report.effectsExecuted,
        },
      });
      return 0;
    }

    assertCapability(config.allowedCapabilities, "APPROVAL_VALIDATE");
    const approvalFile = requireString(
      parsed.values["approval-file"],
      "approval-file",
    );
    const issueNumber = parsePositiveInteger(parsed.values.issue, "issue");
    const runId = requireString(parsed.values["run-id"], "run-id");
    const effectValue = requireString(parsed.values.effect, "effect");
    if (!isApprovalKind(effectValue)) {
      throw new OrchestratorError(
        "INVALID_ARGUMENT",
        "effect must be a supported approval kind",
      );
    }

    let observed: ReturnType<typeof validateObservedApproval>;
    try {
      observed = validateObservedApproval(
        JSON.parse(await readFile(approvalFile, "utf8")) as unknown,
        {
          repository: config.repository,
          issueNumber,
          approvedActors: config.approvedActors,
          orchestratorActor: config.orchestratorActor,
        },
      );
    } catch (error) {
      if (apply) {
        try {
          const store = openStateStore(config, parsed.values["state-db"]);
          try {
            const normalized = normalizeError(error);
            store.quarantineRun({
              runId,
              reason: `APPROVAL_REJECTED:${normalized.code}`,
              correlationId: runId,
              now: new Date(),
            });
          } finally {
            store.close();
          }
        } catch {
          // Preserve the original validation error.
        }
      }
      throw error;
    }

    if (effectValue !== observed.body.approval_kind) {
      throw new OrchestratorError(
        "APPROVAL_EFFECT_MISMATCH",
        "effect must exactly match approval_kind",
      );
    }
    if (!apply) {
      writeSuccess({
        command,
        dryRun: true,
        format,
        data: {
          approval_kind: observed.body.approval_kind,
          valid: true,
          effects_executed: 0,
        },
      });
      return 0;
    }

    const store = openStateStore(config, parsed.values["state-db"]);
    try {
      const recorded = store.recordApprovalEffect({
        observedApproval: observed,
        effect: effectValue,
        runId,
        observedAt: new Date(),
      });
      writeSuccess({
        command,
        dryRun: false,
        format,
        data: {
          approval_kind: observed.body.approval_kind,
          valid: true,
          effect_recorded: recorded.recorded,
        },
      });
    } finally {
      store.close();
    }
    return 0;
  } catch (error) {
    const normalized = normalizeError(error);
    writeResult(
      createStructuredResult({
        command,
        result: "ERROR",
        dryRun: !attemptedApply,
        errors: [
          {
            code: normalized.code,
            message: normalized.message,
            details: normalized.details,
          },
        ],
      }),
      format,
    );
    return normalized.exitCode;
  }
}

const executedPath = process.argv[1];
if (executedPath && import.meta.url === pathToFileURL(executedPath).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
