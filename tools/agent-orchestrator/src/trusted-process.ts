import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { delimiter, isAbsolute, join, relative, resolve, sep } from "node:path";

import { isRecord } from "./contracts.ts";
import {
  assertRepositoryIdentityIntegrity,
  assertToolIdentityIntegrity,
  assertTrustManifestIntegrity,
  type RepositoryIdentity,
  type ToolIdentity,
  type ToolName,
  type TrustManifest,
} from "./operational-trust.ts";
import type { RunRecord, StateStore } from "./state-store.ts";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;

const FIXED_EXECUTABLE_DIRECTORIES = Object.freeze([
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
]);

const FIXED_EXECUTABLE_PATH = FIXED_EXECUTABLE_DIRECTORIES.join(delimiter);

export const TRUST_MANIFEST_REQUIRED = "TRUST_MANIFEST_REQUIRED";

export type TrustedExecutionContext = Readonly<{
  runId: string;
  stateStore: StateStore;
}>;

type TrustBoundRun = RunRecord &
  Readonly<{
    trustManifestHash: string;
    repositoryIdentityHash: string;
    repositoryIdentity: RepositoryIdentity;
    toolIdentities: readonly ToolIdentity[];
    lockfileHash: string;
    workspaceManifestHash: string;
    packageManifestHash: string;
    analyzerVersion: string;
    remoteIdentity: string;
    commonGitDirIdentity: string;
    trustManifest: TrustManifest;
  }>;

export type AsyncExecutionResult = Readonly<{
  resolvedBinary: string;
  vector: readonly string[];
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  outputLimitExceeded: boolean;
  spawnError?: Error;
}>;

function fail(code: string, message: string): never {
  throw new Error(`${code}: ${message}`);
}

function hasPersistedTrust(run: RunRecord): run is TrustBoundRun {
  const candidate = run as RunRecord &
    Partial<{
      trustManifestHash: string;
      repositoryIdentityHash: string;
      repositoryIdentity: unknown;
      toolIdentities: readonly ToolIdentity[];
      lockfileHash: string;
      workspaceManifestHash: string;
      packageManifestHash: string;
      analyzerVersion: string;
      remoteIdentity: string;
      commonGitDirIdentity: string;
      trustManifest: TrustManifest;
    }>;

  return (
    typeof candidate.trustManifestHash === "string" &&
    SHA256_PATTERN.test(candidate.trustManifestHash) &&
    typeof candidate.repositoryIdentityHash === "string" &&
    SHA256_PATTERN.test(candidate.repositoryIdentityHash) &&
    isRecord(candidate.repositoryIdentity) &&
    Array.isArray(candidate.toolIdentities) &&
    candidate.toolIdentities.length > 0 &&
    typeof candidate.lockfileHash === "string" &&
    SHA256_PATTERN.test(candidate.lockfileHash) &&
    typeof candidate.workspaceManifestHash === "string" &&
    SHA256_PATTERN.test(candidate.workspaceManifestHash) &&
    typeof candidate.packageManifestHash === "string" &&
    SHA256_PATTERN.test(candidate.packageManifestHash) &&
    isRecord(candidate.trustManifest) &&
    typeof candidate.analyzerVersion === "string" &&
    candidate.analyzerVersion.trim().length > 0 &&
    typeof candidate.remoteIdentity === "string" &&
    candidate.remoteIdentity.trim().length > 0 &&
    typeof candidate.commonGitDirIdentity === "string" &&
    SHA256_PATTERN.test(candidate.commonGitDirIdentity)
  );
}

function resolveTrustedBinary(candidate: string): string {
  const candidates = isAbsolute(candidate)
    ? [candidate]
    : FIXED_EXECUTABLE_DIRECTORIES.map((directory) =>
        join(directory, candidate),
      );

  for (const path of candidates) {
    if (!existsSync(path)) continue;

    const canonical = realpathSync(path);

    if (lstatSync(canonical).isFile()) {
      return canonical;
    }
  }

  fail(
    "TRUSTED_TOOL_NOT_FOUND",
    `Trusted executable could not be resolved: ${candidate}`,
  );
}

function baseEnvironment(): NodeJS.ProcessEnv {
  return {
    PATH: FIXED_EXECUTABLE_PATH,
    HOME: "/nonexistent",
    XDG_CONFIG_HOME: "/nonexistent",
    TMPDIR: "/tmp",
    LANG: "C",
    LC_ALL: "C",
    NO_COLOR: "1",
  };
}

function gitEnvironment(): NodeJS.ProcessEnv {
  return {
    ...baseEnvironment(),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
  };
}

function githubEnvironment(configDirectory: string): NodeJS.ProcessEnv {
  return {
    ...baseEnvironment(),
    GH_CONFIG_DIR: configDirectory,
    GH_HOST: "github.com",
    GH_PROMPT_DISABLED: "1",
  };
}

function codexEnvironment(runtimeDirectory: string): NodeJS.ProcessEnv {
  return {
    ...baseEnvironment(),
    CODEX_HOME: runtimeDirectory,
    RUST_BACKTRACE: "0",
  };
}

function verificationEnvironment(): NodeJS.ProcessEnv {
  return {
    ...baseEnvironment(),
    CI: "1",
    DOCKER_HOST: "unix:///var/run/docker.sock",
    DOCKER_CONFIG: "/nonexistent",
  };
}

