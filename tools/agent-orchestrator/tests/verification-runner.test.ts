import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { VerificationRunner } from "../src/verification-runner.ts";

const tempDirs: string[] = [];

function createTempDir(name = "test-run"): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "anklo-runner-test-")));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("Allowlisted Verification Runner (ADR-0010 Section 13)", () => {
  it("registers default allowlisted profiles", () => {
    const runner = new VerificationRunner();
    expect(runner.getProfile("docs-only").name).toBe("docs-only");
    expect(runner.getProfile("code-standard").name).toBe("code-standard");
    expect(runner.getProfile("full-verify").name).toBe("full-verify");
  });

  it("throws UNAUTHORIZED_VERIFICATION_PROFILE when requesting unlisted profiles", () => {
    const runner = new VerificationRunner();
    expect(() => runner.getProfile("arbitrary-cmd")).toThrow(
      /not in the allowlist/,
    );
    expect(() => runner.runProfile("rm -rf /", "/tmp")).toThrow(
      /not in the allowlist/,
    );
  });

  it("validates registered profile names and commands strictly", () => {
    const runner = new VerificationRunner();
    expect(() =>
      runner.registerProfile({
        name: "",
        description: "empty name",
        commands: [],
      }),
    ).toThrow(/cannot be empty/);

    expect(() =>
      runner.registerProfile({
        name: "dangerous",
        description: "shell operators",
        commands: [
          {
            executable: "sh; rm -rf /",
            args: [],
            timeoutMs: 1000,
            maxOutputBytes: 1000,
            failurePolicy: "ABORT",
          },
        ],
      }),
    ).toThrow(/Invalid executable name/);
  });

  it("executes allowlisted profile and returns structured result", () => {
    const cwd = createTempDir();
    const runner = new VerificationRunner([
      {
        name: "test-echo",
        description: "simple echo test",
        commands: [
          {
            executable: "node",
            args: ["-e", "console.log('verification success')"],
            timeoutMs: 5000,
            maxOutputBytes: 1024,
            failurePolicy: "ABORT",
          },
        ],
      },
    ]);

    const res = runner.runProfile("test-echo", cwd);
    expect(res.profileName).toBe("test-echo");
    expect(res.success).toBe(true);
    expect(res.aborted).toBe(false);
    expect(res.results.length).toBe(1);
    expect(res.results[0].exitCode).toBe(0);
    expect(res.results[0].stdout.trim()).toBe("verification success");
  });

  it("aborts execution when command fails under ABORT policy", () => {
    const cwd = createTempDir();
    const runner = new VerificationRunner([
      {
        name: "test-abort",
        description: "failing command test",
        commands: [
          {
            executable: "node",
            args: ["-e", "process.exit(1)"],
            timeoutMs: 5000,
            maxOutputBytes: 1024,
            failurePolicy: "ABORT",
          },
          {
            executable: "node",
            args: ["-e", "console.log('should not run')"],
            timeoutMs: 5000,
            maxOutputBytes: 1024,
            failurePolicy: "ABORT",
          },
        ],
      },
    ]);

    const res = runner.runProfile("test-abort", cwd);
    expect(res.success).toBe(false);
    expect(res.aborted).toBe(true);
    expect(res.results.length).toBe(1);
    expect(res.results[0].exitCode).toBe(1);
  });
});
