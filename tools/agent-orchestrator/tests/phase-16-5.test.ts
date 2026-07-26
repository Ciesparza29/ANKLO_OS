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
import type { ApprovalBody, ObservedApproval } from "../src/approvals.ts";
import { CodexReadOnlyAdapter } from "../src/codex-adapter.ts";
import { GitHubReadOnlyAdapter } from "../src/github-adapter.ts";
import { Phase165Service } from "../src/phase-16-5.ts";
import { SqliteStateStore } from "../src/state-store.ts";
import { VerificationRunner } from "../src/verification-runner.ts";
import {
  computeAuthorizedFilesHash,
  createWorkPackage,
} from "../src/work-package.ts";
import { WorktreeManager } from "../src/worktree.ts";

const projectRoot = realpathSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../.."),
);
const outputSchemaPath = join(
  projectRoot,
  "tools/agent-orchestrator/schemas/codex-review-result.schema.json",
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

function fixture(): {
  root: string;
  main: string;
  worktree: string;
  head: string;
} {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "anklo-phase165-test-")),
  );
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
  writeFileSync(join(main, "README.md"), "# Fixture\n", "utf8");
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
  git(main, ["add", "."]);
  git(main, ["commit", "-m", "fixture"]);
  const head = git(main, ["rev-parse", "HEAD"]);
  git(main, ["worktree", "add", "-b", "feat/phase165", worktree, head]);
  return { root, main, worktree, head };
}

