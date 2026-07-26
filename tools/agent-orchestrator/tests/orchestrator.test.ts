import {
  realpathSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDefaultConfig } from "../src/contracts.ts";
import { resolveStateDatabasePath } from "../src/orchestrator.ts";

const tempDirs: string[] = [];

function createPaths() {
  const dir = mkdtempSync(
    join(realpathSync(tmpdir()), "anklo-orchestrator-paths-"),
  );
  tempDirs.push(dir);
  const repoRoot = join(dir, "repo");
  const runtimeDir = join(dir, "runtime");
  mkdirSync(repoRoot);
  mkdirSync(runtimeDir);
  const config = {
    ...createDefaultConfig(repoRoot, dir),
    runtimeDir,
  };
  return { dir, repoRoot, runtimeDir, config };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("state database path containment", () => {
  it("allows only paths within runtime and outside the repository", () => {
    const { config, repoRoot, runtimeDir } = createPaths();
    expect(
      resolveStateDatabasePath(
        config,
        join(runtimeDir, "state", "orchestrator.sqlite"),
      ),
    ).toBe(join(runtimeDir, "state", "orchestrator.sqlite"));
    expect(() =>
      resolveStateDatabasePath(config, join(repoRoot, "state.sqlite")),
    ).toThrow(/outside the repository/u);
    expect(() =>
      resolveStateDatabasePath(config, join(runtimeDir, "..", "escape.sqlite")),
    ).toThrow(/inside the configured runtime/u);
  });

  it("rejects symlink traversal", () => {
    const { config, runtimeDir, repoRoot } = createPaths();
    const linked = join(runtimeDir, "linked");
    symlinkSync(repoRoot, linked);
    expect(() =>
      resolveStateDatabasePath(config, join(linked, "state.sqlite")),
    ).toThrow(/symbolic links/u);
  });
});
