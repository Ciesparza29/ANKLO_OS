import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute } from "node:path";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

export const TRUST_MANIFEST_SCHEMA_VERSION = 1 as const;
export const ANALYZER_VERSION = "1.0.0";

export type ToolName = string;

export interface ToolIdentity {
  readonly name: ToolName;
  readonly resolvedPath: string;
  readonly realpath: string;
  readonly sha256: string;
  readonly version: string;
}

export interface RepositoryIdentity {
  readonly repositorySlug: string;
  readonly host: string;
  readonly normalizedOrigin: string;
  readonly repositoryRealpath: string;
  readonly worktreeRealpath: string;
  readonly mainCloneRealpath: string;
  readonly gitDir: string;
  readonly commonGitDir: string;
  readonly worktreeRegistrationHash: string;
  readonly branch: string;
  readonly headSha: string;
  readonly baseSha: string;
  readonly worktreeId: string;
  readonly issueNumber: number;
  readonly protectedPaths: readonly string[];
  readonly remoteIdentity: string;
  readonly repositoryIdentityHash: string;
}

export interface TrustManifest {
  readonly schemaVersion: typeof TRUST_MANIFEST_SCHEMA_VERSION;
  readonly createdAt: string;
  readonly toolIdentities: readonly ToolIdentity[];
  readonly repositoryIdentity: RepositoryIdentity;
  readonly lockfileHash: string;
  readonly workspaceManifestHash: string;
  readonly analyzerVersion: string;
  readonly trustManifestHash: string;
}

export interface TrustManifestSeed {
  readonly createdAt: string;
  readonly toolIdentities: readonly ToolIdentity[];
  readonly repositoryIdentity: RepositoryIdentity;
  readonly lockfileHash: string;
  readonly workspaceManifestHash: string;
  readonly analyzerVersion?: string;
}

function fail(code: string, message: string): never {
  throw new Error(`${code}: ${message}`);
}

