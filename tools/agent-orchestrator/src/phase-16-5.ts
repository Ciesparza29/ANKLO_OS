import { createHash } from "node:crypto";
import {
  type CodexReviewExecution,
  type CodexReadOnlyAdapter,
} from "./codex-adapter.ts";
import {
  type GitHubIssue,
  type GitHubReadOnlyAdapter,
} from "./github-adapter.ts";
import { OrchestratorError, normalizeError } from "./errors.ts";
import {
  type AuditEventRecord,
  type RunRecord,
  type StateStore,
} from "./state-store.ts";
import {
  type ProfileExecutionResult,
  type VerificationProfileName,
  type VerificationRunner,
} from "./verification-runner.ts";
import {
  persistWorkPackage,
  validateWorkPackage,
  type RunSnapshotInput,
  type WorkPackage,
} from "./work-package.ts";
import {
  type CreateWorktreeInput,
  type GitEvidence,
  type WorktreeManager,
} from "./worktree.ts";

export interface Phase165Dependencies {
  readonly stateStore: StateStore;
  readonly worktreeManager: WorktreeManager;
  readonly verificationRunner: VerificationRunner;
  readonly githubAdapter: GitHubReadOnlyAdapter;
  readonly codexAdapter: CodexReadOnlyAdapter;
}

function fail(code: string, message: string): never {
  throw new OrchestratorError(code, message);
}

function packageSnapshot(pkg: WorkPackage): RunSnapshotInput {
  return {
    repository: pkg.repository,
    issueNumber: pkg.issueNumber,
    runId: pkg.runId,
    idempotencyKey: pkg.idempotencyKey,
    sourceSnapshotHash: pkg.sourceSnapshotHash,
    issueBodyHash: pkg.issueBodyHash,
    planHash: pkg.planHash,
    baseSha: pkg.baseSha,
    targetBranch: pkg.targetBranch,
    targetHeadSha: pkg.targetHeadSha,
    targetWorktreeId: pkg.targetWorktreeId,
    worktreePath: pkg.worktreePath,
    authorizedFilesHash: pkg.authorizedFilesHash,
  };
}

function requireRun(
  stateStore: StateStore,
  runId: string,
  states: readonly RunRecord["state"][],
): RunRecord {
  const run = stateStore.getRun(runId);
  if (!run) fail("RUN_NOT_FOUND", `Run ${runId} was not found`);
  if (!states.includes(run.state)) {
    fail(
      "PHASE_16_5_STATE_MISMATCH",
      `Run ${runId} is not in an allowed phase 16.5 state`,
    );
  }
  return run;
}

function requirePackageRunBinding(run: RunRecord, pkg: WorkPackage): void {
  if (
    run.runId !== pkg.runId ||
    run.repository !== pkg.repository ||
    run.issueNumber !== pkg.issueNumber ||
    run.idempotencyKey !== pkg.idempotencyKey ||
    run.baseSha !== pkg.baseSha ||
    run.planHash !== pkg.planHash ||
    run.sourceSnapshotHash !== pkg.sourceSnapshotHash
  ) {
    fail(
      "WORK_PACKAGE_RUN_MISMATCH",
      "Work package does not match the immutable StateStore run",
    );
  }
}

function errorCode(error: unknown): string {
  return normalizeError(error).code;
}

export class Phase165Service {
  readonly #stateStore: StateStore;
  readonly #worktreeManager: WorktreeManager;
  readonly #verificationRunner: VerificationRunner;
  readonly #githubAdapter: GitHubReadOnlyAdapter;
  readonly #codexAdapter: CodexReadOnlyAdapter;

  constructor(dependencies: Phase165Dependencies) {
    this.#stateStore = dependencies.stateStore;
    this.#worktreeManager = dependencies.worktreeManager;
    this.#verificationRunner = dependencies.verificationRunner;
    this.#githubAdapter = dependencies.githubAdapter;
    this.#codexAdapter = dependencies.codexAdapter;
  }

