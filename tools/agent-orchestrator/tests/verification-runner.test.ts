import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  sanitizeVerificationOutput,
  VerificationRunner,
} from "../src/verification-runner.ts";
import { WorktreeManager } from "../src/worktree.ts";
import {
  createNodeToolIdentity,
  createRepositoryIdentity,
  createToolIdentity,
} from "../src/operational-trust.ts";
import { SqliteStateStore } from "../src/state-store.ts";
import type { TrustedExecutionContext } from "../src/trusted-process.ts";

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

function createTestContext(
  repoRoot: string,
  options?: {
    worktree?: string;
    main?: string;
    headSha?: string;
  },
): TrustedExecutionContext {
  const dbDir = realpathSync(mkdtempSync(join(tmpdir(), "anklo-runner-db-")));
  temporaryDirectories.push(dbDir);
  const store = SqliteStateStore.open(join(dbDir, "store.db"));
  const now = new Date("2026-07-27T00:00:00.000Z");
  const runId = "run-runner-test";
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
    ? realpathSync(options.worktree)
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
    branch: "feat/docs",
    headSha: options?.headSha ?? "2".repeat(40),
    baseSha: options?.headSha ?? "2".repeat(40),
    worktreeId: "worktree-runner",
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
    const context = createTestContext(repo.root, {
      worktree: repo.worktree,
      main: repo.main,
      headSha: repo.head,
    });
    const result = await new VerificationRunner(manager).runProfile(
      context,
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
