import { homedir } from "node:os";
import { resolve, sep } from "node:path";
import { OrchestratorError } from "./errors.ts";
import {
  isSafeCapability,
  SAFE_CAPABILITIES,
  type SafeCapability,
} from "./policy.ts";

export const SCHEMA_VERSION = "1.0" as const;
export const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
export const GIT_SHA_PATTERN = /^[a-f0-9]{40}$/u;

export type OutputFormat = "human" | "json";

export type StructuredResult = Readonly<{
  schema_version: typeof SCHEMA_VERSION;
  command: string;
  result: "PASS" | "DRY_RUN" | "BLOCKED" | "ERROR";
  dry_run: boolean;
  timestamp: string;
  data: Readonly<Record<string, unknown>>;
  errors: readonly Readonly<{
    code: string;
    message: string;
    details: Readonly<Record<string, unknown>>;
  }>[];
}>;

export type OrchestratorConfig = Readonly<{
  schemaVersion: typeof SCHEMA_VERSION;
  repository: string;
  repoRoot: string;
  runtimeDir: string;
  approvedActors: readonly string[];
  orchestratorActor: string;
  dryRunDefault: true;
  networkListeners: false;
  productionAccess: false;
  allowedCapabilities: readonly SafeCapability[];
}>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, i) => key !== wanted[i])
  ) {
    throw new OrchestratorError(
      "INVALID_SCHEMA",
      `${label} has invalid fields`,
      {
        details: { actual, expected: wanted },
      },
    );
  }
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new OrchestratorError(
      "INVALID_SCHEMA",
      `${field} must be a non-empty string`,
    );
  }
  return value;
}

function expectStringArray(value: unknown, field: string): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    throw new OrchestratorError(
      "INVALID_SCHEMA",
      `${field} must be an array of non-empty strings`,
    );
  }
  return Object.freeze([...value]);
}

export function createDefaultConfig(
  repoRoot: string,
  home: string = homedir(),
): OrchestratorConfig {
  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    repository: "Ciesparza29/ANKLO_OS",
    repoRoot: resolve(repoRoot),
    runtimeDir: resolve(home, ".anklo-orchestrator"),
    approvedActors: Object.freeze(["Ciesparza29"]),
    orchestratorActor: "anklo-orchestrator",
    dryRunDefault: true,
    networkListeners: false,
    productionAccess: false,
    allowedCapabilities: Object.freeze([...SAFE_CAPABILITIES]),
  });
}

export function parseConfig(input: unknown): OrchestratorConfig {
  if (!isRecord(input)) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "Configuration must be an object",
    );
  }
  expectExactKeys(
    input,
    [
      "schemaVersion",
      "repository",
      "repoRoot",
      "runtimeDir",
      "approvedActors",
      "orchestratorActor",
      "dryRunDefault",
      "networkListeners",
      "productionAccess",
      "allowedCapabilities",
    ],
    "configuration",
  );

  if (input.schemaVersion !== SCHEMA_VERSION) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "Unsupported configuration schema version",
    );
  }
  if (input.dryRunDefault !== true) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "dryRunDefault must remain true",
    );
  }
  if (input.networkListeners !== false) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "Network listeners are forbidden",
    );
  }
  if (input.productionAccess !== false) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "Production access is forbidden",
    );
  }

  const repoRoot = resolve(expectString(input.repoRoot, "repoRoot"));
  const runtimeDir = resolve(expectString(input.runtimeDir, "runtimeDir"));
  if (runtimeDir === repoRoot || runtimeDir.startsWith(`${repoRoot}${sep}`)) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "Runtime data must remain outside the repository",
    );
  }

  const approvedActors = expectStringArray(
    input.approvedActors,
    "approvedActors",
  );
  const orchestratorActor = expectString(
    input.orchestratorActor,
    "orchestratorActor",
  );
  if (approvedActors.includes(orchestratorActor)) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "The orchestrator actor must differ from approved human actors",
    );
  }

  const rawCapabilities = expectStringArray(
    input.allowedCapabilities,
    "allowedCapabilities",
  );
  if (rawCapabilities.some((capability) => !isSafeCapability(capability))) {
    throw new OrchestratorError(
      "INVALID_CONFIG",
      "Configuration contains a non-allowlisted capability",
      { details: { allowedCapabilities: rawCapabilities } },
    );
  }

  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    repository: expectString(input.repository, "repository"),
    repoRoot,
    runtimeDir,
    approvedActors,
    orchestratorActor,
    dryRunDefault: true,
    networkListeners: false,
    productionAccess: false,
    allowedCapabilities: Object.freeze([
      ...rawCapabilities,
    ]) as readonly SafeCapability[],
  });
}

export function createStructuredResult(input: {
  command: string;
  result: StructuredResult["result"];
  dryRun: boolean;
  data?: Readonly<Record<string, unknown>>;
  errors?: StructuredResult["errors"];
  now?: Date;
}): StructuredResult {
  return Object.freeze({
    schema_version: SCHEMA_VERSION,
    command: input.command,
    result: input.result,
    dry_run: input.dryRun,
    timestamp: (input.now ?? new Date()).toISOString(),
    data: input.data ?? {},
    errors: input.errors ?? [],
  });
}

export function assertGitSha(value: string, field: string): string {
  if (!GIT_SHA_PATTERN.test(value)) {
    throw new OrchestratorError(
      "INVALID_ARGUMENT",
      `${field} must be a 40-character lowercase Git SHA`,
    );
  }
  return value;
}

export function assertSha256(value: string, field: string): string {
  if (!SHA256_PATTERN.test(value)) {
    throw new OrchestratorError(
      "INVALID_ARGUMENT",
      `${field} must be a lowercase SHA-256 hash`,
    );
  }
  return value;
}