  createImplementationWorktree(
    runId: string,
    input: CreateWorktreeInput,
    correlationId: string,
    now: Date,
  ): GitEvidence {
    const run = requireRun(this.#stateStore, runId, ["PLAN_APPROVED"]);
    if (run.baseSha !== input.baseSha) {
      fail(
        "WORKTREE_RUN_MISMATCH",
        "Worktree base does not match the StateStore run",
      );
    }
    const evidence = this.#worktreeManager.createWorktree(input);
    this.#stateStore.recordPhase165Event({
      runId,
      eventType: "WORKTREE_CREATED",
      correlationId,
      evidenceRef: `git:${evidence.headSha}`,
      result: "OK",
      payload: {
        branch: evidence.branch,
        head_sha: evidence.headSha,
        registered_worktree: evidence.registeredWorktree,
      },
      now,
    });
    return evidence;
  }

  bindAndPersistWorkPackage(input: {
    workPackage: WorkPackage & { readonly packageHash: string };
    runtimeDirectory: string;
    correlationId: string;
    now: Date;
  }): { packagePath: string; run: RunRecord } {
    const run = requireRun(this.#stateStore, input.workPackage.runId, [
      "PLAN_APPROVED",
    ]);
    requirePackageRunBinding(run, input.workPackage);
    validateWorkPackage(input.workPackage, packageSnapshot(input.workPackage));
    this.#stateStore.assertPlanApprovalBinding({
      runId: input.workPackage.runId,
      binding: input.workPackage.planApprovalBinding,
      now: input.now,
    });
    const worktreeEvidence = this.#worktreeManager.validateWorktreeAccess(
      input.workPackage.worktreePath,
      input.workPackage.targetHeadSha,
    );
    if (
      worktreeEvidence.branch !== input.workPackage.targetBranch ||
      worktreeEvidence.repository !== input.workPackage.repository
    ) {
      fail(
        "WORK_PACKAGE_WORKTREE_MISMATCH",
        "Work package target does not match the validated worktree",
      );
    }
    const packagePath = persistWorkPackage({
      workPackage: input.workPackage,
      runtimeDirectory: input.runtimeDirectory,
      repositoryRoot: input.workPackage.worktreePath,
      worktreePath: input.workPackage.worktreePath,
    });
    const bound = this.#stateStore.bindImplementationTarget({
      runId: input.workPackage.runId,
      targetRepository: input.workPackage.repository,
      targetRemote: "origin",
      targetBranch: input.workPackage.targetBranch,
      targetHeadSha: input.workPackage.targetHeadSha,
      worktreeId: input.workPackage.targetWorktreeId,
      authorizedFilesHash: input.workPackage.authorizedFilesHash,
      packageHash: input.workPackage.packageHash,
      correlationId: input.correlationId,
      now: input.now,
    });
    this.#stateStore.recordPhase165Event({
      runId: input.workPackage.runId,
      eventType: "WORK_PACKAGE_PERSISTED",
      correlationId: input.correlationId,
      evidenceRef: `sha256:${input.workPackage.packageHash}`,
      result: "OK",
      payload: {
        package_hash: input.workPackage.packageHash,
        authorized_files_hash: input.workPackage.authorizedFilesHash,
        target_branch: input.workPackage.targetBranch,
        target_head_sha: input.workPackage.targetHeadSha,
        worktree_id: input.workPackage.targetWorktreeId,
      },
      now: input.now,
    });
    return { packagePath, run: bound };
  }

  async runVerification(input: {
    workPackage: WorkPackage & { readonly packageHash: string };
    profile: VerificationProfileName;
    holderPid: number;
    correlationId: string;
    now: Date;
  }): Promise<ProfileExecutionResult> {
    const run = requireRun(this.#stateStore, input.workPackage.runId, [
      "RUNNING_IMPLEMENTATION",
    ]);
    requirePackageRunBinding(run, input.workPackage);
    if (
      run.packageHash !== input.workPackage.packageHash ||
      run.worktreeId !== input.workPackage.targetWorktreeId ||
      run.targetHeadSha !== input.workPackage.targetHeadSha ||
      !input.workPackage.fixedProfiles.includes(input.profile)
    ) {
      fail(
        "VERIFICATION_RUN_MISMATCH",
        "Verification is not bound to the approved package and worktree",
      );
    }
    this.#stateStore.assertActiveDispatchLeases({
      runId: run.runId,
      issueNumber: run.issueNumber,
      worktreeId: input.workPackage.targetWorktreeId,
      holderPid: input.holderPid,
      now: input.now,
    });
    try {
      const result = await this.#verificationRunner.runProfile(
        input.profile,
        input.workPackage.worktreePath,
        input.workPackage.targetHeadSha,
      );
      this.#stateStore.recordPhase165Event({
        runId: run.runId,
        eventType: "VERIFICATION_COMPLETED",
        correlationId: input.correlationId,
        evidenceRef: `sha256:${input.workPackage.packageHash}`,
        result: result.success ? "OK" : "DENIED",
        payload: {
          profile: input.profile,
          success: result.success,
          command_count: result.results.length,
          retries: result.retries,
          tool_versions: result.toolVersions,
        },
        now: input.now,
      });
      return result;
    } catch (error) {
      this.#stateStore.recordPhase165Event({
        runId: run.runId,
        eventType: "VERIFICATION_COMPLETED",
        correlationId: input.correlationId,
        evidenceRef: `sha256:${input.workPackage.packageHash}`,
        result: "ERROR",
        payload: { profile: input.profile, error_code: errorCode(error) },
        now: input.now,
      });
      throw error;
    }
  }

  readIssue(input: {
    runId: string;
    issueNumber: number;
    correlationId: string;
    now: Date;
  }): GitHubIssue {
    const run = requireRun(this.#stateStore, input.runId, [
      "DRAFT",
      "NEEDS_DECISION",
      "PLAN_READY",
      "PLAN_APPROVED",
    ]);
    if (run.issueNumber !== input.issueNumber) {
      fail("GITHUB_RUN_MISMATCH", "Issue does not match the StateStore run");
    }
    const issue = this.#githubAdapter.getIssue(input.issueNumber);
    const bodyHash = createHash("sha256")
      .update(issue.body, "utf8")
      .digest("hex");
    this.#stateStore.recordPhase165Event({
      runId: input.runId,
      eventType: "GITHUB_READ_COMPLETED",
      correlationId: input.correlationId,
      evidenceRef: `sha256:${bodyHash}`,
      result: "OK",
      payload: {
        issue_number: issue.number,
        issue_body_hash: bodyHash,
        state: issue.state,
      },
      now: input.now,
    });
    return issue;
  }

  async runCodexReview(input: {
    workPackage: WorkPackage & { readonly packageHash: string };
    prompt: string;
    correlationId: string;
    now: Date;
  }): Promise<CodexReviewExecution> {
    const run = requireRun(this.#stateStore, input.workPackage.runId, [
      "RUNNING_REVIEW",
    ]);
    requirePackageRunBinding(run, input.workPackage);
    if (
      run.packageHash !== input.workPackage.packageHash ||
      run.worktreeId !== input.workPackage.targetWorktreeId ||
      run.targetHeadSha !== input.workPackage.targetHeadSha
    ) {
      fail(
        "CODEX_RUN_MISMATCH",
        "Codex review is not bound to the approved package and worktree",
      );
    }
    try {
      const execution = await this.#codexAdapter.reviewWorktree(
        input.workPackage.worktreePath,
        input.workPackage.targetHeadSha,
        input.prompt,
      );
      const summaryHash = createHash("sha256")
        .update(execution.result.summary, "utf8")
        .digest("hex");
      this.#stateStore.recordPhase165Event({
        runId: run.runId,
        eventType: "CODEX_REVIEW_COMPLETED",
        correlationId: input.correlationId,
        evidenceRef: `sha256:${input.workPackage.packageHash}`,
        result: execution.result.decision === "APPROVE" ? "OK" : "DENIED",
        payload: {
          decision: execution.result.decision,
          summary_hash: summaryHash,
          findings_count: execution.result.findings.length,
          reviewed_head_sha: input.workPackage.targetHeadSha,
        },
        now: input.now,
      });
      return execution;
    } catch (error) {
      this.#stateStore.recordPhase165Event({
        runId: run.runId,
        eventType: "CODEX_REVIEW_COMPLETED",
        correlationId: input.correlationId,
        evidenceRef: `sha256:${input.workPackage.packageHash}`,
        result: "ERROR",
        payload: { error_code: errorCode(error) },
        now: input.now,
      });
      throw error;
    }
  }

  auditEvents(runId: string): readonly AuditEventRecord[] {
    return this.#stateStore.listAuditEvents(runId);
  }
}
