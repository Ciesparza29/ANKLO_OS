import {
  existsSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { WorktreeManager } from "../src/worktree.ts";
import {
  createNodeToolIdentity,
  createRepositoryIdentity,
  createToolIdentity,
} from "../src/operational-trust.ts";
import { SqliteStateStore } from "../src/state-store.ts";
import type { TrustedExecutionContext } from "../src/trusted-process.ts";

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

function createTestContext(
  repoRoot: string,
  options?: {
    worktree?: string;
    main?: string;
    headSha?: string;
    branch?: string;
  },
): TrustedExecutionContext {
  const dbDir = realpathSync(mkdtempSync(join(tmpdir(), "anklo-wt-db-")));
  temporaryDirectories.push(dbDir);
  const store = SqliteStateStore.open(join(dbDir, "store.db"));
  const now = new Date("2026-07-27T00:00:00.000Z");
  const runId = "run-wt-test";
  store.createRun({
    runId,
    repository: "Ciesparza29/ANKLO_OS",
    issueNumber: 24,
    idempotencyKey: "0".repeat(64),
    baseSha: "2".repeat(40),
    planHash: "3".repeat(64),
    sourceSnapshotHash: "4".repeat(64),
    now,
  });

  const gitBin = spawnSync("which", ["git"], {
    encoding: "utf8",
  }).stdout.trim();
  const tools = [
    createNodeToolIdentity(),
    createToolIdentity("git", gitBin, "1.0.0"),
  ];

  const worktreePath = options?.worktree
    ? existsSync(options.worktree)
      ? realpathSync(options.worktree)
      : resolve(options.worktree)
    : realpathSync(repoRoot);
  const mainPath = options?.main
    ? realpathSync(options.main)
    : realpathSync(repoRoot);

  let gitDir = realpathSync(repoRoot);
  let commonGitDir = realpathSync(repoRoot);
  if (options?.worktree && existsSync(options.worktree)) {
    const gd = git(options.worktree, ["rev-parse", "--git-dir"]);
    gitDir = realpathSync(resolve(options.worktree, gd));
    const cgd = git(options.worktree, ["rev-parse", "--git-common-dir"]);
    commonGitDir = realpathSync(resolve(options.worktree, cgd));
  }

  const repIdentity = createRepositoryIdentity({
    repositorySlug: "Ciesparza29/ANKLO_OS",
    host: "github.com",
    normalizedOrigin: "github.com/Ciesparza29/ANKLO_OS",
    repositoryRealpath: realpathSync(repoRoot),
    worktreeRealpath: worktreePath,
    mainCloneRealpath: mainPath,
    gitDir,
    commonGitDir,
    worktreeRegistrationHash: "1".repeat(64),
    branch: options?.branch ?? "feat/test-branch",
    headSha: options?.headSha ?? "2".repeat(40),
    baseSha: options?.headSha ?? "2".repeat(40),
    worktreeId: "worktree-test",
    issueNumber: 24,
    protectedPaths: [mainPath],
    remoteIdentity: "origin:github.com/Ciesparza29/ANKLO_OS",
  });

  store.bindRunTrust({
    runId,
    trustManifestHash: "1".repeat(64),
    repositoryIdentityHash: repIdentity.repositoryIdentityHash,
    repositoryIdentity: repIdentity,
    toolIdentities: tools,
    lockfileHash: "4".repeat(64),
    workspaceManifestHash: "5".repeat(64),
    analyzerVersion: "1.0.0",
    remoteIdentity: "origin:github.com/Ciesparza29/ANKLO_OS",
    commonGitDirIdentity: "6".repeat(64),
    correlationId: runId,
    now,
  });

  return { runId, stateStore: store };
}

describe("safe worktree manager", () => {
  it("requires an allowlisted registered worktree at the exact base SHA", () => {
    const repo = createRepository();
    const context = createTestContext(repo.root, {
      worktree: repo.worktree,
      main: repo.main,
      headSha: repo.head,
    });
    const evidence = managerFor(repo).validateWorktreeAccess(
      context,
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
    const context = createTestContext(repo.root, {
      worktree: repo.worktree,
      main: repo.main,
      headSha: repo.head,
    });
    writeFileSync(join(repo.worktree, "next.txt"), "next\n", "utf8");
    git(repo.worktree, ["add", "next.txt"]);
    git(repo.worktree, ["commit", "-m", "next"]);
    expect(() =>
      manager.validateWorktreeAccess(context, repo.worktree, repo.head),
    ).toThrow(/exact base SHA/u);

    const nextHead = git(repo.worktree, ["rev-parse", "HEAD"]);
    writeFileSync(join(repo.worktree, "dirty.txt"), "dirty\n", "utf8");
    expect(() =>
      manager.validateWorktreeAccess(context, repo.worktree, nextHead),
    ).toThrow(/must be clean/u);
    rmSync(join(repo.worktree, "dirty.txt"));
    git(repo.worktree, ["checkout", "--detach"]);
    expect(() =>
      manager.validateWorktreeAccess(context, repo.worktree, nextHead),
    ).toThrow(/Detached HEAD/u);

    const mainManager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repo.main],
      allowedParentDirectories: [repo.root],
    });
    expect(() =>
      mainManager.validateWorktreeAccess(context, repo.main, repo.head),
    ).toThrow(/primary clone/u);
  });

  it("rejects repository and parent mismatches", () => {
    const repo = createRepository();
    const context = createTestContext(repo.root, {
      worktree: repo.worktree,
      main: repo.main,
      headSha: repo.head,
    });
    const wrongRepository = new WorktreeManager({
      allowlistedRepository: "other/repository",
      allowlistedWorktrees: [repo.worktree],
      allowedParentDirectories: [repo.root],
    });
    expect(() =>
      wrongRepository.validateWorktreeAccess(context, repo.worktree, repo.head),
    ).toThrow(/not allowlisted/u);

    const wrongParent = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repo.worktree],
      allowedParentDirectories: [join(repo.root, "elsewhere")],
    });
    expect(() =>
      wrongParent.validateWorktreeAccess(context, repo.worktree, repo.head),
    ).toThrow(/parent directory/u);
  });

  it("compares all before/after Git evidence", () => {
    const repo = createRepository();
    const manager = managerFor(repo);
    const context = createTestContext(repo.root, {
      worktree: repo.worktree,
      main: repo.main,
      headSha: repo.head,
    });
    const record = manager.recordEvidenceBeforeAndAfter(
      context,
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
    const context = createTestContext(repo.root, {
      worktree: second,
      main: repo.main,
      headSha: repo.head,
      branch: "feat/second",
    });
    const evidence = manager.createWorktree(context, {
      sourceRepositoryPath: repo.main,
      targetPath: second,
      targetBranch: "feat/second",
      baseSha: repo.head,
    });
    expect(evidence.branch).toBe("feat/second");
    expect(evidence.headSha).toBe(repo.head);
  });
});
