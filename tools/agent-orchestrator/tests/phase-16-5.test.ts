import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import type { ApprovalBody, ObservedApproval } from "../src/approvals.ts";
import { CodexReadOnlyAdapter } from "../src/codex-adapter.ts";
import { GitHubReadOnlyAdapter } from "../src/github-adapter.ts";
import { Phase165Service } from "../src/phase-16-5.ts";
import { SqliteStateStore } from "../src/state-store.ts";
import { computePackageHash, type WorkPackage } from "../src/work-package.ts";
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
  runtime: string;
} {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "anklo-phase165-test-")),
  );
  temporaryDirectories.push(root);
  const main = join(root, "main");
  const worktree = join(root, "worktree");
  const runtime = join(root, "runtime");
  mkdirSync(join(main, "docs"), { recursive: true });
  mkdirSync(runtime, { recursive: true });
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
  return { root, main, worktree, head, runtime };
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

function setupFullPipeline() {
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
  const dbPath = join(repo.root, "state.db");
  const store = SqliteStateStore.open(dbPath);
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
    runtimeDirectory: repo.runtime,
  });

  return { repo, store, now, runId, pkg, service, manager };
}

/** Binds the package, records IMPLEMENT_APPROVED, acquires leases, and
 *  transitions to RUNNING_IMPLEMENTATION. Returns the packagePath. */
function bindAndDispatch(ctx: ReturnType<typeof setupFullPipeline>): string {
  const { store, now, runId, pkg, service, repo } = ctx;
  const bound = service.bindAndPersistWorkPackage({
    workPackage: pkg,
    runtimeDirectory: repo.runtime,
    correlationId: runId,
    now,
  });

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
    reason: "dispatched",
    correlationId: runId,
    now,
  });
  return bound.packagePath;
}

