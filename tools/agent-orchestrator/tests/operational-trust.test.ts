import { describe, expect, it } from "vitest";

import {
  assertRepositoryIdentityIntegrity,
  assertToolIdentityIntegrity,
  assertTrustManifestIntegrity,
  createNodeToolIdentity,
  createRepositoryIdentity,
  createTrustManifest,
  type RepositoryIdentity,
} from "../src/operational-trust.ts";
import type { RunRecord, StateStore } from "../src/state-store.ts";
import {
  assertRunHasTrustedTool,
  assertRunHasTrustManifest,
  assertTrustedExecutionContext,
} from "../src/trusted-process.ts";

function repositoryIdentity(): RepositoryIdentity {
  return createRepositoryIdentity({
    repositorySlug: "Ciesparza29/ANKLO_OS",
    host: "github.com",
    normalizedOrigin: "github.com/Ciesparza29/ANKLO_OS",
    repositoryRealpath: "/tmp/repository",
    worktreeRealpath: "/tmp/repository/worktree",
    mainCloneRealpath: "/tmp/repository/main",
    gitDir: "/tmp/repository/.git/worktrees/worktree",
    commonGitDir: "/tmp/repository/.git",
    worktreeRegistrationHash: "1".repeat(64),
    branch: "fix/24-orchestrator-trust-r5",
    headSha: "2".repeat(40),
    baseSha: "3".repeat(40),
    worktreeId: "worktree-r5",
    issueNumber: 24,
    protectedPaths: ["/tmp/repository/main", "/tmp/repository/rejected"],
    remoteIdentity: "origin:github.com/Ciesparza29/ANKLO_OS",
  });
}

function stateStoreFor(
  run: RunRecord | null,
  onEffectsAllowed: (runId?: string) => void = () => undefined,
): StateStore {
  return {
    getRun: () => run,
    assertEffectsAllowed: onEffectsAllowed,
  } as unknown as StateStore;
}

function trustedRunFor(
  runId: string,
  runtimeIdentity = createNodeToolIdentity(),
): RunRecord {
  const repository = repositoryIdentity();
  const trustManifest = createTrustManifest({
    createdAt: "2026-07-26T22:00:00.000Z",
    toolIdentities: [runtimeIdentity],
    repositoryIdentity: repository,
    lockfileHash: "9".repeat(64),
    workspaceManifestHash: "a".repeat(64),
    packageManifestHash: "c".repeat(64),
    analyzerVersion: "1.0.0",
    commonGitDirIdentity: "b".repeat(64),
  });

  return {
    runId,
    trustManifestHash: trustManifest.trustManifestHash,
    repositoryIdentityHash: repository.repositoryIdentityHash,
    repositoryIdentity: repository,
    toolIdentities: trustManifest.toolIdentities,
    lockfileHash: trustManifest.lockfileHash,
    workspaceManifestHash: trustManifest.workspaceManifestHash,
    packageManifestHash: trustManifest.packageManifestHash,
    analyzerVersion: trustManifest.analyzerVersion,
    remoteIdentity: repository.remoteIdentity,
    commonGitDirIdentity: trustManifest.commonGitDirIdentity,
    trustManifest,
  } as unknown as RunRecord;
}

