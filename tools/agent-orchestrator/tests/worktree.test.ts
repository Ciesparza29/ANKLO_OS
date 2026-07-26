import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { WorktreeManager } from "../src/worktree.ts";

const tempDirs: string[] = [];

function createTempGitRepo(name = "test-repo"): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "anklo-wt-test-")));
  tempDirs.push(dir);
  const repoDir = join(dir, name);
  spawnSync("mkdir", ["-p", repoDir]);
  spawnSync("git", ["init", "-b", "feat/test-branch"], { cwd: repoDir });
  spawnSync("git", ["config", "user.email", "test@anklo.local"], {
    cwd: repoDir,
  });
  spawnSync("git", ["config", "user.name", "Test User"], { cwd: repoDir });
  spawnSync("touch", ["README.md"], { cwd: repoDir });
  spawnSync("git", ["add", "README.md"], { cwd: repoDir });
  spawnSync("git", ["commit", "-m", "initial commit"], { cwd: repoDir });
  return repoDir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("Worktree Controls (ADR-0010 Section 9)", () => {
  it("validates allowlisted worktree access and captures git evidence", () => {
    const repoDir = createTempGitRepo();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
    }).stdout.trim();

    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repoDir],
    });

    const evidence = manager.validateWorktreeAccess(repoDir, headSha);
    expect(evidence.headSha).toBe(headSha);
    expect(evidence.branch).toBe("feat/test-branch");
    expect(evidence.isClean).toBe(true);
    expect(evidence.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("rejects non-allowlisted worktree paths", () => {
    const repoDir = createTempGitRepo();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
    }).stdout.trim();

    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: ["/some/other/path"],
    });

    expect(() => manager.validateWorktreeAccess(repoDir, headSha)).toThrow(
      /not allowlisted/,
    );
  });

  it("refuses to work on main/master or PR #7 branch", () => {
    const repoDir = createTempGitRepo();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
    }).stdout.trim();

    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repoDir],
    });

    spawnSync("git", ["checkout", "-b", "main"], { cwd: repoDir });
    expect(() => manager.validateWorktreeAccess(repoDir, headSha)).toThrow(
      /main or master branch/,
    );

    spawnSync("git", ["checkout", "-b", "pr-7"], { cwd: repoDir });
    expect(() => manager.validateWorktreeAccess(repoDir, headSha)).toThrow(
      /PR #7 branch/,
    );
  });

  it("forbids destructive git operations (reset, clean, rebase, force push, delete)", () => {
    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [],
    });

    expect(() =>
      manager.assertNoDestructiveOperation("git reset --hard"),
    ).toThrow(/strictly forbidden/);
    expect(() => manager.assertNoDestructiveOperation("git clean -fd")).toThrow(
      /strictly forbidden/,
    );
    expect(() =>
      manager.assertNoDestructiveOperation("git rebase main"),
    ).toThrow(/strictly forbidden/);
    expect(() =>
      manager.assertNoDestructiveOperation("git push --force origin"),
    ).toThrow(/strictly forbidden/);

    expect(() => manager.reset()).toThrow(/strictly forbidden/);
    expect(() => manager.clean()).toThrow(/strictly forbidden/);
    expect(() => manager.rebase()).toThrow(/strictly forbidden/);
    expect(() => manager.forcePush()).toThrow(/strictly forbidden/);
    expect(() => manager.deleteWorktree()).toThrow(/strictly forbidden/);
    expect(() => manager.deleteBranch()).toThrow(/strictly forbidden/);
  });

  it("records evidence before and after action execution", () => {
    const repoDir = createTempGitRepo();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
    }).stdout.trim();

    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repoDir],
    });

    const rec = manager.recordEvidenceBeforeAndAfter(repoDir, headSha, () => {
      return "action-completed";
    });

    expect(rec.before.headSha).toBe(headSha);
    expect(rec.result).toBe("action-completed");
    expect(rec.after.headSha).toBe(headSha);
  });
});
