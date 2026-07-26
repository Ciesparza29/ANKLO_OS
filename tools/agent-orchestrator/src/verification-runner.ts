import { spawn } from "node:child_process";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { OrchestratorError } from "./errors.ts";
import { type GitEvidence, type WorktreeManager } from "./worktree.ts";

export const VERIFICATION_PROFILE_NAMES = [
  "docs-only",
  "code-standard",
] as const;

export type VerificationProfileName =
  (typeof VERIFICATION_PROFILE_NAMES)[number];

export interface VerificationCommand {
  readonly tool:
    "prettier" | "eslint" | "architecture" | "typescript" | "vitest";
  readonly relativeScript: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly failurePolicy: "ABORT";
}

export interface VerificationProfile {
  readonly name: VerificationProfileName;
  readonly description: string;
  readonly commands: readonly VerificationCommand[];
}

export interface CommandExecutionResult {
  readonly tool: VerificationCommand["tool"];
  readonly executable: string;
  readonly args: readonly string[];
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly outputLimitExceeded: boolean;
  readonly success: boolean;
}

export interface ProfileExecutionResult {
  readonly profileName: VerificationProfileName;
  readonly success: boolean;
  readonly aborted: boolean;
  readonly results: readonly CommandExecutionResult[];
  readonly toolVersions: Readonly<Record<string, string>>;
  readonly beforeEvidence: GitEvidence;
  readonly afterEvidence: GitEvidence;
  readonly retries: 0;
  readonly timestamp: string;
}

const MEBIBYTE = 1024 * 1024;

const PROFILES: Readonly<Record<VerificationProfileName, VerificationProfile>> =
  Object.freeze({
    "docs-only": Object.freeze({
      name: "docs-only",
      description:
        "Checks repository documentation with the installed Prettier",
      commands: Object.freeze([
        Object.freeze({
          tool: "prettier",
          relativeScript: "node_modules/prettier/bin/prettier.cjs",
          args: Object.freeze(["--check", "docs", "README.md"]),
          timeoutMs: 60_000,
          maxOutputBytes: MEBIBYTE,
          failurePolicy: "ABORT",
        }),
      ]),
    }),
    "code-standard": Object.freeze({
      name: "code-standard",
      description:
        "Runs formatting, lint, architecture, typecheck and tests with installed tools",
      commands: Object.freeze([
        Object.freeze({
          tool: "prettier",
          relativeScript: "node_modules/prettier/bin/prettier.cjs",
          args: Object.freeze(["--check", "."]),
          timeoutMs: 120_000,
          maxOutputBytes: 2 * MEBIBYTE,
          failurePolicy: "ABORT",
        }),
        Object.freeze({
          tool: "eslint",
          relativeScript: "node_modules/eslint/bin/eslint.js",
          args: Object.freeze(["."]),
          timeoutMs: 120_000,
          maxOutputBytes: 2 * MEBIBYTE,
          failurePolicy: "ABORT",
        }),
        Object.freeze({
          tool: "architecture",
          relativeScript: "scripts/check-architecture.mjs",
          args: Object.freeze([]),
          timeoutMs: 60_000,
          maxOutputBytes: MEBIBYTE,
          failurePolicy: "ABORT",
        }),
        Object.freeze({
          tool: "typescript",
          relativeScript: "node_modules/typescript/bin/tsc",
          args: Object.freeze(["-b", "--pretty", "false"]),
          timeoutMs: 180_000,
          maxOutputBytes: 5 * MEBIBYTE,
          failurePolicy: "ABORT",
        }),
        Object.freeze({
          tool: "vitest",
          relativeScript: "node_modules/vitest/vitest.mjs",
          args: Object.freeze(["run"]),
          timeoutMs: 180_000,
          maxOutputBytes: 10 * MEBIBYTE,
          failurePolicy: "ABORT",
        }),
      ]),
    }),
  });

function fail(code: string, message: string): never {
  throw new OrchestratorError(code, message);
}

function minimalEnvironment(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    HOME: "/nonexistent",
    XDG_CONFIG_HOME: "/nonexistent",
    TMPDIR: "/tmp",
    LANG: "C",
    LC_ALL: "C",
    CI: "1",
    NO_COLOR: "1",
    NODE_ENV: "test",
  };
}

export function sanitizeVerificationOutput(output: string): string {
  let sanitized = output
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/gu, "[REDACTED]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/gu, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/gu, "[REDACTED]");
  for (const [name, value] of Object.entries(process.env)) {
    if (
      value &&
      value.length >= 8 &&
      /(token|secret|password|api[_-]?key|credential)/iu.test(name)
    ) {
      sanitized = sanitized.split(value).join("[REDACTED]");
    }
  }
  return sanitized;
}

