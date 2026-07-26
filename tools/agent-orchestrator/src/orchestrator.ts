import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
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

export function stateDatabasePath(config: OrchestratorConfig): string {
  return join(config.runtimeDir, "state", "orchestrator.sqlite");
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
  return SqliteStateStore.open(overridePath ?? stateDatabasePath(config));
}

export function newRunId(): string {
  return randomUUID();
}
