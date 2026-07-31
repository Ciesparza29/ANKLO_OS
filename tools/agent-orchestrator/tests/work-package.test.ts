/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: (path: import("node:fs").PathLike) => {
      if (
        (globalThis as any).__mockExistsFalse &&
        String(path).endsWith("work-package.json")
      ) {
        return false;
      }
      return actual.existsSync(path);
    },
    linkSync: (
      src: import("node:fs").PathLike,
      dest: import("node:fs").PathLike,
    ) => {
      if ((globalThis as any).__mockLinkError) {
        throw new Error("Simulated link failure");
      }
      return actual.linkSync(src, dest);
    },
    writeFileSync: (
      fd: import("node:fs").PathOrFileDescriptor,
      data: string | NodeJS.ArrayBufferView,
      options: import("node:fs").WriteFileOptions,
    ) => {
      if ((globalThis as any).__mockWriteError) {
        throw new Error("Simulated write failure");
      }
      return actual.writeFileSync(fd, data, options);
    },
  };
});
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
  validateRunId,
  assertPlainDataStructure,
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
    const { packagePath } = persistWorkPackage({
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

  it("validates runId according to Requisito C", () => {
    expect(validateRunId("run-123")).toBe("run-123");
    expect(validateRunId("valid.run_ID-1")).toBe("valid.run_ID-1");
    expect(validateRunId("a")).toBe("a");

    expect(() => validateRunId("")).toThrow(/length/u);
    expect(() => validateRunId("a".repeat(129))).toThrow(/length/u);
    expect(() => validateRunId(".")).toThrow(/forbidden/u);
    expect(() => validateRunId("..")).toThrow(/forbidden/u);
    expect(() => validateRunId("run/123")).toThrow(/forbidden/u);
    expect(() => validateRunId("run\\123")).toThrow(/forbidden/u);
    expect(() => validateRunId("run 123")).toThrow(/forbidden/u);
    expect(() => validateRunId("run\0id")).toThrow(/forbidden/u);
    expect(() => validateRunId(".run")).toThrow(/pattern/u);
    expect(() => validateRunId("-run")).toThrow(/pattern/u);
    expect(() => validateRunId("_run")).toThrow(/pattern/u);
    expect(() => validateRunId("e\u0301")).toThrow(/canonical/u);
  });

  it("asserts plain data structure according to Requisito E", () => {
    expect(() =>
      assertPlainDataStructure({ a: [1, "test", true, null] }),
    ).not.toThrow();

    expect(() => assertPlainDataStructure(Symbol("s"))).toThrow(/forbidden/u);
    expect(() => assertPlainDataStructure(1n)).toThrow(/forbidden/u);
    expect(() => assertPlainDataStructure(undefined)).toThrow(/forbidden/u);
    expect(() => assertPlainDataStructure(() => {})).toThrow(/forbidden/u);
    expect(() => assertPlainDataStructure({ [Symbol("k")]: 1 })).toThrow(
      /Symbol/u,
    );

    const sparse = [1, 2];
    delete sparse[0];
    expect(() => assertPlainDataStructure(sparse)).toThrow(/sparse/u);

    const extra = [1, 2];
    Object.assign(extra, { foo: "bar" });
    expect(() => assertPlainDataStructure(extra)).toThrow(/extra/u);

    const objGet = {};
    Object.defineProperty(objGet, "prop", {
      get() {
        return 1;
      },
      enumerable: true,
    });
    expect(() => assertPlainDataStructure(objGet)).toThrow(/getter/u);

    const objNonEnum = {};
    Object.defineProperty(objNonEnum, "prop", {
      value: 1,
      enumerable: false,
    });
    expect(() => assertPlainDataStructure(objNonEnum)).toThrow(/enumerable/u);

    const objProto = {};
    Object.defineProperty(objProto, "__proto__", {
      value: {},
      enumerable: true,
    });
    expect(() => assertPlainDataStructure(objProto)).toThrow(/forbidden/u);
  });

  describe("atomic publication constraints", () => {
    beforeEach(() => {
      (globalThis as any).__mockExistsFalse = false;
      (globalThis as any).__mockLinkError = false;
      (globalThis as any).__mockWriteError = false;
    });

    it("destino preexistente sin overwrite", () => {
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

      const { packagePath } = persistWorkPackage({
        workPackage: pkg,
        runtimeDirectory: runtime,
        repositoryRoot: repository,
        worktreePath: worktree,
      });

      // Alter the file physically
      chmodSync(packagePath, 0o600);
      writeFileSync(packagePath, "pre-existing-content", "utf8");

      expect(() =>
        persistWorkPackage({
          workPackage: pkg,
          runtimeDirectory: runtime,
          repositoryRoot: repository,
          worktreePath: worktree,
        }),
      ).toThrow(/already exists/u);

      expect(readFileSync(packagePath, "utf8")).toBe("pre-existing-content");
    });

    it("publicación concurrente con exactamente un ganador", () => {
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
      mkdirSync(runtime);
      const pkg = createWorkPackage({ ...sampleInput, worktreePath: worktree });

      const expectedPackageDirectory = join(
        realpathSync(runtime),
        "tasks",
        String(pkg.issueNumber),
        pkg.runId,
      );
      mkdirSync(expectedPackageDirectory, { recursive: true, mode: 0o700 });
      const expectedPackagePath = join(
        expectedPackageDirectory,
        "work-package.json",
      );
      writeFileSync(expectedPackagePath, "winner-content", "utf8");

      (globalThis as any).__mockExistsFalse = true;

      expect(() =>
        persistWorkPackage({
          workPackage: pkg,
          runtimeDirectory: runtime,
          repositoryRoot: repository,
          worktreePath: worktree,
        }),
      ).toThrow(/already exists or could not be published atomically/u);

      (globalThis as any).__mockExistsFalse = false;

      // Ensure the destination was not overwritten.
      expect(readFileSync(expectedPackagePath, "utf8")).toBe("winner-content");

      // Ensure the temp file of the loser was cleaned up
      const files = readdirSync(expectedPackageDirectory);
      expect(files.filter((f) => f.endsWith(".tmp")).length).toBe(0);
    });

    it("fallo después de crear o escribir el temporal y antes de publicar", () => {
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
      mkdirSync(runtime);

      const pkg = createWorkPackage({ ...sampleInput, worktreePath: worktree });

      (globalThis as any).__mockWriteError = true;
      expect(() =>
        persistWorkPackage({
          workPackage: pkg,
          runtimeDirectory: runtime,
          repositoryRoot: repository,
          worktreePath: worktree,
        }),
      ).toThrow(
        /Could not create temporary work package.*Simulated write failure/u,
      );
      (globalThis as any).__mockWriteError = false;

      const expectedPackageDirectory = join(
        realpathSync(runtime),
        "tasks",
        String(pkg.issueNumber),
        pkg.runId,
      );
      const files = existsSync(expectedPackageDirectory)
        ? readdirSync(expectedPackageDirectory)
        : [];
      expect(files).not.toContain("work-package.json"); // no incomplete final file
      expect(files.filter((f) => f.endsWith(".tmp")).length).toBe(0); // temp file cleaned up
    });

    it("fallo del link no-clobber", () => {
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
      mkdirSync(runtime);
      const pkg = createWorkPackage({ ...sampleInput, worktreePath: worktree });

      (globalThis as any).__mockLinkError = true;
      expect(() =>
        persistWorkPackage({
          workPackage: pkg,
          runtimeDirectory: runtime,
          repositoryRoot: repository,
          worktreePath: worktree,
        }),
      ).toThrow(
        /already exists or could not be published atomically.*Simulated link failure/u,
      );
      (globalThis as any).__mockLinkError = false;

      const expectedPackageDirectory = join(
        realpathSync(runtime),
        "tasks",
        String(pkg.issueNumber),
        pkg.runId,
      );
      const files = readdirSync(expectedPackageDirectory);
      expect(files).not.toContain("work-package.json"); // no incomplete final file
      expect(files.filter((f) => f.endsWith(".tmp")).length).toBe(0); // temp file cleaned up
    });

    it("limpieza exclusiva del temporal propio", () => {
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
      mkdirSync(runtime);
      const pkg = createWorkPackage({ ...sampleInput, worktreePath: worktree });

      const expectedPackageDirectory = join(
        realpathSync(runtime),
        "tasks",
        String(pkg.issueNumber),
        pkg.runId,
      );
      mkdirSync(expectedPackageDirectory, { recursive: true, mode: 0o700 });
      const alienTmpPath = join(expectedPackageDirectory, ".wp-alien.tmp");
      writeFileSync(alienTmpPath, "alien-content", "utf8");

      (globalThis as any).__mockLinkError = true;
      expect(() =>
        persistWorkPackage({
          workPackage: pkg,
          runtimeDirectory: runtime,
          repositoryRoot: repository,
          worktreePath: worktree,
        }),
      ).toThrow();
      (globalThis as any).__mockLinkError = false;

      // Alien tmp file MUST NOT be deleted
      expect(existsSync(alienTmpPath)).toBe(true);
      expect(readFileSync(alienTmpPath, "utf8")).toBe("alien-content");

      const files = readdirSync(expectedPackageDirectory);
      expect(files.filter((f) => f.endsWith(".tmp")).length).toBe(1); // Only the alien tmp file remains
    });

    it("alteración detectada durante la verificación posterior", () => {
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
      mkdirSync(runtime);
      const pkg = createWorkPackage({ ...sampleInput, worktreePath: worktree });

      const { packagePath } = persistWorkPackage({
        workPackage: pkg,
        runtimeDirectory: runtime,
        repositoryRoot: repository,
        worktreePath: worktree,
      });

      chmodSync(packagePath, 0o600);
      const persisted = JSON.parse(readFileSync(packagePath, "utf8")) as Record<
        string,
        unknown
      >;
      persisted.targetBranch = "hacked-branch";
      writeFileSync(packagePath, JSON.stringify(persisted), "utf8");

      expect(() =>
        loadAndValidatePersistedWorkPackage(packagePath, snapshot(pkg)),
      ).toThrow(/packageHash does not reproduce the canonical package/u);
    });

    it("rechazo de symlinks en la ruta real de publicación", () => {
      const root = temporaryDirectory();
      const repository = join(root, "repository");
      const worktree = join(root, "worktree");
      const runtime = join(root, "runtime");
      const outside = join(root, "outside");
      mkdirSync(join(repository, "tools/agent-orchestrator/src"), {
        recursive: true,
      });
      mkdirSync(join(repository, "apps/web"), { recursive: true });
      mkdirSync(join(repository, "prisma"), { recursive: true });
      mkdirSync(worktree);
      mkdirSync(outside);
      symlinkSync(outside, runtime);

      const pkg = createWorkPackage({ ...sampleInput, worktreePath: worktree });

      expect(() =>
        persistWorkPackage({
          workPackage: pkg,
          runtimeDirectory: runtime, // runtime is a symlink
          repositoryRoot: repository,
          worktreePath: worktree,
        }),
      ).toThrow(/traverses a symbolic link/u);
    });
  });
});