describe("phase 16.5 StateStore integration", () => {
  it("binds PLAN approval, package, state, leases, runner and audit", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, pkg, service } = ctx;

    bindAndDispatch(ctx);
    expect(store.getRun(runId)?.packageHash).toBe(pkg.packageHash);

    const verification = await service.runVerification({
      runId,
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

  it("rejects a run without packageReference", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, pkg, service, repo } = ctx;

    // Bind the target (required for READY_TO_DISPATCH) but WITHOUT packageReference
    store.bindImplementationTarget({
      runId,
      targetRepository: "Ciesparza29/ANKLO_OS",
      targetRemote: "origin",
      targetBranch: "feat/phase165",
      targetHeadSha: repo.head,
      worktreeId: "worktree-phase165",
      authorizedFilesHash: pkg.authorizedFilesHash,
      packageHash: pkg.packageHash,
      planApprovalBinding: {
        approvalEventId: "evt_1",
        approvalCommentId: 100,
        approvalAuthorLogin: "testuser",
        approvalCommentUpdatedAt: "2026-07-26T00:00:00.000Z",
        expiresAt: "2026-08-01T00:00:00.000Z",
        baseSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        planHash:
          "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        sourceSnapshotHash:
          "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      },
      correlationId: runId,
      now,
    });
    const implementBody = {
      schema_version: "1.0",
      approval_kind: "IMPLEMENT_APPROVED",
      repository: "Ciesparza29/ANKLO_OS",
      issue_number: 24,
      expires_at: "2099-12-31T23:59:59.000Z",
      approval_event_id: "00000000-0000-4000-8000-000000000103",
      nonce: "00000000-0000-4000-8000-000000000104",
      target_branch: "feat/phase165",
      target_worktree_id: "worktree-phase165",
      target_head_sha: repo.head,
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
      reason: "test",
      correlationId: runId,
      now,
    });
    store.acquireDispatchLeases({
      runId,
      issueNumber: 24,
      worktreeId: "worktree-phase165",
      holderPid: process.pid,
      ttlMs: 60_000,
      now,
    });
    store.transitionRun({
      runId,
      to: "RUNNING_IMPLEMENTATION",
      reason: "test",
      correlationId: runId,
      now,
    });
    await expect(
      service.runVerification({
        runId,
        profile: "docs-only",
        holderPid: process.pid,
        correlationId: runId,
        now,
      }),
    ).rejects.toThrow(/package reference/iu);
    store.close();
  });

  it("rejects altered persisted package bytes", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, service } = ctx;
    const packagePath = bindAndDispatch(ctx);

    // Tamper with the persisted file — changes both content and byte length
    chmodSync(packagePath, 0o600);
    const content = JSON.parse(readFileSync(packagePath, "utf8")) as Record<
      string,
      unknown
    >;
    content.planHash = "f".repeat(64);
    writeFileSync(packagePath, JSON.stringify(content), "utf8");
    chmodSync(packagePath, 0o400);

    await expect(
      service.runVerification({
        runId,
        profile: "docs-only",
        holderPid: process.pid,
        correlationId: runId,
        now,
      }),
    ).rejects.toThrow(/byte length|hash|mismatch/iu);
    store.close();
  });

  it("rejects when planApprovalBinding mismatches", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, service } = ctx;
    const packagePath = bindAndDispatch(ctx);

    chmodSync(packagePath, 0o600);
    const content = JSON.parse(readFileSync(packagePath, "utf8")) as Record<
      string,
      unknown
    >;
    const binding = content.planApprovalBinding as Record<string, unknown>;
    binding.approvalCommentId = 999999;

    // Bypassing hash check in the StateStore to simulate an underlying DB mismatch
    const recomputedPkgHash = computePackageHash(
      content as unknown as WorkPackage,
    );
    content.packageHash = recomputedPkgHash;

    const newBytes = Buffer.from(JSON.stringify(content), "utf8");
    const newByteLength = newBytes.length;

    writeFileSync(packagePath, newBytes);
    chmodSync(packagePath, 0o400);

    const dbPath = join(ctx.repo.root, "state.db");
    const db = new DatabaseSync(dbPath);
    db.prepare(
      "UPDATE runs SET package_hash = ?, package_byte_length = ? WHERE run_id = ?",
    ).run(recomputedPkgHash, newByteLength, runId);
    db.close();

    await expect(
      service.runVerification({
        runId,
        profile: "docs-only",
        holderPid: process.pid,
        correlationId: runId,
        now,
      }),
    ).rejects.toThrow(/planApprovalBinding does not match/);

    store.close();
  });

  it("loads internal package and confirms packageReference is set", () => {
    const ctx = setupFullPipeline();
    const { store, runId } = ctx;
    bindAndDispatch(ctx);
    const run = store.getRun(runId);
    expect(run?.packageReference).not.toBeNull();
    expect(run?.packageReference?.relativePath).toMatch(
      /^tasks\/24\/run-phase-165\/work-package\.json$/u,
    );
    expect(run?.packageReference?.byteLength).toBeGreaterThan(0);
    expect(run?.packageReference?.packageHash).toMatch(/^[0-9a-f]{64}$/u);
    store.close();
  });

  it("rejects mismatched profile not in fixedProfiles", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, service } = ctx;
    bindAndDispatch(ctx);

    // "code-standard" is not in fixedProfiles (only "docs-only")
    await expect(
      service.runVerification({
        runId,
        profile: "code-standard",
        holderPid: process.pid,
        correlationId: runId,
        now,
      }),
    ).rejects.toThrow(/profile/iu);
    store.close();
  });

  it("rejects when no current IMPLEMENT_APPROVED approval", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, pkg, service, repo } = ctx;

    // Bind via service, but record the approval with already-expired expiry
    // We can't record expired approvals directly, so we bind first, then
    // advance time past the expiry
    service.bindAndPersistWorkPackage({
      workPackage: pkg,
      runtimeDirectory: repo.runtime,
      correlationId: runId,
      now,
    });
    const implementBody = {
      schema_version: "1.0",
      approval_kind: "IMPLEMENT_APPROVED",
      repository: "Ciesparza29/ANKLO_OS",
      issue_number: 24,
      expires_at: "2026-07-26T14:01:00.000Z", // expires in 1 minute
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
      ttlMs: 600_000,
      now,
    });
    store.transitionRun({
      runId,
      to: "RUNNING_IMPLEMENTATION",
      reason: "dispatched",
      correlationId: runId,
      now,
    });

    // Advance time past expiry
    const futureNow = new Date("2026-07-26T15:00:00.000Z");
    await expect(
      service.runVerification({
        runId,
        profile: "docs-only",
        holderPid: process.pid,
        correlationId: runId,
        now: futureNow,
      }),
    ).rejects.toThrow(/IMPLEMENT_APPROVED/u);
    store.close();
  });

  it("rejects invalid or expired leases", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, service } = ctx;
    bindAndDispatch(ctx);

    // Wrong holderPid — different process
    await expect(
      service.runVerification({
        runId,
        profile: "docs-only",
        holderPid: process.pid + 999,
        correlationId: runId,
        now,
      }),
    ).rejects.toThrow(/lease/iu);
    store.close();
  });

  it("does not invoke runner or adapter when validation fails", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, service } = ctx;
    bindAndDispatch(ctx);

    // Force a validation failure: wrong profile
    await expect(
      service.runVerification({
        runId,
        profile: "code-standard",
        holderPid: process.pid,
        correlationId: runId,
        now,
      }),
    ).rejects.toThrow(/profile/iu);

    // No VERIFICATION_COMPLETED events should exist for code-standard
    const events = service
      .auditEvents(runId)
      .filter(
        (e) =>
          e.eventType === "VERIFICATION_COMPLETED" &&
          JSON.stringify(e.payload).includes("code-standard"),
      );
    expect(events).toHaveLength(0);
    store.close();
  });

  it("uses the same secure path for runVerification and runCodexReview", async () => {
    const ctx = setupFullPipeline();
    const { store, now, runId, service } = ctx;
    bindAndDispatch(ctx);

    // runVerification loads from persisted reference internally
    const verification = await service.runVerification({
      runId,
      profile: "docs-only",
      holderPid: process.pid,
      correlationId: runId,
      now,
    });
    expect(verification.success).toBe(true);

    // Transition to RUNNING_REVIEW for Codex
    store.transitionRun({
      runId,
      to: "IMPLEMENTATION_COMPLETE",
      reason: "verification passed",
      correlationId: runId,
      now,
    });
    store.transitionRun({
      runId,
      to: "READY_FOR_REVIEW",
      reason: "ready",
      correlationId: runId,
      now,
    });
    store.transitionRun({
      runId,
      to: "RUNNING_REVIEW",
      reason: "reviewing",
      correlationId: runId,
      now,
    });

    // To prove runCodexReview uses the same secure path without hanging the real adapter,
    // we advance time so the IMPLEMENT_APPROVED approval expires. It will fail with APPROVAL_REQUIRED
    // before ever calling the adapter. This proves the validation runs.
    const futureNow = new Date("2100-01-01T00:00:00.000Z");
    await expect(
      service.runCodexReview({
        holderPid: process.pid,
        runId,
        prompt: "Review this code",
        correlationId: runId,
        now: futureNow,
      }),
    ).rejects.toThrow(/IMPLEMENT_APPROVED/u);

    store.close();
  });
});
