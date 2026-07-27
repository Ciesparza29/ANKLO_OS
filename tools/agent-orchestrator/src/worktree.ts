import { createHash } from "node:crypto";
import {
  executeGitBranchCheck,
  executeGitQuery,
  executeGitWorktreeCreate,
  resolveGitLocation,
  type TrustedExecutionContext,
} from "./trusted-process.ts";
import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { GIT_SHA_PATTERN } from "./contracts.ts";
import { OrchestratorError } from "./errors.ts";
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

  #registeredWorktrees(
    context: TrustedExecutionContext,
    repositoryPath: string,
  ): readonly {
    path: string;
    branch: string | null;
  }[] {
    const loc = resolveGitLocation(context, repositoryPath);
    return parseRegisteredWorktrees(
      executeGitQuery(context, loc, "worktree-list"),
    );
  }

  #assertRepositoryIdentity(
    context: TrustedExecutionContext,
    worktreePath: string,
  ): {
    repository: string;
    commonGitDirectory: string;
    registered: readonly { path: string; branch: string | null }[];
  } {
    const loc = resolveGitLocation(context, worktreePath);
    const topLevel = this.#resolveExistingPath(
      executeGitQuery(context, loc, "show-toplevel").trim(),
    );
    if (topLevel !== worktreePath) {
      fail(
        "UNAUTHORIZED_REPOSITORY",
        "Worktree path is not the exact repository top level",
      );
    }
    const remote = normalizeRepositoryUrl(
      executeGitQuery(context, loc, "get-remote-origin").trim(),
    );
    if (remote !== this.#config.allowlistedRepository) {
      fail(
        "UNAUTHORIZED_REPOSITORY",
        `Repository ${remote} is not allowlisted`,
      );
    }
    const commonRaw = executeGitQuery(context, loc, "git-common-dir").trim();
    const commonGitDirectory = this.#resolveExistingPath(
      isAbsolute(commonRaw) ? commonRaw : resolve(worktreePath, commonRaw),
    );
    const registered = this.#registeredWorktrees(context, worktreePath);
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
    context: TrustedExecutionContext,
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

    const identity = this.#assertRepositoryIdentity(context, realPath);
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
    const loc = resolveGitLocation(context, realPath);
    const branch = executeGitQuery(context, loc, "show-current-branch").trim();
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

    const headSha = executeGitQuery(context, loc, "rev-parse-head").trim();
    if (headSha !== expectedBaseSha) {
      fail(
        "WORKTREE_BASE_SHA_MISMATCH",
        `Expected exact base SHA ${expectedBaseSha}, observed ${headSha}`,
      );
    }
    const statusPorcelain = executeGitQuery(
      context,
      loc,
      "status-porcelain",
    ).trim();
    if (statusPorcelain !== "") {
      fail("DIRTY_WORKTREE_DENIED", "Implementation worktree must be clean");
    }
    const index = executeGitQuery(context, loc, "ls-files-stage");
    const trackedDiff = executeGitQuery(context, loc, "diff-binary-head");
    const untracked = executeGitQuery(context, loc, "ls-files-others");

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
    context: TrustedExecutionContext,
    worktreePath: string,
    expectedBaseSha: string,
    action: () => T,
  ): { before: GitEvidence; result: T; after: GitEvidence } {
    const before = this.validateWorktreeAccess(
      context,
      worktreePath,
      expectedBaseSha,
    );
    const result = action();
    const after = this.validateWorktreeAccess(
      context,
      worktreePath,
      expectedBaseSha,
    );
    this.assertEvidenceUnchanged(before, after);
    return { before, result, after };
  }

  createWorktree(
    context: TrustedExecutionContext,
    input: CreateWorktreeInput,
  ): GitEvidence {
    if (!GIT_SHA_PATTERN.test(input.baseSha)) {
      fail("INVALID_GIT_SHA", "baseSha must be an exact Git SHA");
    }
    const source = this.#resolveExistingPath(input.sourceRepositoryPath);
    const target = resolve(input.targetPath);
    const sourceLoc = resolveGitLocation(context, source);
    const sourceTop = this.#resolveExistingPath(
      executeGitQuery(context, sourceLoc, "show-toplevel").trim(),
    );
    if (sourceTop !== source) {
      fail("UNAUTHORIZED_REPOSITORY", "Source must be a repository root");
    }
    const remote = normalizeRepositoryUrl(
      executeGitQuery(context, sourceLoc, "get-remote-origin").trim(),
    );
    if (remote !== this.#config.allowlistedRepository) {
      fail("UNAUTHORIZED_REPOSITORY", "Source repository is not allowlisted");
    }
    const sourceBranch = executeGitQuery(
      context,
      sourceLoc,
      "show-current-branch",
    ).trim();
    if (sourceBranch !== "main") {
      fail("WORKTREE_SOURCE_BRANCH_DENIED", "Source clone must be on main");
    }
    if (
      executeGitQuery(context, sourceLoc, "rev-parse-head").trim() !==
      input.baseSha
    ) {
      fail(
        "WORKTREE_BASE_SHA_MISMATCH",
        "Source clone is not at the exact authorized base SHA",
      );
    }
    if (executeGitQuery(context, sourceLoc, "status-porcelain").trim() !== "") {
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
    const registered = this.#registeredWorktrees(context, source);
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
    const branchExists = executeGitBranchCheck(
      context,
      sourceLoc,
      input.targetBranch,
    );
    if (branchExists.error) {
      fail(
        "GIT_COMMAND_FAILED",
        `Branch collision check failed: ${branchExists.error.message}`,
      );
    }
    if (branchExists.exists) {
      fail("WORKTREE_BRANCH_COLLISION", "Target branch already exists");
    }
    if (branchExists.status !== 1) {
      fail(
        "GIT_COMMAND_FAILED",
        "Branch collision check returned an unexpected exit code",
      );
    }

    executeGitWorktreeCreate(context, sourceLoc, {
      branch: input.targetBranch,
      destination: target,
      baseSha: input.baseSha,
    });
    return this.validateWorktreeAccess(context, target, input.baseSha);
  }
}
