import { describe, expect, it } from "vitest";
import { createDefaultConfig, parseConfig } from "../src/contracts.ts";

const repoRoot = "/tmp/anklo/repo";

describe("orchestrator configuration", () => {
  it("uses dry-run and denied external effects by default", () => {
    const config = createDefaultConfig(repoRoot, "/tmp/anklo/home");
    expect(config.dryRunDefault).toBe(true);
    expect(config.networkListeners).toBe(false);
    expect(config.productionAccess).toBe(false);
    expect(config.runtimeDir.startsWith(config.repoRoot)).toBe(false);
  });

  it("rejects runtime storage inside the repository", () => {
    const config = createDefaultConfig(repoRoot, "/tmp/anklo/home");
    expect(() =>
      parseConfig({ ...config, runtimeDir: `${repoRoot}/runtime` }),
    ).toThrow(/outside the repository/u);
  });

  it("rejects denied capabilities in configuration", () => {
    const config = createDefaultConfig(repoRoot, "/tmp/anklo/home");
    expect(() =>
      parseConfig({
        ...config,
        allowedCapabilities: [...config.allowedCapabilities, "MERGE"],
      }),
    ).toThrow(/non-allowlisted capability/u);
  });
});
