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
});
