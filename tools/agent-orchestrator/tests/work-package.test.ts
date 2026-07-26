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
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  canonicalizeValue,
  canonicalizeWorkPackage,
  computeAuthorizedFilesHash,
  computePackageHash,
  createWorkPackage,
  loadAndValidatePersistedWorkPackage,
  normalizePackagePath,
  persistWorkPackage,
  validatePackagePathsAgainstRepository,
  validateWorkPackage,
  type RunSnapshotInput,
  type WorkPackage,
} from "../src/work-package.ts";

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = realpathSync(
    mkdtempSync(join(tmpdir(), "anklo-package-test-")),
  );
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe("immutable work packages", () => {
  const authorizedFiles = [
    "tools/agent-orchestrator/src/work-package.ts",
    "tools/agent-orchestrator/src/index.ts",
  ] as const;
  const sampleInput: Omit<WorkPackage, "packageHash"> = {
    schemaVersion: "1.0",
    canonicalizationVersion: "1.0",
    repository: "Ciesparza29/ANKLO_OS",
    issueNumber: 24,
    runId: "run-24-r1",
    idempotencyKey: "0".repeat(64),
    issueBodyHash: "3".repeat(64),
    sourceSnapshotHash: "2".repeat(64),
    planHash: "1".repeat(64),
    baseBranch: "main",
    baseSha: "7".repeat(40),
    targetBranch: "feat/24-agent-orchestrator",
    targetHeadSha: "7".repeat(40),
    targetWorktreeId: "worktree-24",
    worktreePath: "/tmp/anklo-worktree-24",
    authorizedFiles,
    prohibitedFiles: ["prisma/schema.prisma", "apps/web/package.json"],
    authorizedFilesHash: computeAuthorizedFilesHash(authorizedFiles),
    fixedProfiles: ["code-standard", "docs-only"],
    requiredSkills: ["anklo-handoff"],
    acceptanceCriteria: ["All protected bindings match"],
    planApprovalBinding: {
      approvalEventId: "00000000-0000-4000-8000-000000000024",
      approvalCommentId: 5_000_000_001,
      approvalAuthorLogin: "Ciesparza29",
      approvalCommentUpdatedAt: "2026-07-26T13:00:00.000Z",
      expiresAt: "2099-12-31T23:59:59.000Z",
      baseSha: "7".repeat(40),
      planHash: "1".repeat(64),
      sourceSnapshotHash: "2".repeat(64),
    },
    createdAt: "2026-07-26T13:00:00.000Z",
  };

  function snapshot(pkg: WorkPackage): RunSnapshotInput {
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

  it("rejects absolute, traversal, empty, backslash and NUL paths", () => {
    expect(normalizePackagePath("src/index.ts")).toBe("src/index.ts");
    for (const invalid of [
      "/absolute/path",
      "C:/absolute/path",
      "path/../traversal",
      "path/./file",
      "double//slash",
      "trailing/",
      "back\\slash",
      "nul\0byte",
    ]) {
      expect(() => normalizePackagePath(invalid)).toThrow();
    }
  });

  it("rejects non-JSON values, non-finite numbers and cycles", () => {
    for (const value of [
      undefined,
      1n,
      Symbol("x"),
      () => undefined,
      NaN,
      Infinity,
    ]) {
      expect(() => canonicalizeValue(value)).toThrow();
    }
    expect(() => canonicalizeValue({ hidden: undefined })).toThrow();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => canonicalizeValue(cyclic)).toThrow(/Cyclic/u);
  });

  it("sorts object keys recursively while preserving array order", () => {
    expect(
      canonicalizeValue({ z: 1, a: [3, 2], b: { y: "test", x: null } }),
    ).toBe('{"a":[3,2],"b":{"x":null,"y":"test"},"z":1}');
  });

  it("rejects duplicate, overlapping, case-colliding and unknown fields", () => {
    expect(() =>
      createWorkPackage({
        ...sampleInput,
        authorizedFiles: ["src", "src/index.ts"],
        authorizedFilesHash: computeAuthorizedFilesHash([
          "src",
          "src/index.ts",
        ]),
      }),
    ).toThrow(/Overlapping/u);
    expect(() =>
      createWorkPackage({
        ...sampleInput,
        authorizedFiles: ["src/File.ts", "src/file.ts"],
        authorizedFilesHash: computeAuthorizedFilesHash([
          "src/File.ts",
          "src/file.ts",
        ]),
      }),
    ).toThrow(/Case-colliding/u);
    expect(() =>
      createWorkPackage({
        ...sampleInput,
        authorizedFiles: ["src/index.ts", "src/index.ts"],
        authorizedFilesHash: "0".repeat(64),
      }),
    ).toThrow(/duplicates/u);
    expect(() =>
      createWorkPackage({
        ...sampleInput,
        implementApproved: true,
      } as unknown as Omit<WorkPackage, "packageHash">),
    ).toThrow(/invalid fields/u);
  });

  it("binds every protected run and target field", () => {
    const pkg = createWorkPackage(sampleInput);
    expect(pkg.packageHash).toBe(computePackageHash(pkg));
    expect(canonicalizeWorkPackage(pkg)).not.toContain("packageHash");
    expect(() => validateWorkPackage(pkg, snapshot(pkg))).not.toThrow();
    for (const field of [
      "repository",
      "issueNumber",
      "runId",
      "idempotencyKey",
      "sourceSnapshotHash",
      "issueBodyHash",
      "planHash",
      "baseSha",
      "targetBranch",
      "targetHeadSha",
      "targetWorktreeId",
      "worktreePath",
      "authorizedFilesHash",
    ] as const) {
      const changed = {
        ...snapshot(pkg),
        [field]: field === "issueNumber" ? 25 : `changed-${field}`,
      } as RunSnapshotInput;
      expect(() => validateWorkPackage(pkg, changed)).toThrow(
        new RegExp(field, "u"),
      );
    }
  });

  it("rejects symlink escapes against a concrete repository", () => {
    const root = temporaryDirectory();
    const repository = join(root, "repository");
    const outside = join(root, "outside");
    mkdirSync(join(repository, "src"), { recursive: true });
    mkdirSync(outside);
    symlinkSync(outside, join(repository, "src", "link"));
    expect(() =>
      validatePackagePathsAgainstRepository(repository, ["src/link/file.ts"]),
    ).toThrow(/symbolic link/u);
  });

  it("persists once outside the worktree and verifies at-rest integrity", () => {
    const root = temporaryDirectory();
    const repository = join(root, "repository");
    const worktree = join(root, "worktree");
    const runtime = join(root, "runtime");
    mkdirSync(join(repository, "tools/agent-orchestrator/src"), {
      recursive: true,
    });
    mkdirSync(join(repository, "apps/web"), { recursive: true });
    mkdirSync(join(repository, "prisma"), { recursive: true });
    mkdirSync(worktree);
    const pkg = createWorkPackage({ ...sampleInput, worktreePath: worktree });
    const packagePath = persistWorkPackage({
      workPackage: pkg,
      runtimeDirectory: runtime,
      repositoryRoot: repository,
      worktreePath: worktree,
    });
    expect(readFileSync(packagePath, "utf8").endsWith("\n")).toBe(true);
    expect(
      loadAndValidatePersistedWorkPackage(packagePath, snapshot(pkg))
        .packageHash,
    ).toBe(pkg.packageHash);
    expect(() =>
      persistWorkPackage({
        workPackage: pkg,
        runtimeDirectory: runtime,
        repositoryRoot: repository,
        worktreePath: worktree,
      }),
    ).toThrow(/already exists/u);

    chmodSync(packagePath, 0o600);
    const persisted = JSON.parse(readFileSync(packagePath, "utf8")) as Record<
      string,
      unknown
    >;
    persisted.planHash = "9".repeat(64);
    writeFileSync(packagePath, JSON.stringify(persisted), "utf8");
    expect(() =>
      loadAndValidatePersistedWorkPackage(packagePath, snapshot(pkg)),
    ).toThrow();
  });
});
