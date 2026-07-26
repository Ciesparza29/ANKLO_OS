import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { OrchestratorError } from "./errors.ts";

export interface WorktreeConfig {
  readonly allowlistedRepository: string;
  readonly allowlistedWorktrees: readonly string[];
  readonly refuseMain?: boolean;
  readonly refusePr7?: boolean;
}

export interface GitEvidence {
  readonly headSha: string;
  readonly branch: string;
  readonly isClean: boolean;
  readonly timestamp: string;
}

export class WorktreeManager {
  readonly #config: WorktreeConfig;

  constructor(config: WorktreeConfig) {
    this.#config = config;
  }

  /**
   * Executes a git command safely in a worktree without shell interpretation.
   */
  #runGit(worktreePath: string, args: readonly string[]): string {
    const res = spawnSync("git", args, { cwd: worktreePath, encoding: "utf8" });
    if (res.status !== 0) {
      throw new OrchestratorError(
        "GIT_COMMAND_FAILED",
        `git ${args[0]} failed: ${res.stderr || res.stdout}`,
      );
    }
    return res.stdout.trim();
  }

  /**
   * Enforces that destructive operations are never executed in the worktree.
   */
  assertNoDestructiveOperation(command: string): void {
    const forbidden = [
      "reset",
      "clean",
      "rebase",
      "push -f",
      "push --force",
      "worktree remove",
      "branch -D",
      "branch -d",
    ];
    for (const op of forbidden) {
      if (command.includes(op)) {
        throw new OrchestratorError(
          "DESTRUCTIVE_GIT_OPERATION_DENIED",
          `Destructive git operation (${op}) is strictly forbidden by ADR-0010`,
        );
      }
    }
  }

  /**
   * Validates access and captures git evidence for an allowlisted worktree.
   */
  validateWorktreeAccess(
    worktreePath: string,
    expectedBaseSha: string,
  ): GitEvidence {
    if (!existsSync(worktreePath)) {
      throw new OrchestratorError(
        "UNAUTHORIZED_WORKTREE",
        `Worktree path does not exist: ${worktreePath}`,
      );
    }

    let realPath: string;
    try {
      realPath = realpathSync(worktreePath);
    } catch {
      throw new OrchestratorError(
        "UNAUTHORIZED_WORKTREE",
        `Failed to resolve realpath for: ${worktreePath}`,
      );
    }

    const isAllowlisted = this.#config.allowlistedWorktrees.some((w) => {
      try {
        return realpathSync(w) === realPath;
      } catch {
        return w === realPath;
      }
    });

    if (!isAllowlisted) {
      throw new OrchestratorError(
        "UNAUTHORIZED_WORKTREE",
        `Worktree path is not allowlisted: ${realPath}`,
      );
    }

    const branch = this.#runGit(realPath, ["branch", "--show-current"]);
    if (
      this.#config.refuseMain !== false &&
      (branch === "main" || branch === "master")
    ) {
      throw new OrchestratorError(
        "WORKTREE_REFUSE_MAIN",
        "Working directly on main or master branch is strictly forbidden by ADR-0010",
      );
    }
    if (
      this.#config.refusePr7 !== false &&
      (branch === "pr-7" ||
        branch.includes("pr/7") ||
        branch === "feat/issue-24-agent-orchestrator")
    ) {
      throw new OrchestratorError(
        "WORKTREE_REFUSE_PR7",
        "Working on PR #7 branch is strictly forbidden by ADR-0010",
      );
    }

    const headSha = this.#runGit(realPath, ["rev-parse", "HEAD"]);
    if (expectedBaseSha !== headSha) {
      const isAncestor =
        spawnSync(
          "git",
          ["merge-base", "--is-ancestor", expectedBaseSha, "HEAD"],
          { cwd: realPath },
        ).status === 0;
      if (!isAncestor) {
        throw new OrchestratorError(
          "WORKTREE_BASE_SHA_MISMATCH",
          `Expected base SHA ${expectedBaseSha} is not an ancestor of HEAD ${headSha}`,
        );
      }
    }

    const statusOut = this.#runGit(realPath, ["status", "--porcelain=v1"]);
    const isClean = statusOut === "";

    return {
      headSha,
      branch,
      isClean,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Captures git evidence before and after executing an action in the worktree.
   */
  recordEvidenceBeforeAndAfter<T>(
    worktreePath: string,
    expectedBaseSha: string,
    action: () => T,
  ): { before: GitEvidence; result: T; after: GitEvidence } {
    const before = this.validateWorktreeAccess(worktreePath, expectedBaseSha);
    const result = action();
    const after = this.validateWorktreeAccess(worktreePath, expectedBaseSha);
    return { before, result, after };
  }

  // Prohibited methods explicitly defined to throw error if called
  reset(): never {
    throw new OrchestratorError(
      "DESTRUCTIVE_GIT_OPERATION_DENIED",
      "git reset is strictly forbidden",
    );
  }

  clean(): never {
    throw new OrchestratorError(
      "DESTRUCTIVE_GIT_OPERATION_DENIED",
      "git clean is strictly forbidden",
    );
  }

  rebase(): never {
    throw new OrchestratorError(
      "DESTRUCTIVE_GIT_OPERATION_DENIED",
      "git rebase is strictly forbidden",
    );
  }

  forcePush(): never {
    throw new OrchestratorError(
      "DESTRUCTIVE_GIT_OPERATION_DENIED",
      "git force push is strictly forbidden",
    );
  }

  deleteWorktree(): never {
    throw new OrchestratorError(
      "DESTRUCTIVE_GIT_OPERATION_DENIED",
      "deleting worktrees is strictly forbidden",
    );
  }

  deleteBranch(): never {
    throw new OrchestratorError(
      "DESTRUCTIVE_GIT_OPERATION_DENIED",
      "deleting branches is strictly forbidden",
    );
  }
}