function terminateProcessTree(pid: number | undefined): void {
  if (!pid) return;

  try {
    if (process.platform === "win32") {
      process.kill(pid, "SIGKILL");
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {
    // The process may already have exited.
  }
}

function runSynchronous(request: {
  readonly binaryPath: string;
  readonly vector: readonly string[];
  readonly directory: string;
  readonly variables: NodeJS.ProcessEnv;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
}) {
  const resolvedBinary = resolveTrustedBinary(request.binaryPath);

  return spawnSync(resolvedBinary, request.vector, {
    cwd: request.directory,
    encoding: "utf8",
    env: request.variables,
    timeout: request.timeoutMs,
    maxBuffer: request.maxOutputBytes,
    shell: false,
    windowsHide: true,
  });
}

async function runAsynchronous(request: {
  readonly binaryPath: string;
  readonly vector: readonly string[];
  readonly directory: string;
  readonly variables: NodeJS.ProcessEnv;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
}): Promise<AsyncExecutionResult> {
  const resolvedBinary = resolveTrustedBinary(request.binaryPath);

  return await new Promise<AsyncExecutionResult>((resolveExecution) => {
    const child = spawn(resolvedBinary, request.vector, {
      cwd: request.directory,
      env: request.variables,
      shell: false,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;
    let outputLimitExceeded = false;
    let spawnError: Error | undefined;

    const append = (channel: "stdout" | "stderr", chunk: Buffer): void => {
      outputBytes += chunk.byteLength;

      if (outputBytes > request.maxOutputBytes) {
        outputLimitExceeded = true;
        terminateProcessTree(child.pid);
        return;
      }

      if (channel === "stdout") {
        stdout += chunk.toString("utf8");
      } else {
        stderr += chunk.toString("utf8");
      }
    };

    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));

    child.once("error", (error) => {
      spawnError = error;
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child.pid);
    }, request.timeoutMs);

    child.once("close", (exitCode, signal) => {
      clearTimeout(timeout);

      resolveExecution(
        Object.freeze({
          resolvedBinary,
          vector: request.vector,
          exitCode,
          signal,
          stdout,
          stderr,
          timedOut,
          outputLimitExceeded,
          ...(spawnError ? { spawnError } : {}),
        }),
      );
    });
  });
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

  const manifest = assertTrustManifestIntegrity(run.trustManifest);
  if (
    run.trustManifestHash !== manifest.trustManifestHash ||
    run.repositoryIdentityHash !==
      manifest.repositoryIdentity.repositoryIdentityHash ||
    JSON.stringify(run.repositoryIdentity) !==
      JSON.stringify(manifest.repositoryIdentity) ||
    JSON.stringify(run.toolIdentities) !==
      JSON.stringify(manifest.toolIdentities) ||
    run.lockfileHash !== manifest.lockfileHash ||
    run.workspaceManifestHash !== manifest.workspaceManifestHash ||
    run.packageManifestHash !== manifest.packageManifestHash ||
    run.analyzerVersion !== manifest.analyzerVersion ||
    run.remoteIdentity !== manifest.repositoryIdentity.remoteIdentity ||
    run.commonGitDirIdentity !== manifest.commonGitDirIdentity
  ) {
    fail(
      "TRUST_MANIFEST_INTEGRITY_FAILED",
      `Run ${runId} trust copies do not match the canonical manifest`,
    );
  }

  return Object.freeze({ ...run, trustManifest: manifest });
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

  return assertToolIdentityIntegrity(identity);
}

export function assertTrustedExecutionContext(
  context: TrustedExecutionContext,
  name: ToolName,
): ToolIdentity {
  if (
    !context ||
    typeof context !== "object" ||
    typeof context.runId !== "string" ||
    !context.stateStore
  ) {
    fail(
      "INVALID_TRUSTED_EXECUTION_CONTEXT",
      "A valid TrustedExecutionContext is required",
    );
  }
  context.stateStore.assertEffectsAllowed(context.runId);

  return assertRunHasTrustedTool(context.runId, context.stateStore, name);
}

export type GitLocation = "repository" | "worktree" | "mainClone";

export type GitQueryOperation =
  | "worktree-list"
  | "show-toplevel"
  | "get-remote-origin"
  | "git-common-dir"
  | "show-current-branch"
  | "rev-parse-head"
  | "status-porcelain"
  | "ls-files-stage"
  | "diff-binary-head"
  | "ls-files-others";

function deriveGitLocation(
  repo: RepositoryIdentity,
  location: GitLocation,
): string {
  if (location === "repository") return repo.repositoryRealpath;
  if (location === "worktree") return repo.worktreeRealpath;
  if (location === "mainClone") return repo.mainCloneRealpath;
  fail(
    "UNAUTHORIZED_GIT_LOCATION",
    `Invalid target location: ${String(location)}`,
  );
}

export function resolveGitLocation(
  context: TrustedExecutionContext,
  targetPath: string,
): GitLocation {
  const run = assertRunHasTrustManifest(
    context.runId,
    context.stateStore,
  ) as TrustBoundRun;
  const repo = assertRepositoryIdentityIntegrity(run.repositoryIdentity);
  const real = existsSync(targetPath)
    ? realpathSync(targetPath)
    : resolve(targetPath);
  if (real === repo.worktreeRealpath) return "worktree";
  if (real === repo.repositoryRealpath) return "repository";
  if (real === repo.mainCloneRealpath) return "mainClone";
  fail(
    "UNAUTHORIZED_GIT_LOCATION",
    "Target path is not authorized in the run repository identity",
  );
}

function gitQueryVector(operation: GitQueryOperation): readonly string[] {
  switch (operation) {
    case "worktree-list":
      return [
        "-c",
        "core.hooksPath=/dev/null",
        "worktree",
        "list",
        "--porcelain",
      ];
    case "show-toplevel":
      return ["-c", "core.hooksPath=/dev/null", "rev-parse", "--show-toplevel"];
    case "get-remote-origin":
      return ["-c", "core.hooksPath=/dev/null", "remote", "get-url", "origin"];
    case "git-common-dir":
      return [
        "-c",
        "core.hooksPath=/dev/null",
        "rev-parse",
        "--git-common-dir",
      ];
    case "show-current-branch":
      return ["-c", "core.hooksPath=/dev/null", "branch", "--show-current"];
    case "rev-parse-head":
      return ["-c", "core.hooksPath=/dev/null", "rev-parse", "HEAD"];
    case "status-porcelain":
      return [
        "-c",
        "core.hooksPath=/dev/null",
        "status",
        "--porcelain=v1",
        "--untracked-files=all",
      ];
    case "ls-files-stage":
      return ["-c", "core.hooksPath=/dev/null", "ls-files", "--stage"];
    case "diff-binary-head":
      return ["-c", "core.hooksPath=/dev/null", "diff", "--binary", "HEAD"];
    case "ls-files-others":
      return [
        "-c",
        "core.hooksPath=/dev/null",
        "ls-files",
        "--others",
        "--exclude-standard",
      ];
    default:
      fail(
        "UNAUTHORIZED_GIT_OPERATION",
        `Git operation not allowlisted: ${String(operation)}`,
      );
  }
}

export function executeGitQuery(
  context: TrustedExecutionContext,
  location: GitLocation,
  operation: GitQueryOperation,
): string {
  const tool = assertTrustedExecutionContext(context, "git");
  const run = assertRunHasTrustManifest(
    context.runId,
    context.stateStore,
  ) as TrustBoundRun;
  const repo = assertRepositoryIdentityIntegrity(run.repositoryIdentity);
  const targetDir = deriveGitLocation(repo, location);

  const result = runSynchronous({
    binaryPath: tool.resolvedPath,
    vector: gitQueryVector(operation),
    directory: targetDir,
    variables: gitEnvironment(),
    timeoutMs: 60_000,
    maxOutputBytes: 10 * 1024 * 1024,
  });

  if (result.error) {
    fail(
      "GIT_COMMAND_FAILED",
      `Git command could not complete: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    fail(
      "GIT_COMMAND_FAILED",
      `Git ${operation} failed with exit code ${String(result.status)}`,
    );
  }

  return result.stdout;
}

export function executeGitBranchCheck(
  context: TrustedExecutionContext,
  location: GitLocation,
  branch: string,
): Readonly<{ exists: boolean; status: number; error?: Error }> {
  const tool = assertTrustedExecutionContext(context, "git");
  const run = assertRunHasTrustManifest(
    context.runId,
    context.stateStore,
  ) as TrustBoundRun;
  const repo = assertRepositoryIdentityIntegrity(run.repositoryIdentity);
  const targetDir = deriveGitLocation(repo, location);

  if (branch !== repo.branch) {
    fail(
      "UNAUTHORIZED_GIT_OPERATION",
      "Branch does not match authorized repository identity",
    );
  }

  const result = runSynchronous({
    binaryPath: tool.resolvedPath,
    vector: [
      "-c",
      "core.hooksPath=/dev/null",
      "show-ref",
      "--verify",
      "--quiet",
      `refs/heads/${branch}`,
    ],
    directory: targetDir,
    variables: gitEnvironment(),
    timeoutMs: 60_000,
    maxOutputBytes: 10 * 1024 * 1024,
  });

  if (result.error) {
    return Object.freeze({ exists: false, status: -1, error: result.error });
  }

  return Object.freeze({
    exists: result.status === 0,
    status: result.status ?? -1,
  });
}

export interface GitWorktreeCreateRequest {
  readonly branch: string;
  readonly destination: string;
  readonly baseSha: string;
}

export function executeGitWorktreeCreate(
  context: TrustedExecutionContext,
  location: GitLocation,
  request: GitWorktreeCreateRequest,
): string {
  const tool = assertTrustedExecutionContext(context, "git");
  const run = assertRunHasTrustManifest(
    context.runId,
    context.stateStore,
  ) as TrustBoundRun;
  const repo = assertRepositoryIdentityIntegrity(run.repositoryIdentity);
  const targetDir = deriveGitLocation(repo, location);

  if (request.branch !== repo.branch) {
    fail(
      "UNAUTHORIZED_GIT_OPERATION",
      "Branch does not match authorized repository identity",
    );
  }
  const destPath = existsSync(request.destination)
    ? realpathSync(request.destination)
    : resolve(request.destination);
  if (destPath !== repo.worktreeRealpath) {
    fail(
      "UNAUTHORIZED_GIT_OPERATION",
      "Destination does not match authorized repository identity",
    );
  }
  if (request.baseSha !== repo.baseSha) {
    fail(
      "UNAUTHORIZED_GIT_OPERATION",
      "Base SHA does not match authorized repository identity",
    );
  }

  const result = runSynchronous({
    binaryPath: tool.resolvedPath,
    vector: [
      "-c",
      "core.hooksPath=/dev/null",
      "worktree",
      "add",
      "-b",
      request.branch,
      request.destination,
      request.baseSha,
    ],
    directory: targetDir,
    variables: gitEnvironment(),
    timeoutMs: 60_000,
    maxOutputBytes: 10 * 1024 * 1024,
  });

  if (result.error) {
    fail(
      "GIT_COMMAND_FAILED",
      `Git command could not complete: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    fail(
      "GIT_COMMAND_FAILED",
      `Git worktree add failed with exit code ${String(result.status)}`,
    );
  }

  return result.stdout;
}

export type GitHubReadOperation =
  | Readonly<{ kind: "issue-view"; number: number }>
  | Readonly<{ kind: "pr-view"; number: number }>
  | Readonly<{ kind: "api-issue"; number: number }>
  | Readonly<{ kind: "api-pull"; number: number }>
  | Readonly<{ kind: "api-commit-check-runs"; commitSha: string }>;

export function executeGitHubRead(
  context: TrustedExecutionContext,
  operation: GitHubReadOperation,
  configDirectory?: string,
): string {
  const tool = assertTrustedExecutionContext(context, "gh");
  const run = assertRunHasTrustManifest(
    context.runId,
    context.stateStore,
  ) as TrustBoundRun;
  const repo = assertRepositoryIdentityIntegrity(run.repositoryIdentity);

  const cfgDir =
    configDirectory && isAbsolute(configDirectory)
      ? realpathSync(configDirectory)
      : "/nonexistent";

  let vector: readonly string[];
  switch (operation.kind) {
    case "issue-view":
      if (!Number.isSafeInteger(operation.number) || operation.number <= 0) {
        fail(
          "INVALID_GITHUB_RESOURCE",
          "issue number must be a positive integer",
        );
      }
      vector = [
        "issue",
        "view",
        String(operation.number),
        "--repo",
        repo.repositorySlug,
        "--json",
        "number,title,body,state",
      ];
      break;
    case "pr-view":
      if (!Number.isSafeInteger(operation.number) || operation.number <= 0) {
        fail("INVALID_GITHUB_RESOURCE", "pr number must be a positive integer");
      }
      vector = [
        "pr",
        "view",
        String(operation.number),
        "--repo",
        repo.repositorySlug,
        "--json",
        "number,headRefOid,baseRefOid,state",
      ];
      break;
    case "api-issue":
      if (!Number.isSafeInteger(operation.number) || operation.number <= 0) {
        fail(
          "INVALID_GITHUB_RESOURCE",
          "issue number must be a positive integer",
        );
      }
      vector = [
        "api",
        "--method",
        "GET",
        "--hostname",
        "github.com",
        `repos/${repo.repositorySlug}/issues/${operation.number}`,
      ];
      break;
    case "api-pull":
      if (!Number.isSafeInteger(operation.number) || operation.number <= 0) {
        fail("INVALID_GITHUB_RESOURCE", "pr number must be a positive integer");
      }
      vector = [
        "api",
        "--method",
        "GET",
        "--hostname",
        "github.com",
        `repos/${repo.repositorySlug}/pulls/${operation.number}`,
      ];
      break;
    case "api-commit-check-runs":
      if (!/^[0-9a-f]{40}$/u.test(operation.commitSha)) {
        fail(
          "INVALID_GITHUB_RESOURCE",
          "commitSha must be a valid 40-character hex string",
        );
      }
      vector = [
        "api",
        "--method",
        "GET",
        "--hostname",
        "github.com",
        `repos/${repo.repositorySlug}/commits/${operation.commitSha}/check-runs`,
      ];
      break;
    default:
      fail("UNAUTHORIZED_GITHUB_OPERATION", "GitHub operation not allowlisted");
  }

  const result = runSynchronous({
    binaryPath: tool.resolvedPath,
    vector,
    directory: cfgDir,
    variables: githubEnvironment(cfgDir),
    timeoutMs: 30_000,
    maxOutputBytes: 2 * 1024 * 1024,
  });

  if (result.error) {
    fail(
      "GITHUB_READ_FAILED",
      `GitHub read could not complete: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    fail(
      "GITHUB_READ_FAILED",
      `GitHub read failed with exit code ${String(result.status)}`,
    );
  }

  return result.stdout;
}

export interface CodexReviewRequest {
  readonly schemaPath: string;
  readonly prompt: string;
  readonly targetDirectory: string;
  readonly runtimeDirectory?: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

export async function executeCodexReview(
  context: TrustedExecutionContext,
  request: CodexReviewRequest,
): Promise<AsyncExecutionResult> {
  const tool = assertTrustedExecutionContext(context, "codex");
  const run = assertRunHasTrustManifest(
    context.runId,
    context.stateStore,
  ) as TrustBoundRun;
  const repo = assertRepositoryIdentityIntegrity(run.repositoryIdentity);

  const realTarget = realpathSync(request.targetDirectory);
  if (
    realTarget !== repo.worktreeRealpath &&
    realTarget !== repo.repositoryRealpath &&
    realTarget !== repo.mainCloneRealpath
  ) {
    fail(
      "UNAUTHORIZED_CODEX_PATH",
      "Target directory does not match any authorized location in repository identity",
    );
  }
  if (
    !isAbsolute(request.schemaPath) ||
    !existsSync(request.schemaPath) ||
    !lstatSync(request.schemaPath).isFile()
  ) {
    fail(
      "INVALID_CODEX_CONFIG",
      "Schema path must be an existing absolute regular file",
    );
  }
  if (
    typeof request.prompt !== "string" ||
    request.prompt.length === 0 ||
    request.prompt.length > 200_000 ||
    request.prompt.includes("\0")
  ) {
    fail("INVALID_CODEX_PROMPT", "Codex prompt is invalid");
  }

  const runtimeDir =
    request.runtimeDirectory && isAbsolute(request.runtimeDirectory)
      ? realpathSync(request.runtimeDirectory)
      : "/nonexistent";

  const vector = Object.freeze([
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--strict-config",
    "-c",
    "mcp_servers={}",
    "--sandbox",
    "read-only",
    "--ephemeral",
    "--json",
    "--output-schema",
    realpathSync(request.schemaPath),
    "--cd",
    realTarget,
    "--",
    request.prompt,
  ]);

  return await runAsynchronous({
    binaryPath: tool.resolvedPath,
    vector,
    directory: realTarget,
    variables: codexEnvironment(runtimeDir),
    timeoutMs: request.timeoutMs ?? 300_000,
    maxOutputBytes: request.maxOutputBytes ?? 5 * 1024 * 1024,
  });
}

export type VerificationToolName =
  "prettier" | "eslint" | "architecture" | "typescript" | "vitest";

export type VerificationProfileName = "docs-only" | "code-standard";

export const VERIFIER_IMAGE_ID =
  "sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d";
export const VERIFIER_REPO_DIGEST =
  "node@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d";
export const VERIFIER_PLATFORM = "linux/arm64" as const;
export const VERIFIER_ENGINE_OS = "linux" as const;
export const VERIFIER_ENGINE_ARCH = "aarch64" as const;
export const VERIFIER_NODE_VERSION = "24.18.0";

export interface VerificationRuntimeEvidence {
  readonly dockerCliVersion: string;
  readonly dockerEngineVersion: string;
  readonly dockerEngineOs: typeof VERIFIER_ENGINE_OS;
  readonly dockerEngineArch: typeof VERIFIER_ENGINE_ARCH;
  readonly imageId: typeof VERIFIER_IMAGE_ID;
  readonly repoDigest: typeof VERIFIER_REPO_DIGEST;
  readonly platform: typeof VERIFIER_PLATFORM;
  readonly nodeVersion: string;
  readonly pnpmVersion: string;
  readonly prettierVersion: string;
  readonly eslintVersion: string;
  readonly typescriptVersion: string;
  readonly vitestVersion: string;
  readonly architectureScriptSha256: string;
  readonly packageJsonSha256: string;
  readonly pnpmLockSha256: string;
  readonly pnpmWorkspaceSha256: string;
}

export type DockerVerificationExecution = AsyncExecutionResult &
  Readonly<{ runtimeEvidence: VerificationRuntimeEvidence }>;

export interface DockerVerificationRequest {
  readonly profile: VerificationProfileName;
  readonly tool: VerificationToolName;
  readonly targetDirectory: string;
  readonly dependencySnapshotPath: string;
  readonly pnpmRootPath: string;
  readonly runtimeDirectory: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

type DockerImagePayload = Readonly<{
  Id: string;
  RepoDigests: readonly string[];
  Os: string;
  Architecture: string;
}>;

function isWithinPath(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseJsonObject(
  output: string,
  label: string,
): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(output.trim()) as unknown;
  } catch {
    fail("DOCKER_RUNTIME_MALFORMED", `${label} did not return valid JSON`);
  }
  if (!isRecord(value)) {
    fail("DOCKER_RUNTIME_MALFORMED", `${label} did not return a JSON object`);
  }
  return value;
}

function requireStringField(
  value: Record<string, unknown>,
  field: string,
  label: string,
): string {
  const fieldValue = value[field];
  if (typeof fieldValue !== "string" || fieldValue.trim().length === 0) {
    fail("DOCKER_RUNTIME_MALFORMED", `${label}.${field} is invalid`);
  }
  return fieldValue;
}

function inspectDockerRuntime(
  binaryPath: string,
  directory: string,
): Readonly<{
  cliVersion: string;
  engineVersion: string;
  engineOs: typeof VERIFIER_ENGINE_OS;
  engineArch: typeof VERIFIER_ENGINE_ARCH;
}> {
  const version = runSynchronous({
    binaryPath,
    vector: ["version", "--format", "{{json .}}"],
    directory,
    variables: verificationEnvironment(),
    timeoutMs: 30_000,
    maxOutputBytes: 1024 * 1024,
  });
  if (version.error || version.status !== 0) {
    fail(
      "DOCKER_RUNTIME_UNAVAILABLE",
      `Docker version inspection failed with exit code ${String(version.status)}`,
    );
  }
  const root = parseJsonObject(version.stdout, "docker version");
  const client = root.Client;
  const server = root.Server;
  if (!isRecord(client) || !isRecord(server)) {
    fail(
      "DOCKER_RUNTIME_MALFORMED",
      "Docker version response is missing Client or Server",
    );
  }
  const cliVersion = requireStringField(client, "Version", "Client");
  const engineVersion = requireStringField(server, "Version", "Server");
  const engineOs = requireStringField(server, "Os", "Server");
  const engineArch = requireStringField(server, "Arch", "Server");
  if (engineOs !== VERIFIER_ENGINE_OS || engineArch !== VERIFIER_ENGINE_ARCH) {
    fail(
      "DOCKER_PLATFORM_MISMATCH",
      "Docker Engine OS or architecture does not match the pinned verifier",
    );
  }
  return Object.freeze({
    cliVersion,
    engineVersion,
    engineOs: VERIFIER_ENGINE_OS,
    engineArch: VERIFIER_ENGINE_ARCH,
  });
}

function inspectVerifierImage(
  binaryPath: string,
  directory: string,
): DockerImagePayload {
  const inspect = runSynchronous({
    binaryPath,
    vector: ["image", "inspect", VERIFIER_IMAGE_ID, "--format", "{{json .}}"],
    directory,
    variables: verificationEnvironment(),
    timeoutMs: 30_000,
    maxOutputBytes: 1024 * 1024,
  });
  if (inspect.error || inspect.status !== 0) {
    fail(
      "DOCKER_IMAGE_UNAVAILABLE",
      `Pinned verifier image inspection failed with exit code ${String(
        inspect.status,
      )}`,
    );
  }
  const image = parseJsonObject(inspect.stdout, "docker image inspect");
  const id = requireStringField(image, "Id", "image");
  const os = requireStringField(image, "Os", "image");
  const architecture = requireStringField(image, "Architecture", "image");
  const repoDigests = image.RepoDigests;
  if (
    id !== VERIFIER_IMAGE_ID ||
    os !== "linux" ||
    architecture !== "arm64" ||
    !Array.isArray(repoDigests) ||
    repoDigests.some((entry) => typeof entry !== "string") ||
    !repoDigests.includes(VERIFIER_REPO_DIGEST)
  ) {
    fail(
      "DOCKER_IMAGE_IDENTITY_MISMATCH",
      "Pinned verifier image ID, digest, OS or architecture does not match",
    );
  }
  return Object.freeze({
    Id: id,
    RepoDigests: Object.freeze([...repoDigests] as string[]),
    Os: os,
    Architecture: architecture,
  });
}

function assertExternalDirectory(
  path: string,
  repo: RepositoryIdentity,
  label: string,
): string {
  if (!isAbsolute(path) || !existsSync(path)) {
    fail(
      "INVALID_VERIFICATION_CONFIG",
      `${label} must be an existing absolute path`,
    );
  }
  if (lstatSync(path).isSymbolicLink()) {
    fail("INVALID_VERIFICATION_CONFIG", `${label} must not be a symbolic link`);
  }
  const real = realpathSync(path);
  if (!lstatSync(real).isDirectory()) {
    fail("INVALID_VERIFICATION_CONFIG", `${label} must be a directory`);
  }
  for (const protectedRoot of [
    repo.repositoryRealpath,
    repo.worktreeRealpath,
    repo.mainCloneRealpath,
  ]) {
    if (
      isWithinPath(protectedRoot, real) ||
      isWithinPath(real, protectedRoot)
    ) {
      fail(
        "INVALID_VERIFICATION_CONFIG",
        `${label} must remain disjoint from repository paths`,
      );
    }
  }
  return real;
}

function assertSafeWorkspaceTree(root: string): void {
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const path = join(directory, entry.name);
      const stat = lstatSync(path);
      if (
        stat.isSocket() ||
        stat.isFIFO() ||
        stat.isCharacterDevice() ||
        stat.isBlockDevice()
      ) {
        fail(
          "UNSAFE_VERIFICATION_WORKSPACE",
          "Workspace contains a socket, FIFO or device",
        );
      }
      if (stat.isSymbolicLink()) {
        const target = realpathSync(path);
        if (!isWithinPath(root, target)) {
          fail(
            "UNSAFE_VERIFICATION_WORKSPACE",
            "Workspace symbolic link escapes the source worktree",
          );
        }
        continue;
      }
      if (stat.isDirectory()) walk(path);
    }
  };
  walk(root);
}

function verificationCommand(
  profile: VerificationProfileName,
  tool: VerificationToolName,
): readonly string[] {
  if (profile === "docs-only") {
    if (tool !== "prettier") {
      fail(
        "UNAUTHORIZED_VERIFICATION_TOOL",
        `Tool ${tool} is not authorized for profile docs-only`,
      );
    }
    return Object.freeze([
      "node",
      "/workspace/node_modules/prettier/bin/prettier.cjs",
      "--check",
      "docs",
      "README.md",
    ]);
  }
  if (profile !== "code-standard") {
    fail(
      "UNAUTHORIZED_VERIFICATION_PROFILE",
      `Profile ${String(profile)} is not allowlisted`,
    );
  }
  switch (tool) {
    case "prettier":
      return Object.freeze([
        "node",
        "/workspace/node_modules/prettier/bin/prettier.cjs",
        "--check",
        ".",
      ]);
    case "eslint":
      return Object.freeze([
        "node",
        "/workspace/node_modules/eslint/bin/eslint.js",
        ".",
      ]);
    case "architecture":
      return Object.freeze([
        "node",
        "/workspace/scripts/check-architecture.mjs",
      ]);
    case "typescript":
      return Object.freeze([
        "node",
        "/workspace/node_modules/typescript/bin/tsc",
        "-b",
        "--pretty",
        "false",
      ]);
    case "vitest":
      return Object.freeze([
        "node",
        "/workspace/node_modules/vitest/vitest.mjs",
        "run",
      ]);
    default:
      fail(
        "UNAUTHORIZED_VERIFICATION_TOOL",
        `Tool ${String(tool)} is not authorized for profile code-standard`,
      );
  }
}

export function buildDockerRunVector(input: {
  readonly sourcePath: string;
  readonly workspacePath: string;
  readonly nodeModulesPath: string;
  readonly pnpmRootPath: string;
  readonly command: readonly string[];
}): readonly string[] {
  const vector = [
    "run",
    "--rm",
    "--pull",
    "never",
    "--network",
    "none",
    "--read-only",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges:true",
    "--pids-limit",
    "256",
    "--memory",
    "4g",
    "--cpus",
    "2",
    "--user",
    "1000:1000",
    "--platform",
    VERIFIER_PLATFORM,
    "--workdir",
    "/workspace",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,nodev,size=256m",
    "--tmpfs",
    "/home/sandbox:rw,noexec,nosuid,nodev,size=64m",
    "--env",
    "HOME=/home/sandbox",
    "--env",
    "TMPDIR=/tmp",
    "--env",
    "XDG_CACHE_HOME=/home/sandbox/.cache",
    "--env",
    "CI=true",
    "--env",
    "PNPM_DISABLE_SELF_UPDATE_CHECK=1",
    "--env",
    "PATH=/usr/local/bin:/usr/bin:/bin:/opt/pnpm/bin",
    "--volume",
    `${input.sourcePath}:/source:ro`,
    "--volume",
    `${input.workspacePath}:/workspace`,
    "--volume",
    `${input.nodeModulesPath}:/workspace/node_modules:ro`,
    "--volume",
    `${input.pnpmRootPath}:/opt/pnpm:ro`,
    VERIFIER_IMAGE_ID,
    ...input.command,
  ];
  const serialized = vector.join("\n");
  if (
    serialized.includes("docker.sock") ||
    serialized.includes("/.ssh") ||
    serialized.includes("/.config") ||
    serialized.includes(":latest")
  ) {
    fail(
      "UNSAFE_DOCKER_VECTOR",
      "Docker vector contains a forbidden host mount or mutable tag",
    );
  }
  return Object.freeze(vector);
}

function runDockerProbe(input: {
  readonly binaryPath: string;
  readonly directory: string;
  readonly sourcePath: string;
  readonly workspacePath: string;
  readonly nodeModulesPath: string;
  readonly pnpmRootPath: string;
  readonly command: readonly string[];
}): string {
  const result = runSynchronous({
    binaryPath: input.binaryPath,
    vector: buildDockerRunVector(input),
    directory: input.directory,
    variables: verificationEnvironment(),
    timeoutMs: 60_000,
    maxOutputBytes: 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    fail(
      "DOCKER_RUNTIME_EVIDENCE_FAILED",
      `Docker evidence probe failed with exit code ${String(result.status)}`,
    );
  }
  const output = result.stdout.trim();
  if (output.length === 0) {
    fail(
      "DOCKER_RUNTIME_EVIDENCE_FAILED",
      "Docker evidence probe returned no output",
    );
  }
  return output.split(/\r?\n/u)[0] ?? "";
}

export async function executeDockerVerification(
  context: TrustedExecutionContext,
  request: DockerVerificationRequest,
): Promise<DockerVerificationExecution> {
  const docker = assertTrustedExecutionContext(context, "docker");
  const run = assertRunHasTrustManifest(
    context.runId,
    context.stateStore,
  ) as TrustBoundRun;
  const repo = assertRepositoryIdentityIntegrity(run.repositoryIdentity);
  const manifest = assertTrustManifestIntegrity(run.trustManifest);

  const realTarget = realpathSync(request.targetDirectory);
  if (realTarget !== repo.worktreeRealpath) {
    fail(
      "UNAUTHORIZED_VERIFICATION_PATH",
      "Verification may execute only against the authorized worktree",
    );
  }

  const dependencySnapshot = assertExternalDirectory(
    request.dependencySnapshotPath,
    repo,
    "dependencySnapshotPath",
  );
  const pnpmRoot = assertExternalDirectory(
    request.pnpmRootPath,
    repo,
    "pnpmRootPath",
  );
  const runtimeDirectory = assertExternalDirectory(
    request.runtimeDirectory,
    repo,
    "runtimeDirectory",
  );
  const nodeModulesCandidate = join(dependencySnapshot, "node_modules");
  if (
    !existsSync(nodeModulesCandidate) ||
    lstatSync(nodeModulesCandidate).isSymbolicLink()
  ) {
    fail(
      "INVALID_VERIFICATION_CONFIG",
      "dependencySnapshotPath/node_modules must exist and must not be a symlink",
    );
  }
  const nodeModulesPath = realpathSync(nodeModulesCandidate);
  if (
    !lstatSync(nodeModulesPath).isDirectory() ||
    !isWithinPath(dependencySnapshot, nodeModulesPath)
  ) {
    fail(
      "INVALID_VERIFICATION_CONFIG",
      "dependencySnapshotPath must contain its own node_modules directory",
    );
  }
  if (!existsSync(join(pnpmRoot, "bin", "pnpm.cjs"))) {
    fail(
      "INVALID_VERIFICATION_CONFIG",
      "pnpmRootPath must contain bin/pnpm.cjs",
    );
  }

  const packageJsonSha256 = sha256File(join(realTarget, "package.json"));
  const pnpmLockSha256 = sha256File(join(realTarget, "pnpm-lock.yaml"));
  const pnpmWorkspaceSha256 = sha256File(
    join(realTarget, "pnpm-workspace.yaml"),
  );
  if (
    packageJsonSha256 !== manifest.packageManifestHash ||
    pnpmLockSha256 !== manifest.lockfileHash ||
    pnpmWorkspaceSha256 !== manifest.workspaceManifestHash
  ) {
    fail(
      "VERIFICATION_MANIFEST_MISMATCH",
      "Workspace manifests do not match the immutable Trust Manifest",
    );
  }

  assertSafeWorkspaceTree(realTarget);
  const temporaryRoot = mkdtempSync(join(runtimeDirectory, "verification-"));
  const workspacePath = join(temporaryRoot, "workspace");

  try {
    cpSync(realTarget, workspacePath, {
      recursive: true,
      dereference: false,
      filter: (source) => {
        const rel = relative(realTarget, source);
        const first = rel.split(sep)[0];
        return first !== ".git" && first !== "node_modules";
      },
    });

    const dockerVersion = inspectDockerRuntime(docker.resolvedPath, realTarget);
    inspectVerifierImage(docker.resolvedPath, realTarget);

    const probeBase = {
      binaryPath: docker.resolvedPath,
      directory: realTarget,
      sourcePath: realTarget,
      workspacePath,
      nodeModulesPath,
      pnpmRootPath: pnpmRoot,
    } as const;

    const nodeVersion = runDockerProbe({
      ...probeBase,
      command: ["node", "--version"],
    }).replace(/^v/u, "");
    const pnpmVersion = runDockerProbe({
      ...probeBase,
      command: ["node", "/opt/pnpm/bin/pnpm.cjs", "--version"],
    });
    const prettierVersion = runDockerProbe({
      ...probeBase,
      command: [
        "node",
        "/workspace/node_modules/prettier/bin/prettier.cjs",
        "--version",
      ],
    });
    const eslintVersion = runDockerProbe({
      ...probeBase,
      command: [
        "node",
        "/workspace/node_modules/eslint/bin/eslint.js",
        "--version",
      ],
    }).replace(/^v/u, "");
    const typescriptVersion = runDockerProbe({
      ...probeBase,
      command: [
        "node",
        "/workspace/node_modules/typescript/bin/tsc",
        "--version",
      ],
    }).replace(/^Version\s+/u, "");
    const vitestVersion = runDockerProbe({
      ...probeBase,
      command: [
        "node",
        "/workspace/node_modules/vitest/vitest.mjs",
        "--version",
      ],
    });

    if (
      nodeVersion !== VERIFIER_NODE_VERSION ||
      pnpmVersion !== "11.7.0" ||
      prettierVersion !== "3.9.5" ||
      eslintVersion !== "9.39.4" ||
      typescriptVersion !== "5.9.3" ||
      !vitestVersion.startsWith("vitest/4.1.10")
    ) {
      fail(
        "VERIFICATION_TOOL_VERSION_MISMATCH",
        "Sandbox tool versions do not match the pinned verifier",
      );
    }

    const runtimeEvidence: VerificationRuntimeEvidence = Object.freeze({
      dockerCliVersion: dockerVersion.cliVersion,
      dockerEngineVersion: dockerVersion.engineVersion,
      dockerEngineOs: dockerVersion.engineOs,
      dockerEngineArch: dockerVersion.engineArch,
      imageId: VERIFIER_IMAGE_ID,
      repoDigest: VERIFIER_REPO_DIGEST,
      platform: VERIFIER_PLATFORM,
      nodeVersion,
      pnpmVersion,
      prettierVersion,
      eslintVersion,
      typescriptVersion,
      vitestVersion,
      architectureScriptSha256: sha256File(
        join(workspacePath, "scripts", "check-architecture.mjs"),
      ),
      packageJsonSha256,
      pnpmLockSha256,
      pnpmWorkspaceSha256,
    });

    const execution = await runAsynchronous({
      binaryPath: docker.resolvedPath,
      vector: buildDockerRunVector({
        sourcePath: realTarget,
        workspacePath,
        nodeModulesPath,
        pnpmRootPath: pnpmRoot,
        command: verificationCommand(request.profile, request.tool),
      }),
      directory: realTarget,
      variables: verificationEnvironment(),
      timeoutMs: request.timeoutMs ?? 180_000,
      maxOutputBytes: request.maxOutputBytes ?? 10 * 1024 * 1024,
    });

    return Object.freeze({ ...execution, runtimeEvidence });
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}
