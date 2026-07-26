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
import { validateObservedApproval } from "./approvals.ts";
import { normalizeError, OrchestratorError } from "./errors.ts";
import {
  assertKillSwitchOff,
  deterministicIdempotencyKey,
  newRunId,
  openStateStore,
  stateDatabasePath,
} from "./orchestrator.ts";
import { assertCapability, DENIED_CAPABILITIES } from "./policy.ts";
import { isRunState } from "./state-machine.ts";

const COMMANDS = [
  "diagnose",
  "plan",
  "state:init",
  "run:create",
  "run:transition",
  "lease:acquire",
  "approval:validate",
] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(value: string): value is Command {
  return (COMMANDS as readonly string[]).includes(value);
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
        "approval-file": { type: "string" },
        effect: { type: "string" },
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

    const cwd = context.cwd ?? process.cwd();
    const config = await loadConfig(parsed.values.config, cwd);
    const apply = parsed.values.apply;

    if (command === "diagnose") {
      assertCapability(config.allowedCapabilities, "DIAGNOSE");
      writeSuccess({
        command,
        dryRun: true,
        format,
        data: {
          repository: config.repository,
          repo_root: config.repoRoot,
          runtime_dir: config.runtimeDir,
          state_db: parsed.values["state-db"] ?? stateDatabasePath(config),
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
            "acquire issue and worktree leases",
            "create isolated worktree",
            "generate immutable work package",
          ],
          effects_executed: 0,
        },
      });
      return 0;
    }

    assertKillSwitchOff();

    if (command === "state:init") {
      assertCapability(config.allowedCapabilities, "STATE_WRITE");
      const databasePath =
        parsed.values["state-db"] ?? stateDatabasePath(config);
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
      store.integrityCheck();
      store.close();
      writeSuccess({
        command,
        dryRun: false,
        format,
        data: { database_path: databasePath, integrity_check: "ok" },
      });
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
      store.close();
      writeSuccess({
        command,
        dryRun: false,
        format,
        data: { created: created.created, run: created.run },
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
      const run = store.transitionRun({
        runId,
        to,
        reason,
        correlationId: runId,
        now: new Date(),
      });
      store.close();
      writeSuccess({ command, dryRun: false, format, data: { run } });
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
            effects_executed: 0,
          },
        });
        return 0;
      }
      const store = openStateStore(config, parsed.values["state-db"]);
      const leases = store.acquireDispatchLeases({
        runId,
        issueNumber,
        worktreeId,
        ttlMs: ttlSeconds * 1000,
        holderPid: process.pid,
        now: new Date(),
      });
      store.close();
      writeSuccess({ command, dryRun: false, format, data: leases });
      return 0;
    }

    assertCapability(config.allowedCapabilities, "APPROVAL_VALIDATE");
    const approvalFile = requireString(
      parsed.values["approval-file"],
      "approval-file",
    );
    const issueNumber = parsePositiveInteger(parsed.values.issue, "issue");
    const observed = validateObservedApproval(
      JSON.parse(await readFile(approvalFile, "utf8")) as unknown,
      {
        repository: config.repository,
        issueNumber,
        approvedActors: config.approvedActors,
        orchestratorActor: config.orchestratorActor,
      },
    );
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
    const effect = requireString(parsed.values.effect, "effect");
    if (effect !== observed.body.approval_kind) {
      throw new OrchestratorError(
        "APPROVAL_EFFECT_MISMATCH",
        "effect must exactly match approval_kind",
      );
    }
    const runId = requireString(parsed.values["run-id"], "run-id");
    const store = openStateStore(config, parsed.values["state-db"]);
    const recorded = store.recordApprovalEffect({
      approvalEventId: String(observed.body.approval_event_id),
      effect,
      runId,
      observedAt: new Date(),
    });
    store.close();
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
    return 0;
  } catch (error) {
    const normalized = normalizeError(error);
    writeResult(
      createStructuredResult({
        command,
        result: "ERROR",
        dryRun: true,
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
