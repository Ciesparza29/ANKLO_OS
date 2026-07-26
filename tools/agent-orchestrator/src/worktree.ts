import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { GIT_SHA_PATTERN } from "./contracts.ts";
import { OrchestratorError } from "./errors.ts";

const GIT_EXECUTABLE = "git";
const GIT_TIMEOUT_MS = 30_000;
const GIT_MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const PROTECTED_BRANCHES = new Set([
  "main",
  "master",
  "pr-7",
  "pr/7",
  "pull/7",
  "feat/issue-24-agent-orchestrator",
]);

export interface WorktreeConfig {
  readonly allowlistedRepository: string;
  readonly allowlistedWorktrees: readonly string[];
  readonly allowedParentDirectories?: readonly string[];
  readonly protectedWorktreePaths?: readonly string[];
  readonly protectedBranches?: readonly string[];
}

export interface GitEvidence {
  readonly headSha: string;
  readonly branch: string;
  readonly isClean: boolean;
  readonly statusPorcelain: string;
  readonly indexHash: string;
  readonly trackedDiffHash: string;
  readonly untrackedFilesHash: string;
  readonly registeredWorktree: boolean;
  readonly repository: string;
  readonly worktreePath: string;
  readonly commonGitDirectory: string;
  readonly timestamp: string;
}

export interface CreateWorktreeInput {
  readonly sourceRepositoryPath: string;
  readonly targetPath: string;
  readonly targetBranch: string;
  readonly baseSha: string;
}

function fail(code: string, message: string): never {
  throw new OrchestratorError(code, message);
}

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function isWithin(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

function safeGitEnvironment(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    HOME: "/nonexistent",
    XDG_CONFIG_HOME: "/nonexistent",
    LANG: "C",
    LC_ALL: "C",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
  };
}

function normalizeRepositoryUrl(url: string): string {
  const trimmed = url.trim().replace(/\.git$/u, "");
  const ssh = /^git@github\.com:(?<repo>[^/]+\/[^/]+)$/u.exec(trimmed);
  if (ssh?.groups?.repo) return ssh.groups.repo;
  const https = /^https:\/\/github\.com\/(?<repo>[^/]+\/[^/]+)$/u.exec(trimmed);
  if (https?.groups?.repo) return https.groups.repo;
  return trimmed;
}

function parseRegisteredWorktrees(output: string): readonly {
  path: string;
  branch: string | null;
}[] {
  const records: { path: string; branch: string | null }[] = [];
  for (const block of output.trim().split(/\n\n+/u)) {
    if (!block) continue;
    let path: string | undefined;
    let branch: string | null = null;
    for (const line of block.split("\n")) {
      if (line.startsWith("worktree ")) path = line.slice("worktree ".length);
      if (line.startsWith("branch refs/heads/")) {
        branch = line.slice("branch refs/heads/".length);
      }
    }
    if (path) records.push({ path: resolve(path), branch });
  }
  return records;
}

export class WorktreeManager {
  readonly #config: WorktreeConfig;
  readonly #protectedBranches: ReadonlySet<string>;