function sha256Bytes(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertSha256(label: string, value: string): void {
  if (!SHA256_PATTERN.test(value)) {
    fail("INVALID_TRUST_DIGEST", `${label} must be a SHA-256 digest`);
  }
}

function normalizeToolIdentity(identity: ToolIdentity): ToolIdentity {
  if (identity.name.trim().length === 0) {
    fail("INVALID_TOOL_IDENTITY", "Tool name is required");
  }

  if (!isAbsolute(identity.resolvedPath) || !isAbsolute(identity.realpath)) {
    fail(
      "INVALID_TOOL_IDENTITY",
      "Tool paths must be absolute and canonicalizable",
    );
  }

  if (identity.version.trim().length === 0) {
    fail("INVALID_TOOL_VERSION", "Tool version is required");
  }

  assertSha256("tool sha256", identity.sha256);

  return Object.freeze({
    name: identity.name.trim(),
    resolvedPath: identity.resolvedPath,
    realpath: identity.realpath,
    sha256: identity.sha256,
    version: identity.version.trim(),
  });
}

function normalizeRepositoryIdentity(
  identity: RepositoryIdentity,
): RepositoryIdentity {
  assertSha256("worktree registration hash", identity.worktreeRegistrationHash);
  assertSha256("repository identity hash", identity.repositoryIdentityHash);

  if (
    identity.repositorySlug.trim().length === 0 ||
    identity.host.trim().length === 0 ||
    identity.normalizedOrigin.trim().length === 0 ||
    identity.branch.trim().length === 0 ||
    identity.headSha.trim().length === 0 ||
    identity.baseSha.trim().length === 0 ||
    identity.worktreeId.trim().length === 0 ||
    identity.remoteIdentity.trim().length === 0
  ) {
    fail(
      "INVALID_REPOSITORY_IDENTITY",
      "Repository identity contains an empty required value",
    );
  }

  if (
    !Number.isSafeInteger(identity.issueNumber) ||
    identity.issueNumber <= 0
  ) {
    fail(
      "INVALID_REPOSITORY_IDENTITY",
      "Repository issue number must be a positive integer",
    );
  }

  return Object.freeze({
    repositorySlug: identity.repositorySlug,
    host: identity.host,
    normalizedOrigin: identity.normalizedOrigin,
    repositoryRealpath: identity.repositoryRealpath,
    worktreeRealpath: identity.worktreeRealpath,
    mainCloneRealpath: identity.mainCloneRealpath,
    gitDir: identity.gitDir,
    commonGitDir: identity.commonGitDir,
    worktreeRegistrationHash: identity.worktreeRegistrationHash,
    branch: identity.branch,
    headSha: identity.headSha,
    baseSha: identity.baseSha,
    worktreeId: identity.worktreeId,
    issueNumber: identity.issueNumber,
    protectedPaths: Object.freeze([...identity.protectedPaths].sort()),
    remoteIdentity: identity.remoteIdentity,
    repositoryIdentityHash: identity.repositoryIdentityHash,
  });
}

function manifestPayload(seed: TrustManifestSeed): Readonly<{
  schemaVersion: typeof TRUST_MANIFEST_SCHEMA_VERSION;
  createdAt: string;
  toolIdentities: readonly ToolIdentity[];
  repositoryIdentity: RepositoryIdentity;
  lockfileHash: string;
  workspaceManifestHash: string;
  analyzerVersion: string;
}> {
  if (Number.isNaN(Date.parse(seed.createdAt))) {
    fail("INVALID_TRUST_TIMESTAMP", "Trust timestamp must be parseable");
  }

  assertSha256("lockfile hash", seed.lockfileHash);
  assertSha256("workspace manifest hash", seed.workspaceManifestHash);

  const normalizedTools = [...seed.toolIdentities]
    .map(normalizeToolIdentity)
    .sort((left, right) => left.name.localeCompare(right.name));

  const names = new Set(normalizedTools.map((tool) => tool.name));

  if (names.size !== normalizedTools.length) {
    fail("DUPLICATE_TOOL_IDENTITY", "Tool identities must be unique");
  }

  if (normalizedTools.length === 0) {
    fail("MISSING_TOOL_IDENTITIES", "At least one tool identity is required");
  }

  const analyzerVersion = seed.analyzerVersion ?? ANALYZER_VERSION;

  if (analyzerVersion.trim().length === 0) {
    fail("INVALID_ANALYZER_VERSION", "Analyzer version is required");
  }

  return Object.freeze({
    schemaVersion: TRUST_MANIFEST_SCHEMA_VERSION,
    createdAt: new Date(seed.createdAt).toISOString(),
    toolIdentities: Object.freeze(normalizedTools),
    repositoryIdentity: normalizeRepositoryIdentity(seed.repositoryIdentity),
    lockfileHash: seed.lockfileHash,
    workspaceManifestHash: seed.workspaceManifestHash,
    analyzerVersion: analyzerVersion.trim(),
  });
}

function manifestHash(payload: ReturnType<typeof manifestPayload>): string {
  return sha256Bytes(
    JSON.stringify({
      schemaVersion: payload.schemaVersion,
      createdAt: payload.createdAt,
      toolIdentities: payload.toolIdentities.map((tool) => ({
        name: tool.name,
        resolvedPath: tool.resolvedPath,
        realpath: tool.realpath,
        sha256: tool.sha256,
        version: tool.version,
      })),
      repositoryIdentity: {
        repositorySlug: payload.repositoryIdentity.repositorySlug,
        host: payload.repositoryIdentity.host,
        normalizedOrigin: payload.repositoryIdentity.normalizedOrigin,
        repositoryRealpath: payload.repositoryIdentity.repositoryRealpath,
        worktreeRealpath: payload.repositoryIdentity.worktreeRealpath,
        mainCloneRealpath: payload.repositoryIdentity.mainCloneRealpath,
        gitDir: payload.repositoryIdentity.gitDir,
        commonGitDir: payload.repositoryIdentity.commonGitDir,
        worktreeRegistrationHash:
          payload.repositoryIdentity.worktreeRegistrationHash,
        branch: payload.repositoryIdentity.branch,
        headSha: payload.repositoryIdentity.headSha,
        baseSha: payload.repositoryIdentity.baseSha,
        worktreeId: payload.repositoryIdentity.worktreeId,
        issueNumber: payload.repositoryIdentity.issueNumber,
        protectedPaths: payload.repositoryIdentity.protectedPaths,
        remoteIdentity: payload.repositoryIdentity.remoteIdentity,
        repositoryIdentityHash:
          payload.repositoryIdentity.repositoryIdentityHash,
      },
      lockfileHash: payload.lockfileHash,
      workspaceManifestHash: payload.workspaceManifestHash,
      analyzerVersion: payload.analyzerVersion,
    }),
  );
}

export function createToolIdentity(
  name: ToolName,
  resolvedPath: string,
  version: string,
): ToolIdentity {
  if (!isAbsolute(resolvedPath)) {
    fail("INVALID_TOOL_PATH", "Tool path must be absolute");
  }

  const canonicalPath = realpathSync(resolvedPath);

  if (!lstatSync(canonicalPath).isFile()) {
    fail("INVALID_TOOL_PATH", "Tool path must resolve to a regular file");
  }

  return normalizeToolIdentity({
    name,
    resolvedPath,
    realpath: canonicalPath,
    sha256: sha256Bytes(readFileSync(canonicalPath)),
    version,
  });
}

export function createNodeToolIdentity(): ToolIdentity {
  return createToolIdentity(
    process.release.name,
    process.execPath,
    process.versions.node,
  );
}

export function createTrustManifest(seed: TrustManifestSeed): TrustManifest {
  const payload = manifestPayload(seed);

  return Object.freeze({
    ...payload,
    trustManifestHash: manifestHash(payload),
  });
}

export function assertTrustManifestIntegrity(
  trust: TrustManifest,
): TrustManifest {
  assertSha256("trust manifest hash", trust.trustManifestHash);

  const payload = manifestPayload({
    createdAt: trust.createdAt,
    toolIdentities: trust.toolIdentities,
    repositoryIdentity: trust.repositoryIdentity,
    lockfileHash: trust.lockfileHash,
    workspaceManifestHash: trust.workspaceManifestHash,
    analyzerVersion: trust.analyzerVersion,
  });

  const expectedHash = manifestHash(payload);

  if (expectedHash !== trust.trustManifestHash) {
    fail(
      "TRUST_MANIFEST_INTEGRITY_FAILED",
      "Trust manifest hash does not match its immutable contents",
    );
  }

  return trust;
}
