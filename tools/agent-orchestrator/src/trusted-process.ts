import { spawn, spawnSync } from "node:child_process";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { delimiter, isAbsolute, join } from "node:path";

import type { ToolIdentity, ToolName } from "./operational-trust.ts";
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

type TrustBoundRun = RunRecord &
  Readonly<{
    trustManifestHash: string;
    repositoryIdentityHash: string;
    toolIdentities: readonly ToolIdentity[];
  }>;

type AsyncExecutionResult = Readonly<{
  resolvedBinary: string;
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

  return identity;
}

export function runGitCommand(request: {
  readonly binaryPath: string;
  readonly vector: readonly string[];
  readonly directory: string;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
}) {
  return runSynchronous({
    ...request,
    variables: gitEnvironment(),
  });
}

export function runGhCommand(request: {
  readonly binaryPath: string;
  readonly vector: readonly string[];
  readonly directory: string;
  readonly configDirectory: string;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
}) {
  return runSynchronous({
    binaryPath: request.binaryPath,
    vector: request.vector,
    directory: request.directory,
    variables: githubEnvironment(request.configDirectory),
    timeoutMs: request.timeoutMs,
    maxOutputBytes: request.maxOutputBytes,
  });
}

export async function runCodexCommand(request: {
  readonly binaryPath: string;
  readonly vector: readonly string[];
  readonly directory: string;
  readonly runtimeDirectory: string;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
}): Promise<AsyncExecutionResult> {
  return await runAsynchronous({
    binaryPath: request.binaryPath,
    vector: request.vector,
    directory: request.directory,
    variables: codexEnvironment(request.runtimeDirectory),
    timeoutMs: request.timeoutMs,
    maxOutputBytes: request.maxOutputBytes,
  });
}

export async function runVerificationCommandAsync(request: {
  readonly binaryPath: string;
  readonly vector: readonly string[];
  readonly directory: string;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
}): Promise<AsyncExecutionResult> {
  return await runAsynchronous({
    ...request,
    variables: verificationEnvironment(),
  });
}