  constructor(config: WorktreeConfig) {
    if (
      !config.allowlistedRepository ||
      config.allowlistedWorktrees.length === 0
    ) {
      fail(
        "INVALID_WORKTREE_CONFIG",
        "Repository and at least one worktree must be allowlisted",
      );
    }
    this.#config = Object.freeze({
      ...config,
      allowlistedWorktrees: Object.freeze([...config.allowlistedWorktrees]),
      allowedParentDirectories: Object.freeze([
        ...(config.allowedParentDirectories ??
          config.allowlistedWorktrees.map((path) => dirname(resolve(path)))),
      ]),
      protectedWorktreePaths: Object.freeze([
        ...(config.protectedWorktreePaths ?? []),
      ]),
      protectedBranches: Object.freeze([...(config.protectedBranches ?? [])]),
    });
    this.#protectedBranches = new Set([
      ...PROTECTED_BRANCHES,
      ...(config.protectedBranches ?? []),
    ]);
  }

  #runGit(cwd: string, args: readonly string[]): string {
    const result = spawnSync(
      GIT_EXECUTABLE,
      ["-c", "core.hooksPath=/dev/null", ...args],
      {
        cwd,
        encoding: "utf8",
        env: safeGitEnvironment(),
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: GIT_MAX_OUTPUT_BYTES,
        shell: false,
        windowsHide: true,
      },
    );
    if (result.error) {
      fail(
        "GIT_COMMAND_FAILED",
        `Git command could not complete: ${result.error.message}`,
      );
    }
    if (result.status !== 0) {
      fail(
        "GIT_COMMAND_FAILED",
        `Git ${args[0] ?? "command"} failed with exit code ${String(result.status)}`,
      );
    }
    return result.stdout;
  }

  #resolveExistingPath(pathInput: string): string {
    if (!existsSync(pathInput)) {
      fail("UNAUTHORIZED_WORKTREE", `Path does not exist: ${pathInput}`);
    }
    try {
      return realpathSync(pathInput);
    } catch {
      fail("UNAUTHORIZED_WORKTREE", `Path cannot be resolved: ${pathInput}`);
    }
  }

  #registeredWorktrees(repositoryPath: string): readonly {
    path: string;
    branch: string | null;
  }[] {
    return parseRegisteredWorktrees(
      this.#runGit(repositoryPath, ["worktree", "list", "--porcelain"]),
    );
  }

  #assertRepositoryIdentity(worktreePath: string): {
    repository: string;
    commonGitDirectory: string;
    registered: readonly { path: string; branch: string | null }[];
  } {
    const topLevel = this.#resolveExistingPath(
      this.#runGit(worktreePath, ["rev-parse", "--show-toplevel"]).trim(),
    );
    if (topLevel !== worktreePath) {
      fail(
        "UNAUTHORIZED_REPOSITORY",
        "Worktree path is not the exact repository top level",
      );
    }
    const remote = normalizeRepositoryUrl(
      this.#runGit(worktreePath, ["remote", "get-url", "origin"]),
    );
    if (remote !== this.#config.allowlistedRepository) {
      fail(
        "UNAUTHORIZED_REPOSITORY",
        `Repository ${remote} is not allowlisted`,
      );
    }
    const commonRaw = this.#runGit(worktreePath, [
      "rev-parse",
      "--git-common-dir",
    ]).trim();
    const commonGitDirectory = this.#resolveExistingPath(
      isAbsolute(commonRaw) ? commonRaw : resolve(worktreePath, commonRaw),
    );
    const registered = this.#registeredWorktrees(worktreePath);
    const first = registered[0];
    if (first && this.#resolveExistingPath(first.path) === worktreePath) {
      fail(
        "WORKTREE_REFUSE_MAIN_CLONE",
        "The primary clone cannot be used as an implementation target",
      );
    }
    return {
      repository: remote,
      commonGitDirectory,
      registered,
    };
  }

  #assertProtectedTarget(path: string, branch: string): void {
    if (
      this.#protectedBranches.has(branch) ||
      /^(?:pr[-/]?7|pull\/7)(?:$|[-/])/u.test(branch)
    ) {
      fail(
        "WORKTREE_PROTECTED_BRANCH",
        `Protected branch cannot be used as an implementation target: ${branch}`,
      );
    }
    for (const protectedPath of this.#config.protectedWorktreePaths ?? []) {
      if (existsSync(protectedPath) && realpathSync(protectedPath) === path) {
        fail(
          "WORKTREE_PROTECTED_PATH",
          "Protected worktree cannot be used as an implementation target",
        );
      }
    }
  }

  validateWorktreeAccess(
    worktreePath: string,
    expectedBaseSha: string,
  ): GitEvidence {
    if (!GIT_SHA_PATTERN.test(expectedBaseSha)) {
      fail(
        "INVALID_GIT_SHA",
        "Expected base SHA must be a lowercase 40-character SHA",
      );
    }
    const realPath = this.#resolveExistingPath(worktreePath);
    const isAllowlisted = this.#config.allowlistedWorktrees.some(
      (allowed) =>
        existsSync(allowed) && this.#resolveExistingPath(allowed) === realPath,
    );
    if (!isAllowlisted) {
      fail(
        "UNAUTHORIZED_WORKTREE",
        `Worktree path is not allowlisted: ${realPath}`,
      );
    }
    const allowedParent = (this.#config.allowedParentDirectories ?? []).some(
      (parent) => {
        const resolvedParent = existsSync(parent)
          ? this.#resolveExistingPath(parent)
          : resolve(parent);
        return (
          isWithin(resolvedParent, realPath) && resolvedParent !== realPath
        );
      },
    );
    if (!allowedParent) {
      fail(
        "UNAUTHORIZED_WORKTREE_PARENT",
        "Worktree parent directory is not allowlisted",
      );
    }

    const identity = this.#assertRepositoryIdentity(realPath);
    const registered = identity.registered.find(
      (entry) =>
        existsSync(entry.path) &&
        this.#resolveExistingPath(entry.path) === realPath,
    );
    if (!registered) {
      fail(
        "UNREGISTERED_WORKTREE",
        "Implementation target is not a registered Git worktree",
      );
    }
    const branch = this.#runGit(realPath, ["branch", "--show-current"]).trim();
    if (!branch) {
      fail("DETACHED_HEAD_DENIED", "Detached HEAD worktrees are forbidden");
    }
    this.#assertProtectedTarget(realPath, branch);
    if (registered.branch !== branch) {
      fail(
        "WORKTREE_REGISTRATION_MISMATCH",
        "Registered branch does not match the checked-out branch",
      );
    }
    const collidingBranch = identity.registered.filter(
      (entry) => entry.branch === branch,
    );
    if (collidingBranch.length !== 1) {
      fail(
        "WORKTREE_BRANCH_COLLISION",
        "Implementation branch is registered in more than one worktree",
      );
    }

    const headSha = this.#runGit(realPath, ["rev-parse", "HEAD"]).trim();
    if (headSha !== expectedBaseSha) {
      fail(
        "WORKTREE_BASE_SHA_MISMATCH",
        `Expected exact base SHA ${expectedBaseSha}, observed ${headSha}`,
      );
    }
    const statusPorcelain = this.#runGit(realPath, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
    ]).trim();
    if (statusPorcelain !== "") {
      fail("DIRTY_WORKTREE_DENIED", "Implementation worktree must be clean");
    }
    const index = this.#runGit(realPath, ["ls-files", "--stage"]);
    const trackedDiff = this.#runGit(realPath, ["diff", "--binary", "HEAD"]);
    const untracked = this.#runGit(realPath, [
      "ls-files",
      "--others",
      "--exclude-standard",
    ]);

    return Object.freeze({
      headSha,
      branch,
      isClean: true,
      statusPorcelain,
      indexHash: hash(index),
      trackedDiffHash: hash(trackedDiff),
      untrackedFilesHash: hash(untracked),
      registeredWorktree: true,
      repository: identity.repository,
      worktreePath: realPath,
      commonGitDirectory: identity.commonGitDirectory,
      timestamp: new Date().toISOString(),
    });
  }

  assertEvidenceUnchanged(before: GitEvidence, after: GitEvidence): void {
    const fields: readonly (keyof GitEvidence)[] = [
      "headSha",
      "branch",
      "isClean",
      "statusPorcelain",
      "indexHash",
      "trackedDiffHash",
      "untrackedFilesHash",
      "registeredWorktree",
      "repository",
      "worktreePath",
      "commonGitDirectory",
    ];
    if (fields.some((field) => before[field] !== after[field])) {
      fail(
        "WORKTREE_MUTATION_DETECTED",
        "Git worktree evidence changed during the guarded operation",
      );
    }
  }

  recordEvidenceBeforeAndAfter<T>(
    worktreePath: string,
    expectedBaseSha: string,
    action: () => T,
  ): { before: GitEvidence; result: T; after: GitEvidence } {
    const before = this.validateWorktreeAccess(worktreePath, expectedBaseSha);
    const result = action();
    const after = this.validateWorktreeAccess(worktreePath, expectedBaseSha);
    this.assertEvidenceUnchanged(before, after);
    return { before, result, after };
  }

  createWorktree(input: CreateWorktreeInput): GitEvidence {
    if (!GIT_SHA_PATTERN.test(input.baseSha)) {
      fail("INVALID_GIT_SHA", "baseSha must be an exact Git SHA");
    }
    const source = this.#resolveExistingPath(input.sourceRepositoryPath);
    const target = resolve(input.targetPath);
    const sourceTop = this.#resolveExistingPath(
      this.#runGit(source, ["rev-parse", "--show-toplevel"]).trim(),
    );
    if (sourceTop !== source) {
      fail("UNAUTHORIZED_REPOSITORY", "Source must be a repository root");
    }
    const remote = normalizeRepositoryUrl(
      this.#runGit(source, ["remote", "get-url", "origin"]),
    );
    if (remote !== this.#config.allowlistedRepository) {
      fail("UNAUTHORIZED_REPOSITORY", "Source repository is not allowlisted");
    }
    const sourceBranch = this.#runGit(source, [
      "branch",
      "--show-current",
    ]).trim();
    if (sourceBranch !== "main") {
      fail("WORKTREE_SOURCE_BRANCH_DENIED", "Source clone must be on main");
    }
    if (this.#runGit(source, ["rev-parse", "HEAD"]).trim() !== input.baseSha) {
      fail(
        "WORKTREE_BASE_SHA_MISMATCH",
        "Source clone is not at the exact authorized base SHA",
      );
    }
    if (
      this.#runGit(source, [
        "status",
        "--porcelain=v1",
        "--untracked-files=all",
      ]).trim() !== ""
    ) {
      fail("DIRTY_SOURCE_DENIED", "Source clone must be clean");
    }
    this.#assertProtectedTarget(target, input.targetBranch);
    if (existsSync(target)) {
      fail("WORKTREE_PATH_COLLISION", "Target worktree path already exists");
    }
    const parentAllowed = (this.#config.allowedParentDirectories ?? []).some(
      (parent) => isWithin(resolve(parent), target),
    );
    if (!parentAllowed) {
      fail(
        "UNAUTHORIZED_WORKTREE_PARENT",
        "Target parent directory is not allowlisted",
      );
    }
    const registered = this.#registeredWorktrees(source);
    if (
      registered.some(
        (entry) =>
          resolve(entry.path) === target || entry.branch === input.targetBranch,
      )
    ) {
      fail(
        "WORKTREE_COLLISION",
        "Target path or branch already has a registered worktree",
      );
    }
    const branchExists = spawnSync(
      GIT_EXECUTABLE,
      [
        "-c",
        "core.hooksPath=/dev/null",
        "show-ref",
        "--verify",
        "--quiet",
        `refs/heads/${input.targetBranch}`,
      ],
      {
        cwd: source,
        encoding: "utf8",
        env: safeGitEnvironment(),
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: GIT_MAX_OUTPUT_BYTES,
        shell: false,
        windowsHide: true,
      },
    );
    if (branchExists.error) {
      fail(
        "GIT_COMMAND_FAILED",
        `Branch collision check failed: ${branchExists.error.message}`,
      );
    }
    if (branchExists.status === 0) {
      fail("WORKTREE_BRANCH_COLLISION", "Target branch already exists");
    }
    if (branchExists.status !== 1) {
      fail(
        "GIT_COMMAND_FAILED",
        "Branch collision check returned an unexpected exit code",
      );
    }

    this.#runGit(source, [
      "worktree",
      "add",
      "-b",
      input.targetBranch,
      target,
      input.baseSha,
    ]);
    return this.validateWorktreeAccess(target, input.baseSha);
  }
}
