import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  parse,
  relative,
  resolve,
  sep,
} from "node:path";
import type { OrchestratorConfig } from "./contracts.ts";
import { OrchestratorError } from "./errors.ts";
import { SqliteStateStore } from "./state-store.ts";

export function assertKillSwitchOff(
  env: Readonly<Record<string, string | undefined>> = process.env,
): void {
  if (env.ANKLO_ORCHESTRATOR_KILL_SWITCH === "1") {
    throw new OrchestratorError(
      "KILL_SWITCH_ACTIVE",
      "The orchestrator kill switch is active; all effects are blocked",
    );
  }
}

function isWithin(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

function assertNoSymlinkComponents(targetPath: string): void {
  const absolute = resolve(targetPath);
  const root = parse(absolute).root;
  const relativePath = absolute.slice(root.length);
  const parts = relativePath.split(sep).filter(Boolean);
  let cursor = root;

  for (const part of parts) {
    cursor = join(cursor, part);
    if (!existsSync(cursor)) break;
    if (lstatSync(cursor).isSymbolicLink()) {
      throw new OrchestratorError(
        "UNSAFE_RUNTIME_PATH",
        "Runtime paths must not traverse symbolic links",
        { details: { path: cursor } },
      );
    }
  }
}

export function stateDatabasePath(config: OrchestratorConfig): string {
  return join(config.runtimeDir, "state", "orchestrator.sqlite");
}

export function resolveStateDatabasePath(
  config: OrchestratorConfig,
  overridePath?: string,
): string {
  const runtimeDir = resolve(config.runtimeDir);
  const repoRoot = resolve(config.repoRoot);
  const candidate = resolve(overridePath ?? stateDatabasePath(config));

  if (isWithin(repoRoot, candidate)) {
    throw new OrchestratorError(
      "UNSAFE_STATE_PATH",
      "State storage must remain outside the repository",
      { details: { candidate, repoRoot } },
    );
  }
  if (!isWithin(runtimeDir, candidate)) {
    throw new OrchestratorError(
      "UNSAFE_STATE_PATH",
      "State storage must remain inside the configured runtime directory",
      { details: { candidate, runtimeDir } },
    );
  }

  assertNoSymlinkComponents(runtimeDir);
  assertNoSymlinkComponents(dirname(candidate));

  if (existsSync(runtimeDir) && existsSync(dirname(candidate))) {
    const runtimeReal = realpathSync.native(runtimeDir);
    const parentReal = realpathSync.native(dirname(candidate));
    if (!isWithin(runtimeReal, parentReal)) {
      throw new OrchestratorError(
        "UNSAFE_STATE_PATH",
        "Resolved state path escapes the configured runtime directory",
        { details: { parentReal, runtimeReal } },
      );
    }
  }

  return candidate;
}

export function deterministicIdempotencyKey(input: {
  repository: string;
  issueNumber: number;
  baseSha: string;
  planHash: string;
  sourceSnapshotHash: string;
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        input.repository,
        input.issueNumber,
        input.baseSha,
        input.planHash,
        input.sourceSnapshotHash,
      ]),
      "utf8",
    )
    .digest("hex");
}

export function openStateStore(
  config: OrchestratorConfig,
  overridePath?: string,
): SqliteStateStore {
  assertKillSwitchOff();
  return SqliteStateStore.open(resolveStateDatabasePath(config, overridePath));
}

export function isProcessAlive(pid: number): boolean {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === "EPERM";
  }
}

export function newRunId(): string {
  return randomUUID();
}
