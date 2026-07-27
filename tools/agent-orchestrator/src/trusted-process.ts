import { spawn, spawnSync } from "node:child_process";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";

import { isRecord } from "./contracts.ts";
import {
  assertRepositoryIdentityIntegrity,
  assertToolIdentityIntegrity,
  type RepositoryIdentity,
  type ToolIdentity,
  type ToolName,
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
    analyzerVersion: string;
    remoteIdentity: string;
    commonGitDirIdentity: string;
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
      analyzerVersion: string;
      remoteIdentity: string;
      commonGitDirIdentity: string;
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

export interface NodeVerificationRequest {
  readonly profile: VerificationProfileName;
  readonly tool: VerificationToolName;
  readonly targetDirectory: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

export async function executeNodeVerification(
  context: TrustedExecutionContext,
  request: NodeVerificationRequest,
): Promise<AsyncExecutionResult> {
  const tool = assertTrustedExecutionContext(context, "node");
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
      "UNAUTHORIZED_VERIFICATION_PATH",
      "Target directory does not match any authorized location in repository identity",
    );
  }

  let relativeScript: string;
  let args: readonly string[];

  if (request.profile === "docs-only") {
    if (request.tool !== "prettier") {
      fail(
        "UNAUTHORIZED_VERIFICATION_TOOL",
        `Tool ${request.tool} is not authorized for profile docs-only`,
      );
    }
    relativeScript = "node_modules/prettier/bin/prettier.cjs";
    args = ["--check", "docs", "README.md"];
  } else if (request.profile === "code-standard") {
    switch (request.tool) {
      case "prettier":
        relativeScript = "node_modules/prettier/bin/prettier.cjs";
        args = ["--check", "."];
        break;
      case "eslint":
        relativeScript = "node_modules/eslint/bin/eslint.js";
        args = ["."];
        break;
      case "architecture":
        relativeScript = "scripts/check-architecture.mjs";
        args = [];
        break;
      case "typescript":
        relativeScript = "node_modules/typescript/bin/tsc";
        args = ["-b", "--pretty", "false"];
        break;
      case "vitest":
        relativeScript = "node_modules/vitest/vitest.mjs";
        args = ["run"];
        break;
      default:
        fail(
          "UNAUTHORIZED_VERIFICATION_TOOL",
          `Tool ${String(request.tool)} is not authorized for profile code-standard`,
        );
    }
  } else {
    fail(
      "UNAUTHORIZED_VERIFICATION_PROFILE",
      `Profile ${String(request.profile)} is not allowlisted`,
    );
  }

  const scriptPath = resolve(realTarget, relativeScript);
  if (
    !existsSync(scriptPath) ||
    !lstatSync(realpathSync(scriptPath)).isFile()
  ) {
    fail(
      "VERIFICATION_PREFLIGHT_FAILED",
      `Verification script is not a regular file: ${relativeScript}`,
    );
  }
  const realScript = realpathSync(scriptPath);
  const vector = Object.freeze([realScript, ...args]);

  return await runAsynchronous({
    binaryPath: tool.resolvedPath,
    vector,
    directory: realTarget,
    variables: verificationEnvironment(),
    timeoutMs: request.timeoutMs ?? 180_000,
    maxOutputBytes: request.maxOutputBytes ?? 10 * 1024 * 1024,
  });
}