function observed(body: ApprovalBody, commentId: number): ObservedApproval {
  return {
    body,
    approval_comment_id: commentId,
    approval_author_login: "Ciesparza29",
    approval_comment_created_at: "2026-07-26T13:00:00.000Z",
    approval_comment_updated_at: "2026-07-26T13:00:00.000Z",
  };
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe("phase 16.5 StateStore integration", () => {
  it("binds PLAN approval, package, state, leases, runner and audit", async () => {
    const repo = fixture();
    const ghConfig = join(repo.root, "gh-config");
    const codexHome = join(repo.root, "codex-home");
    mkdirSync(ghConfig);
    const manager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repo.worktree],
      allowedParentDirectories: [repo.root],
      protectedWorktreePaths: [repo.main],
    });
    const store = SqliteStateStore.open(":memory:");
    const now = new Date("2026-07-26T14:00:00.000Z");
    const runId = "run-phase-165";
    const idempotencyKey = "0".repeat(64);
    const planHash = "1".repeat(64);
    const sourceSnapshotHash = "2".repeat(64);
    store.createRun({
      runId,
      repository: "Ciesparza29/ANKLO_OS",
      issueNumber: 24,
      idempotencyKey,
      baseSha: repo.head,
      planHash,
      sourceSnapshotHash,
      now,
    });
    store.transitionRun({
      runId,
      to: "PLAN_READY",
      reason: "fixture ready",
      correlationId: runId,
      now,
    });
    const planBody = {
      schema_version: "1.0",
      approval_kind: "PLAN_APPROVED",
      repository: "Ciesparza29/ANKLO_OS",
      issue_number: 24,
      expires_at: "2099-12-31T23:59:59.000Z",
      approval_event_id: "00000000-0000-4000-8000-000000000101",
      nonce: "00000000-0000-4000-8000-000000000102",
      base_sha: repo.head,
      plan_hash: planHash,
      source_snapshot_hash: sourceSnapshotHash,
    } as ApprovalBody;
    store.recordApprovalEffect({
      observedApproval: observed(planBody, 101),
      effect: "PLAN_APPROVED",
      runId,
      observedAt: now,
    });
    store.transitionRun({
      runId,
      to: "PLAN_APPROVED",
      reason: "approved",
      correlationId: runId,
      now,
    });

    const authorizedFiles = ["README.md"] as const;
    const pkg = createWorkPackage({
      schemaVersion: "1.0",
      canonicalizationVersion: "1.0",
      repository: "Ciesparza29/ANKLO_OS",
      issueNumber: 24,
      runId,
      idempotencyKey,
      issueBodyHash: "3".repeat(64),
      sourceSnapshotHash,
      planHash,
      baseBranch: "main",
      baseSha: repo.head,
      targetBranch: "feat/phase165",
      targetHeadSha: repo.head,
      targetWorktreeId: "worktree-phase165",
      worktreePath: repo.worktree,
      authorizedFiles,
      prohibitedFiles: ["forbidden.txt"],
      authorizedFilesHash: computeAuthorizedFilesHash(authorizedFiles),
      fixedProfiles: ["docs-only"],
      requiredSkills: ["anklo-handoff"],
      acceptanceCriteria: ["verification passes"],
      planApprovalBinding: {
        approvalEventId: String(planBody.approval_event_id),
        approvalCommentId: 101,
        approvalAuthorLogin: "Ciesparza29",
        approvalCommentUpdatedAt: "2026-07-26T13:00:00.000Z",
        expiresAt: String(planBody.expires_at),
        baseSha: repo.head,
        planHash,
        sourceSnapshotHash,
      },
      createdAt: "2026-07-26T14:00:00.000Z",
    });
    const service = new Phase165Service({
      stateStore: store,
      worktreeManager: manager,
      verificationRunner: new VerificationRunner(manager),
      githubAdapter: new GitHubReadOnlyAdapter({
        repository: "Ciesparza29/ANKLO_OS",
        ghConfigDirectory: ghConfig,
      }),
      codexAdapter: new CodexReadOnlyAdapter(manager, {
        runtimeDirectory: codexHome,
        outputSchemaPath,
      }),
    });
    const bound = service.bindAndPersistWorkPackage({
      workPackage: pkg,
      runtimeDirectory: join(repo.root, "runtime"),
      correlationId: runId,
      now,
    });
    expect(bound.run.packageHash).toBe(pkg.packageHash);

    const implementBody = {
      schema_version: "1.0",
      approval_kind: "IMPLEMENT_APPROVED",
      repository: "Ciesparza29/ANKLO_OS",
      issue_number: 24,
      expires_at: "2099-12-31T23:59:59.000Z",
      approval_event_id: "00000000-0000-4000-8000-000000000103",
      nonce: "00000000-0000-4000-8000-000000000104",
      target_branch: pkg.targetBranch,
      target_worktree_id: pkg.targetWorktreeId,
      target_head_sha: pkg.targetHeadSha,
      authorized_files_hash: pkg.authorizedFilesHash,
      package_hash: pkg.packageHash,
    } as ApprovalBody;
    store.recordApprovalEffect({
      observedApproval: observed(implementBody, 102),
      effect: "IMPLEMENT_APPROVED",
      runId,
      observedAt: now,
    });
    store.transitionRun({
      runId,
      to: "READY_TO_DISPATCH",
      reason: "package bound",
      correlationId: runId,
      now,
    });
    store.acquireDispatchLeases({
      runId,
      issueNumber: 24,
      worktreeId: pkg.targetWorktreeId,
      holderPid: process.pid,
      ttlMs: 60_000,
      now,
    });
    store.transitionRun({
      runId,
      to: "RUNNING_IMPLEMENTATION",
      reason: "implementation approved",
      correlationId: runId,
      now,
    });
    const verification = await service.runVerification({
      workPackage: pkg,
      profile: "docs-only",
      holderPid: process.pid,
      correlationId: runId,
      now,
    });
    expect(verification.success).toBe(true);
    expect(service.auditEvents(runId).map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "WORK_PACKAGE_PERSISTED",
        "DISPATCH_LEASES_ACQUIRED",
        "VERIFICATION_COMPLETED",
      ]),
    );
    expect(() =>
      store.assertActiveDispatchLeases({
        runId,
        issueNumber: 24,
        worktreeId: pkg.targetWorktreeId,
        holderPid: process.pid + 1,
        now,
      }),
    ).toThrow(/lease pair/u);
    expect(() =>
      store.recordPhase165Event({
        runId,
        eventType: "VERIFICATION_COMPLETED",
        correlationId: runId,
        evidenceRef: `sha256:${pkg.packageHash}`,
        result: "OK",
        payload: { api_token: "must-not-be-persisted" },
        now,
      }),
    ).toThrow(/sensitive field/u);
    store.close();
  });
});