function terminateProcessTree(childPid: number | undefined): void {
  if (!childPid) return;
  try {
    if (process.platform === "win32") {
      process.kill(childPid, "SIGKILL");
    } else {
      process.kill(-childPid, "SIGKILL");
    }
  } catch {
    // The process may already have exited.
  }
}

function readToolVersions(
  worktreePath: string,
): Readonly<Record<string, string>> {
  const manifest = JSON.parse(
    readFileSync(join(worktreePath, "package.json"), "utf8"),
  ) as {
    packageManager?: string;
    engines?: { node?: string };
    devDependencies?: Record<string, string>;
  };
  return Object.freeze({
    node: process.version,
    packageManager: manifest.packageManager ?? "NOT_RECORDED",
    prettier: manifest.devDependencies?.prettier ?? "NOT_RECORDED",
    eslint: manifest.devDependencies?.eslint ?? "NOT_RECORDED",
    typescript: manifest.devDependencies?.typescript ?? "NOT_RECORDED",
    vitest: manifest.devDependencies?.vitest ?? "NOT_RECORDED",
  });
}

async function executeCommand(
  command: VerificationCommand,
  worktreePath: string,
): Promise<CommandExecutionResult> {
  const executable = process.execPath;
  const scriptPath = resolve(worktreePath, command.relativeScript);
  const realScript = realpathSync(scriptPath);
  if (!lstatSync(realScript).isFile()) {
    fail(
      "VERIFICATION_PREFLIGHT_FAILED",
      `Verification script is not a regular file: ${command.relativeScript}`,
    );
  }
  const args = Object.freeze([realScript, ...command.args]);

  return await new Promise<CommandExecutionResult>((resolveResult) => {
    const child = spawn(executable, args, {
      cwd: worktreePath,
      env: minimalEnvironment(),
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
      if (outputBytes > command.maxOutputBytes) {
        outputLimitExceeded = true;
        terminateProcessTree(child.pid);
        return;
      }
      if (channel === "stdout") stdout += chunk.toString("utf8");
      else stderr += chunk.toString("utf8");
    };
    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));
    child.once("error", (error) => {
      spawnError = error;
    });
    const timeout = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child.pid);
    }, command.timeoutMs);

    child.once("close", (exitCode, signal) => {
      clearTimeout(timeout);
      const cleanStdout = sanitizeVerificationOutput(stdout);
      const cleanStderr = sanitizeVerificationOutput(
        spawnError ? `${stderr}\n${spawnError.message}` : stderr,
      );
      resolveResult(
        Object.freeze({
          tool: command.tool,
          executable,
          args,
          exitCode,
          signal,
          stdout: cleanStdout,
          stderr: cleanStderr,
          timedOut,
          outputLimitExceeded,
          success:
            exitCode === 0 && !spawnError && !timedOut && !outputLimitExceeded,
        }),
      );
    });
  });
}

export class VerificationRunner {
  readonly #worktreeManager: WorktreeManager;

  constructor(worktreeManager: WorktreeManager) {
    this.#worktreeManager = worktreeManager;
  }

  getProfile(name: VerificationProfileName): VerificationProfile {
    if (!(VERIFICATION_PROFILE_NAMES as readonly string[]).includes(name)) {
      fail(
        "UNAUTHORIZED_VERIFICATION_PROFILE",
        `Verification profile is not allowlisted: ${String(name)}`,
      );
    }
    return PROFILES[name];
  }

  async runProfile(
    profileName: VerificationProfileName,
    worktreePath: string,
    expectedHeadSha: string,
  ): Promise<ProfileExecutionResult> {
    if (
      !(VERIFICATION_PROFILE_NAMES as readonly string[]).includes(profileName)
    ) {
      fail(
        "UNAUTHORIZED_VERIFICATION_PROFILE",
        `Verification profile is not allowlisted: ${String(profileName)}`,
      );
    }
    const beforeEvidence = this.#worktreeManager.validateWorktreeAccess(
      worktreePath,
      expectedHeadSha,
    );
    const profile = PROFILES[profileName];
    const results: CommandExecutionResult[] = [];
    for (const command of profile.commands) {
      const result = await executeCommand(command, beforeEvidence.worktreePath);
      results.push(result);
      if (!result.success) break;
    }
    const afterEvidence = this.#worktreeManager.validateWorktreeAccess(
      worktreePath,
      expectedHeadSha,
    );
    this.#worktreeManager.assertEvidenceUnchanged(
      beforeEvidence,
      afterEvidence,
    );
    const success =
      results.length === profile.commands.length &&
      results.every((result) => result.success);
    return Object.freeze({
      profileName,
      success,
      aborted: !success,
      results: Object.freeze(results),
      toolVersions: readToolVersions(beforeEvidence.worktreePath),
      beforeEvidence,
      afterEvidence,
      retries: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
