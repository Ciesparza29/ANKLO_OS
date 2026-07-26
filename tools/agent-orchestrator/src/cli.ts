import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import {
  createDefaultConfig,
  createStructuredResult,
  parseConfig,
  type OrchestratorConfig,
  type OutputFormat,
  type StructuredResult,
} from "./contracts.ts";
import { normalizeError, OrchestratorError } from "./errors.ts";
import { assertCapability, DENIED_CAPABILITIES } from "./policy.ts";

const COMMANDS = ["diagnose", "plan"] as const;
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
    if (parsed.values.apply) {
      throw new OrchestratorError(
        "APPLY_NOT_SUPPORTED",
        "This scaffold exposes read-only commands only",
      );
    }

    const cwd = context.cwd ?? process.cwd();
    const config = await loadConfig(parsed.values.config, cwd);

    if (command === "diagnose") {
      assertCapability(config.allowedCapabilities, "DIAGNOSE");
      writeResult(
        createStructuredResult({
          command,
          result: "DRY_RUN",
          dryRun: true,
          data: {
            repository: config.repository,
            repo_root: config.repoRoot,
            runtime_dir: config.runtimeDir,
            node_version: process.versions.node,
            dry_run_default: config.dryRunDefault,
            network_listeners: config.networkListeners,
            production_access: config.productionAccess,
            denied_capabilities: DENIED_CAPABILITIES,
          },
        }),
        format,
      );
      return 0;
    }

    assertCapability(config.allowedCapabilities, "PLAN");
    const issue = parsePositiveInteger(parsed.values.issue, "issue");
    writeResult(
      createStructuredResult({
        command,
        result: "DRY_RUN",
        dryRun: true,
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
      }),
      format,
    );
    return 0;
  } catch (error) {
    const normalized = normalizeError(error);
    const result = createStructuredResult({
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
    });
    writeResult(result, format);
    return normalized.exitCode;
  }
}

const executedPath = process.argv[1];
if (executedPath && import.meta.url === pathToFileURL(executedPath).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
