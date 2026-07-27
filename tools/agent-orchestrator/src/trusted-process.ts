import type { ToolIdentity, ToolName } from "./operational-trust.ts";
import type { RunRecord, StateStore } from "./state-store.ts";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

export const TRUST_MANIFEST_REQUIRED = "TRUST_MANIFEST_REQUIRED";

type TrustBoundRun = RunRecord &
  Readonly<{
    trustManifestHash: string;
    repositoryIdentityHash: string;
    toolIdentities: readonly ToolIdentity[];
  }>;

function fail(code: string, message: string): never {
  throw new Error(`${code}: ${message}`);
}

function hasPersistedTrust(run: RunRecord): run is TrustBoundRun {
  const candidate = run as RunRecord &
    Partial<{
      trustManifestHash: string;
      repositoryIdentityHash: string;
      toolIdentities: readonly ToolIdentity[];
    }>;

  return (
    typeof candidate.trustManifestHash === "string" &&
    SHA256_PATTERN.test(candidate.trustManifestHash) &&
    typeof candidate.repositoryIdentityHash === "string" &&
    SHA256_PATTERN.test(candidate.repositoryIdentityHash) &&
    Array.isArray(candidate.toolIdentities) &&
    candidate.toolIdentities.length > 0
  );
}

export function assertRunHasTrustManifest(
  runId: string,
  stateStore: StateStore,
): RunRecord {
  const run = stateStore.getRun(runId);

  if (!run) {
    fail("RUN_NOT_FOUND", `Run ${runId} does not exist`);
  }

  if (!hasPersistedTrust(run)) {
    fail(
      TRUST_MANIFEST_REQUIRED,
      `Run ${runId} has no immutable persisted trust binding`,
    );
  }

  return run;
}

export function assertRunHasTrustedTool(
  runId: string,
  stateStore: StateStore,
  name: ToolName,
): ToolIdentity {
  const run = assertRunHasTrustManifest(runId, stateStore) as TrustBoundRun;
  const identity = run.toolIdentities.find((tool) => tool.name === name);

  if (!identity) {
    fail(
      "TRUSTED_TOOL_REQUIRED",
      `Run ${runId} has no persisted identity for the requested tool`,
    );
  }

  return identity;
}
