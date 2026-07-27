import { describe, expect, it } from "vitest";

import {
  assertTrustManifestIntegrity,
  createNodeToolIdentity,
  createTrustManifest,
  type RepositoryIdentity,
} from "../src/operational-trust.ts";
import type { RunRecord, StateStore } from "../src/state-store.ts";
import {
  assertRunHasTrustedTool,
  assertRunHasTrustManifest,
} from "../src/trusted-process.ts";

function repositoryIdentity(): RepositoryIdentity {
  return {
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
    repositoryIdentityHash: "4".repeat(64),
  };
}

function stateStoreFor(run: RunRecord | null): StateStore {
  return {
    getRun: () => run,
  } as unknown as StateStore;
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
    };

    const first = createTrustManifest(seed);
    const second = createTrustManifest(seed);

    expect(first).toEqual(second);
    expect(first.trustManifestHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(assertTrustManifestIntegrity(first)).toBe(first);

    expect(() =>
      assertTrustManifestIntegrity({
        ...first,
        trustManifestHash: "0".repeat(64),
      }),
    ).toThrow(/TRUST_MANIFEST_INTEGRITY_FAILED/u);
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

    const trustedRun = {
      runId: "run-trusted",
      trustManifestHash: "7".repeat(64),
      repositoryIdentityHash: "8".repeat(64),
      toolIdentities: [runtimeIdentity],
    } as unknown as RunRecord;

    const stateStore = stateStoreFor(trustedRun);

    expect(assertRunHasTrustManifest("run-trusted", stateStore)).toBe(
      trustedRun,
    );

    expect(
      assertRunHasTrustedTool("run-trusted", stateStore, runtimeIdentity.name),
    ).toEqual(runtimeIdentity);

    expect(() =>
      assertRunHasTrustedTool("run-trusted", stateStore, "missing-tool"),
    ).toThrow(/TRUSTED_TOOL_REQUIRED/u);
  });
});