describe("operational trust contracts", () => {
  it("anchors the runtime identity to the current executable", () => {
    const identity = createNodeToolIdentity();

    expect(identity.name).toBe(process.release.name);
    expect(identity.resolvedPath).toBe(process.execPath);
    expect(identity.realpath.length).toBeGreaterThan(0);
    expect(identity.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(identity.version).toBe(process.versions.node);
  });

  it("creates a deterministic immutable trust manifest", () => {
    const runtimeIdentity = createNodeToolIdentity();
    const seed = {
      createdAt: "2026-07-26T22:00:00.000Z",
      toolIdentities: [runtimeIdentity],
      repositoryIdentity: repositoryIdentity(),
      lockfileHash: "5".repeat(64),
      workspaceManifestHash: "6".repeat(64),
      packageManifestHash: "7".repeat(64),
      commonGitDirIdentity: "8".repeat(64),
    };

    const first = createTrustManifest(seed);
    const second = createTrustManifest(seed);

    expect(first).toEqual(second);
    expect(first.trustManifestHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(assertTrustManifestIntegrity(first)).toStrictEqual(first);

    expect(() =>
      assertTrustManifestIntegrity({
        ...first,
        trustManifestHash: "0".repeat(64),
      }),
    ).toThrow(/TRUST_MANIFEST_INTEGRITY_FAILED/u);
  });

  it("revalidates the current executable against its persisted identity", () => {
    const identity = createNodeToolIdentity();

    expect(assertToolIdentityIntegrity(identity)).toEqual(identity);

    expect(() =>
      assertToolIdentityIntegrity({
        ...identity,
        sha256: "0".repeat(64),
      }),
    ).toThrow(/TRUSTED_TOOL_IDENTITY_MISMATCH/u);
  });

  it("computes and verifies repository identity from canonical fields", () => {
    const identity = repositoryIdentity();

    expect(identity.repositoryIdentityHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(assertRepositoryIdentityIntegrity(identity)).toEqual(identity);

    expect(() =>
      assertRepositoryIdentityIntegrity({
        ...identity,
        branch: "tampered-branch",
      }),
    ).toThrow(/REPOSITORY_IDENTITY_INTEGRITY_FAILED/u);
  });

  it("fails closed when a run has no persisted trust", () => {
    expect(() =>
      assertRunHasTrustManifest("run-missing", stateStoreFor(null)),
    ).toThrow(/RUN_NOT_FOUND/u);

    const incompleteRun = {
      runId: "run-incomplete",
    } as unknown as RunRecord;

    expect(() =>
      assertRunHasTrustManifest("run-incomplete", stateStoreFor(incompleteRun)),
    ).toThrow(/TRUST_MANIFEST_REQUIRED/u);
  });

  it("binds trusted tool lookup to a persisted run", () => {
    const runtimeIdentity = createNodeToolIdentity();

    const trustedRun = trustedRunFor("run-trusted", runtimeIdentity);

    const stateStore = stateStoreFor(trustedRun);

    expect(assertRunHasTrustManifest("run-trusted", stateStore)).toStrictEqual(
      trustedRun,
    );

    expect(
      assertRunHasTrustedTool("run-trusted", stateStore, runtimeIdentity.name),
    ).toEqual(runtimeIdentity);

    expect(() =>
      assertRunHasTrustedTool("run-trusted", stateStore, "missing-tool"),
    ).toThrow(/TRUSTED_TOOL_REQUIRED/u);

    expect(() =>
      assertRunHasTrustedTool(
        "run-trusted",
        stateStoreFor({
          ...trustedRun,
          toolIdentities: [
            {
              ...runtimeIdentity,
              sha256: "0".repeat(64),
            },
          ],
        } as unknown as RunRecord),
        runtimeIdentity.name,
      ),
    ).toThrow(/TRUST_MANIFEST_INTEGRITY_FAILED/u);
  });

  it("checks kill switches and persisted trust before an effect", () => {
    const runtimeIdentity = createNodeToolIdentity();
    let checkedRunId: string | undefined;

    const trustedRun = trustedRunFor("run-effect", runtimeIdentity);

    const stateStore = stateStoreFor(trustedRun, (runId) => {
      checkedRunId = runId;
    });

    expect(
      assertTrustedExecutionContext(
        {
          runId: "run-effect",
          stateStore,
        },
        runtimeIdentity.name,
      ),
    ).toEqual(runtimeIdentity);

    expect(checkedRunId).toBe("run-effect");
  });

  it("blocks effects when any persisted trust component is absent", () => {
    const runtimeIdentity = createNodeToolIdentity();

    const incompleteRun = {
      runId: "run-partial-trust",
      trustManifestHash: "1".repeat(64),
      repositoryIdentityHash: "2".repeat(64),
      repositoryIdentity: repositoryIdentity(),
      toolIdentities: [runtimeIdentity],
      lockfileHash: null,
      workspaceManifestHash: "4".repeat(64),
      analyzerVersion: "1.0.0",
      remoteIdentity: "origin:github.com/Ciesparza29/ANKLO_OS",
      commonGitDirIdentity: "5".repeat(64),
    } as unknown as RunRecord;

    expect(() =>
      assertTrustedExecutionContext(
        {
          runId: "run-partial-trust",
          stateStore: stateStoreFor(incompleteRun),
        },
        runtimeIdentity.name,
      ),
    ).toThrow(/TRUST_MANIFEST_REQUIRED/u);
  });
});
