import {
  executeDockerVerification,
  type TrustedExecutionContext,
  type VerificationRuntimeEvidence,
} from "./trusted-process.ts";

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

export interface VerificationRunnerConfig {
  readonly dependencySnapshotPath: string;
  readonly pnpmRootPath: string;
  readonly runtimeDirectory: string;
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
  readonly runtimeEvidence: VerificationRuntimeEvidence;
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
        "Checks repository documentation in the pinned Docker verifier",
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
        "Runs formatting, lint, architecture, typecheck and tests in the pinned Docker verifier",
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

const FAIL_CLOSED_CONFIG: VerificationRunnerConfig = Object.freeze({
  dependencySnapshotPath: "/nonexistent",
  pnpmRootPath: "/nonexistent",
  runtimeDirectory: "/nonexistent",
});

function fail(code: string, message: string): never {
  throw new OrchestratorError(code, message);
}

export function sanitizeVerificationOutput(output: string): string {
  return output
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/gu, "[REDACTED]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/gu, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/gu, "[REDACTED]");
}

async function executeCommand(
  context: TrustedExecutionContext,
  command: VerificationCommand,
  worktreePath: string,
  profile: VerificationProfileName,
  config: VerificationRunnerConfig,
): Promise<
  Readonly<{
    result: CommandExecutionResult;
    runtimeEvidence: VerificationRuntimeEvidence;
  }>
> {
  const execution = await executeDockerVerification(context, {
    profile,
    tool: command.tool,
    targetDirectory: worktreePath,
    dependencySnapshotPath: config.dependencySnapshotPath,
    pnpmRootPath: config.pnpmRootPath,
    runtimeDirectory: config.runtimeDirectory,
    timeoutMs: command.timeoutMs,
    maxOutputBytes: command.maxOutputBytes,
  });

  const cleanStdout = sanitizeVerificationOutput(execution.stdout);
  const cleanStderr = sanitizeVerificationOutput(
    execution.spawnError
      ? `${execution.stderr}\n${execution.spawnError.message}`
      : execution.stderr,
  );

  return Object.freeze({
    result: Object.freeze({
      tool: command.tool,
      executable: execution.resolvedBinary,
      args: execution.vector,
      exitCode: execution.exitCode,
      signal: execution.signal,
      stdout: cleanStdout,
      stderr: cleanStderr,
      timedOut: execution.timedOut,
      outputLimitExceeded: execution.outputLimitExceeded,
      success:
        execution.exitCode === 0 &&
        !execution.spawnError &&
        !execution.timedOut &&
        !execution.outputLimitExceeded,
    }),
    runtimeEvidence: execution.runtimeEvidence,
  });
}

export class VerificationRunner {
  readonly #worktreeManager: WorktreeManager;
  readonly #config: VerificationRunnerConfig;

  constructor(
    worktreeManager: WorktreeManager,
    config: VerificationRunnerConfig = FAIL_CLOSED_CONFIG,
  ) {
    this.#worktreeManager = worktreeManager;
    this.#config = Object.freeze({ ...config });
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
    context: TrustedExecutionContext,
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
      context,
      worktreePath,
      expectedHeadSha,
    );
    const profile = PROFILES[profileName];
    const results: CommandExecutionResult[] = [];
    let runtimeEvidence: VerificationRuntimeEvidence | null = null;

    for (const command of profile.commands) {
      const execution = await executeCommand(
        context,
        command,
        beforeEvidence.worktreePath,
        profileName,
        this.#config,
      );
      if (
        runtimeEvidence &&
        JSON.stringify(runtimeEvidence) !==
          JSON.stringify(execution.runtimeEvidence)
      ) {
        fail(
          "VERIFICATION_RUNTIME_CHANGED",
          "Docker runtime evidence changed during a fixed verification profile",
        );
      }
      runtimeEvidence ??= execution.runtimeEvidence;
      results.push(execution.result);
      if (!execution.result.success) break;
    }

    if (!runtimeEvidence) {
      fail(
        "VERIFICATION_RUNTIME_EVIDENCE_REQUIRED",
        "Verification completed without mandatory runtime evidence",
      );
    }

    const afterEvidence = this.#worktreeManager.validateWorktreeAccess(
      context,
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
      runtimeEvidence,
      beforeEvidence,
      afterEvidence,
      retries: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
