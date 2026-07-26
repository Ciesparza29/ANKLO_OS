import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { OrchestratorError } from "./errors.ts";

export interface VerificationCommand {
  readonly executable: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
  readonly failurePolicy: "ABORT" | "WARN";
}

export interface VerificationProfile {
  readonly name: string;
  readonly description: string;
  readonly commands: readonly VerificationCommand[];
}

export interface CommandExecutionResult {
  readonly executable: string;
  readonly args: readonly string[];
  readonly exitCode: number | null;
  readonly signal: string | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly success: boolean;
}

export interface ProfileExecutionResult {
  readonly profileName: string;
  readonly success: boolean;
  readonly aborted: boolean;
  readonly results: readonly CommandExecutionResult[];
  readonly timestamp: string;
}

export class VerificationRunner {
  readonly #profiles: Map<string, VerificationProfile> = new Map();

  constructor(customProfiles?: readonly VerificationProfile[]) {
    this.#registerDefaultProfiles();
    if (customProfiles) {
      for (const p of customProfiles) {
        this.registerProfile(p);
      }
    }
  }

  #registerDefaultProfiles(): void {
    this.registerProfile({
      name: "docs-only",
      description:
        "Verifies documentation formatting and structure without building code",
      commands: [
        {
          executable: "npx",
          args: ["prettier", "--check", "docs/", "README.md"],
          timeoutMs: 60000,
          maxOutputBytes: 1024 * 1024,
          failurePolicy: "ABORT",
        },
      ],
    });

    this.registerProfile({
      name: "code-standard",
      description:
        "Standard code verification including linting, type-checking, and tests",
      commands: [
        {
          executable: "pnpm",
          args: ["test", "tools/agent-orchestrator/tests/"],
          timeoutMs: 120000,
          maxOutputBytes: 5 * 1024 * 1024,
          failurePolicy: "ABORT",
        },
      ],
    });

    this.registerProfile({
      name: "full-verify",
      description:
        "Full repository verification pipeline per ANKLO-OS standards",
      commands: [
        {
          executable: "pnpm",
          args: ["verify"],
          timeoutMs: 600000,
          maxOutputBytes: 10 * 1024 * 1024,
          failurePolicy: "ABORT",
        },
      ],
    });
  }

  /**
   * Registers a verification profile into the allowlist after strict validation.
   */
  registerProfile(profile: VerificationProfile): void {
    if (!profile.name || profile.name.trim() === "") {
      throw new OrchestratorError(
        "INVALID_VERIFICATION_PROFILE",
        "Profile name cannot be empty",
      );
    }
    if (!profile.commands || profile.commands.length === 0) {
      throw new OrchestratorError(
        "INVALID_VERIFICATION_PROFILE",
        `Profile ${profile.name} must have at least one command`,
      );
    }

    for (const cmd of profile.commands) {
      if (
        !cmd.executable ||
        cmd.executable.trim() === "" ||
        cmd.executable.includes(";") ||
        cmd.executable.includes("&") ||
        cmd.executable.includes("|")
      ) {
        throw new OrchestratorError(
          "INVALID_VERIFICATION_COMMAND",
          `Invalid executable name in profile ${profile.name}: ${cmd.executable}`,
        );
      }
      if (cmd.timeoutMs <= 0 || cmd.maxOutputBytes <= 0) {
        throw new OrchestratorError(
          "INVALID_VERIFICATION_COMMAND",
          `Timeout and max output bytes must be positive in profile ${profile.name}`,
        );
      }
    }

    this.#profiles.set(profile.name, profile);
  }

  /**
   * Retrieves an allowlisted profile by name.
   */
  getProfile(name: string): VerificationProfile {
    const p = this.#profiles.get(name);
    if (!p) {
      throw new OrchestratorError(
        "UNAUTHORIZED_VERIFICATION_PROFILE",
        `Verification profile is not in the allowlist: ${name}`,
      );
    }
    return p;
  }

  /**
   * Executes an allowlisted verification profile in the specified working directory.
   * Strictly forbids arbitrary command strings or shell evaluation.
   */
  runProfile(profileName: string, cwd: string): ProfileExecutionResult {
    if (!existsSync(cwd)) {
      throw new OrchestratorError(
        "VERIFICATION_EXECUTION_FAILED",
        `Working directory does not exist: ${cwd}`,
      );
    }

    const profile = this.getProfile(profileName);
    const results: CommandExecutionResult[] = [];
    let overallSuccess = true;
    let aborted = false;

    for (const cmd of profile.commands) {
      const res = spawnSync(cmd.executable, cmd.args as string[], {
        cwd,
        timeout: cmd.timeoutMs,
        maxBuffer: cmd.maxOutputBytes,
        encoding: "utf8",
        shell: false,
      });

      const timedOut = Boolean(
        res.error && "code" in res.error && res.error.code === "ETIMEDOUT",
      );
      const success = res.status === 0 && !timedOut;

      const cmdResult: CommandExecutionResult = {
        executable: cmd.executable,
        args: cmd.args,
        exitCode: res.status,
        signal: res.signal,
        stdout: res.stdout || "",
        stderr: res.stderr || (res.error ? res.error.message : ""),
        timedOut,
        success,
      };

      results.push(cmdResult);

      if (!success) {
        overallSuccess = false;
        if (cmd.failurePolicy === "ABORT") {
          aborted = true;
          break;
        }
      }
    }

    return {
      profileName: profile.name,
      success: overallSuccess,
      aborted,
      results,
      timestamp: new Date().toISOString(),
    };
  }
}
