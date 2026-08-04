import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const cwd = fileURLToPath(new URL("../../..", import.meta.url));

function run(args: readonly string[]) {
  return spawnSync(
    process.execPath,
    ["--experimental-strip-types", cli, ...args],
    { cwd, encoding: "utf8" },
  );
}

describe("orchestrator CLI", () => {
  it("diagnoses in dry-run mode with structured output", () => {
    const result = run(["diagnose", "--format", "json"]);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout) as {
      schema_version: string;
      result: string;
      dry_run: boolean;
      data: { network_listeners: boolean; production_access: boolean };
    };
    expect(output.schema_version).toBe("1.0");
    expect(output.result).toBe("DRY_RUN");
    expect(output.dry_run).toBe(true);
    expect(output.data.network_listeners).toBe(false);
    expect(output.data.production_access).toBe(false);
  });

  it("rejects unknown commands", () => {
    const result = run(["merge", "--format", "json"]);
    expect(result.status).toBe(2);
    expect(result.stdout).toContain("UNKNOWN_COMMAND");
  });

  it("rejects arbitrary options instead of treating them as shell", () => {
    const result = run(["diagnose", "--shell", "rm -rf /"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("UNEXPECTED_ERROR");
  });

  it("plans without executing effects", () => {
    const result = run(["plan", "--issue", "24", "--format", "json"]);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout) as {
      result: string;
      data: { effects_executed: number };
    };
    expect(output.result).toBe("DRY_RUN");
    expect(output.data.effects_executed).toBe(0);
  });

  it("pilot:preflight runs in dry-run mode and executes zero effects", () => {
    const result = run([
      "pilot:preflight",
      "--format",
      "json",
      "--issue-body",
      "test body",
      "--current-branch",
      "main",
      "--head-sha",
      "633c98c6effd7523a623c6e3a180e9dc06b877cf",
      "--worktree-clean",
      "--index-clean",
    ]);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout) as {
      result: string;
      dry_run: boolean;
      schema_version: string;
      data: {
        effects_executed: number;
        issue_number: number;
        repository: string;
        checks: unknown[];
      };
    };
    expect(output.result).toBe("DRY_RUN");
    expect(output.dry_run).toBe(true);
    expect(output.schema_version).toBe("1.0");
    expect(output.data.effects_executed).toBe(0);
    expect(output.data.issue_number).toBe(27);
    expect(output.data.repository).toBe("Ciesparza29/ANKLO_OS");
    expect(Array.isArray(output.data.checks)).toBe(true);
  });

  it("pilot:preflight rejects --apply before executing any effect", () => {
    const result = run([
      "pilot:preflight",
      "--apply",
      "--format",
      "json",
      "--issue-body",
      "test body",
    ]);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("APPLY_NOT_SUPPORTED");
  });

  it("run:bind-target dry-run is diagnostic only and executes zero effects", () => {
    const result = run([
      "run:bind-target",
      "--format",
      "json",
      "--run-id",
      "test-run-id",
      "--target-repository",
      "Ciesparza29/ANKLO_OS",
      "--target-remote",
      "origin",
      "--target-branch",
      "feat/27-supervised-pilot-v7",
      "--target-head-sha",
      "633c98c6effd7523a623c6e3a180e9dc06b877cf",
      "--worktree-id",
      "test-worktree-id",
      "--authorized-files-hash",
      "f67ed6526c1c0bfe68ec1d24ffd048a98438282a13ea7467c272fdcb2314a69f",
      "--package-hash",
      "c1219cd5807c269a1730262c46f1cd346b76680eb079688c7daf02852c8257b3",
    ]);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout) as {
      result: string;
      data: { effects_executed: number };
    };
    expect(output.result).toBe("DRY_RUN");
    expect(output.data.effects_executed).toBe(0);
  });

  it("run:bind-target --apply is rejected before opening or mutating StateStore", () => {
    const result = run([
      "run:bind-target",
      "--apply",
      "--format",
      "json",
      "--run-id",
      "test-run-id",
      "--target-repository",
      "Ciesparza29/ANKLO_OS",
      "--target-remote",
      "origin",
      "--target-branch",
      "feat/27-supervised-pilot-v7",
      "--target-head-sha",
      "633c98c6effd7523a623c6e3a180e9dc06b877cf",
      "--worktree-id",
      "test-worktree-id",
      "--authorized-files-hash",
      "f67ed6526c1c0bfe68ec1d24ffd048a98438282a13ea7467c272fdcb2314a69f",
      "--package-hash",
      "c1219cd5807c269a1730262c46f1cd346b76680eb079688c7daf02852c8257b3",
    ]);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("APPLY_NOT_SUPPORTED");
  });
});
