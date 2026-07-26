import {
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  sanitizeVerificationOutput,
  VerificationRunner,
} from "../src/verification-runner.ts";
import { WorktreeManager } from "../src/worktree.ts";

const projectRoot = realpathSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../.."),
);
const temporaryDirectories: string[] = [];

function git(cwd: string, args: readonly string[]): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function createDocsWorktree(): {
  root: string;
  main: string;
  worktree: string;
  head: string;
} {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "anklo-runner-test-")));
  temporaryDirectories.push(root);
  const main = join(root, "main");
  const worktree = join(root, "worktree");
  mkdirSync(join(main, "docs"), { recursive: true });
  git(main, ["init", "-b", "main"]);
  git(main, ["config", "user.email", "test@anklo.local"]);
  git(main, ["config", "user.name", "Test User"]);
  git(main, [
    "remote",
    "add",
    "origin",
    "https://github.com/Ciesparza29/ANKLO_OS.git",
  ]);
  writeFileSync(join(main, "README.md"), "# Test\n", "utf8");
  writeFileSync(join(main, "docs", "README.md"), "# Docs\n", "utf8");
  writeFileSync(
    join(main, "package.json"),
    JSON.stringify(
      {
        packageManager: "pnpm@11.7.0",
        devDependencies: {
          prettier: "3.9.5",
          eslint: "9.39.4",
          typescript: "5.9.3",
          vitest: "4.1.10",
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  symlinkSync(join(projectRoot, "node_modules"), join(main, "node_modules"));
  git(main, [
    "add",
    "README.md",
    "docs/README.md",
    "package.json",
    "node_modules",
  ]);
  git(main, ["commit", "-m", "docs fixture"]);
  const head = git(main, ["rev-parse", "HEAD"]);
  git(main, ["worktree", "add", "-b", "feat/docs", worktree, head]);
  return { root, main, worktree, head };
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe("closed verification runner", () => {
  it("exposes exactly docs-only and code-standard without registration", () => {
    const repo = createDocsWorktree();
    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repo.worktree],
      allowedParentDirectories: [repo.root],
      protectedWorktreePaths: [repo.main],
    });
    const runner = new VerificationRunner(manager);
    expect(runner.getProfile("docs-only").name).toBe("docs-only");
    expect(
      runner.getProfile("code-standard").commands.map((item) => item.tool),
    ).toEqual(["prettier", "eslint", "architecture", "typescript", "vitest"]);
    expect("registerProfile" in runner).toBe(false);
    expect(() => runner.getProfile("full-verify" as "docs-only")).toThrow();
  });

  it("executes docs-only in the exact clean worktree and records versions", async () => {
    const repo = createDocsWorktree();
    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repo.worktree],
      allowedParentDirectories: [repo.root],
      protectedWorktreePaths: [repo.main],
    });
    const result = await new VerificationRunner(manager).runProfile(
      "docs-only",
      repo.worktree,
      repo.head,
    );
    expect(result.success).toBe(true);
    expect(result.retries).toBe(0);
    expect(result.toolVersions.prettier).toBe("3.9.5");
    expect(result.beforeEvidence.headSha).toBe(result.afterEvidence.headSha);
  });

  it("redacts common credentials before results can be persisted", () => {
    expect(
      sanitizeVerificationOutput(
        "Authorization: Bearer abcdefghijklmnopqrstuvwxyz ghp_abcdefghijklmnopqrstuvwxyz sk-abcdefghijklmnopqrstuvwxyz",
      ),
    ).not.toMatch(/abcdefghijklmnopqrstuvwxyz/u);
  });
});
