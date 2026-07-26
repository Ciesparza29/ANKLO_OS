import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { WorktreeManager } from "../src/worktree.ts";

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

function createRepository(): {
  root: string;
  main: string;
  worktree: string;
  head: string;
} {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "anklo-wt-test-")));
  temporaryDirectories.push(root);
  const main = join(root, "main");
  const worktree = join(root, "implementation");
  spawnSync("mkdir", ["-p", main]);
  git(main, ["init", "-b", "main"]);
  git(main, ["config", "user.email", "test@anklo.local"]);
  git(main, ["config", "user.name", "Test User"]);
  git(main, [
    "remote",
    "add",
    "origin",
    "https://github.com/Ciesparza29/ANKLO_OS.git",
  ]);
  writeFileSync(join(main, "README.md"), "test\n", "utf8");
  git(main, ["add", "README.md"]);
  git(main, ["commit", "-m", "initial"]);
  const head = git(main, ["rev-parse", "HEAD"]);
  git(main, ["worktree", "add", "-b", "feat/test-branch", worktree, head]);
  return { root, main, worktree, head };
}

function managerFor(
  repo: ReturnType<typeof createRepository>,
): WorktreeManager {
  return new WorktreeManager({
    allowlistedRepository: "Ciesparza29/ANKLO_OS",
    allowlistedWorktrees: [repo.worktree],
    allowedParentDirectories: [repo.root],
    protectedWorktreePaths: [repo.main],
  });
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe("safe worktree manager", () => {
  it("requires an allowlisted registered worktree at the exact base SHA", () => {
    const repo = createRepository();
    const evidence = managerFor(repo).validateWorktreeAccess(
      repo.worktree,
      repo.head,
    );
    expect(evidence.headSha).toBe(repo.head);
    expect(evidence.branch).toBe("feat/test-branch");
    expect(evidence.registeredWorktree).toBe(true);
    expect(evidence.isClean).toBe(true);
  });

  it("rejects ancestry-only, dirty, detached and main-clone targets", () => {
    const repo = createRepository();
    const manager = managerFor(repo);
    writeFileSync(join(repo.worktree, "next.txt"), "next\n", "utf8");
    git(repo.worktree, ["add", "next.txt"]);
    git(repo.worktree, ["commit", "-m", "next"]);
    expect(() =>
      manager.validateWorktreeAccess(repo.worktree, repo.head),
    ).toThrow(/exact base SHA/u);

    const nextHead = git(repo.worktree, ["rev-parse", "HEAD"]);
    writeFileSync(join(repo.worktree, "dirty.txt"), "dirty\n", "utf8");
    expect(() =>
      manager.validateWorktreeAccess(repo.worktree, nextHead),
    ).toThrow(/must be clean/u);
    rmSync(join(repo.worktree, "dirty.txt"));
    git(repo.worktree, ["checkout", "--detach"]);
    expect(() =>
      manager.validateWorktreeAccess(repo.worktree, nextHead),
    ).toThrow(/Detached HEAD/u);

    const mainManager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repo.main],
      allowedParentDirectories: [repo.root],
    });
    expect(() =>
      mainManager.validateWorktreeAccess(repo.main, repo.head),
    ).toThrow(/primary clone/u);
  });

  it("rejects repository and parent mismatches", () => {
    const repo = createRepository();
    const wrongRepository = new WorktreeManager({
      allowlistedRepository: "other/repository",
      allowlistedWorktrees: [repo.worktree],
      allowedParentDirectories: [repo.root],
    });
    expect(() =>
      wrongRepository.validateWorktreeAccess(repo.worktree, repo.head),
    ).toThrow(/not allowlisted/u);

    const wrongParent = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repo.worktree],
      allowedParentDirectories: [join(repo.root, "elsewhere")],
    });
    expect(() =>
      wrongParent.validateWorktreeAccess(repo.worktree, repo.head),
    ).toThrow(/parent directory/u);
  });

  it("compares all before/after Git evidence", () => {
    const repo = createRepository();
    const manager = managerFor(repo);
    const record = manager.recordEvidenceBeforeAndAfter(
      repo.worktree,
      repo.head,
      () => "complete",
    );
    expect(record.result).toBe("complete");
    expect(() =>
      manager.assertEvidenceUnchanged(record.before, {
        ...record.after,
        branch: "feat/changed",
      }),
    ).toThrow(/evidence changed/u);
  });

  it("creates only a collision-free worktree from a clean exact main source", () => {
    const repo = createRepository();
    const second = join(repo.root, "second");
    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [second],
      allowedParentDirectories: [repo.root],
      protectedWorktreePaths: [repo.main, repo.worktree],
    });
    const evidence = manager.createWorktree({
      sourceRepositoryPath: repo.main,
      targetPath: second,
      targetBranch: "feat/second",
      baseSha: repo.head,
    });
    expect(evidence.branch).toBe("feat/second");
    expect(evidence.headSha).toBe(repo.head);
  });
});
