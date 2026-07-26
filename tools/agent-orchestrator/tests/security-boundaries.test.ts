import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDir = fileURLToPath(new URL("../src", import.meta.url));
const networkListeners = [
  "node:http",
  "node:https",
  "node:net",
  "node:dgram",
  "node:cluster",
];

describe("static security boundaries", () => {
  it("does not import network-listener or cluster modules anywhere in src", () => {
    const source = readdirSync(sourceDir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(join(sourceDir, file), "utf8"))
      .join("\n");

    for (const forbidden of networkListeners) {
      expect(source).not.toContain(`from "${forbidden}"`);
      expect(source).not.toContain(`from '${forbidden}'`);
    }
  });

  it("restricts node:child_process to authorized execution adapters and forbids arbitrary shell execution", () => {
    const files = readdirSync(sourceDir).filter((file) => file.endsWith(".ts"));
    const authorizedForChildProcess = [
      "worktree.ts",
      "verification-runner.ts",
      "codex-adapter.ts",
    ];

    for (const file of files) {
      const content = readFileSync(join(sourceDir, file), "utf8");
      if (!authorizedForChildProcess.includes(file)) {
        expect(content).not.toContain('from "node:child_process"');
        expect(content).not.toContain("from 'node:child_process'");
      } else {
        // Enforce safe binary spawning: no arbitrary string evaluation or shell: true
        expect(content).not.toMatch(/\bexec\s*\(/);
        expect(content).not.toContain("shell: true");
      }
    }
  });
});
