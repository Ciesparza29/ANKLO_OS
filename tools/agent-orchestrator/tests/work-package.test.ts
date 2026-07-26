import { describe, expect, it } from "vitest";
import {
  canonicalizeValue,
  canonicalizeWorkPackage,
  computePackageHash,
  createWorkPackage,
  normalizePackagePath,
  validateWorkPackage,
  type WorkPackage,
} from "../src/work-package.ts";

describe("Work Package (ADR-0010 Section 8)", () => {
  const baseBinding = {
    approvalEventId: "00000000-0000-4000-8000-000000000024",
    approvalCommentId: 5000000001,
    approvalAuthorLogin: "Ciesparza29",
    approvalCommentUpdatedAt: "2026-07-26T13:00:00Z",
    expiresAt: "2099-12-31T23:59:59Z",
    baseSha: "7".repeat(40),
    planHash: "1".repeat(64),
    sourceSnapshotHash: "2".repeat(64),
  };

  const sampleInput: Omit<WorkPackage, "packageHash"> = {
    schemaVersion: "1.0",
    repository: "Ciesparza29/ANKLO_OS",
    issueNumber: 24,
    issueBodyHash: "3".repeat(64),
    sourceSnapshotHash: "2".repeat(64),
    planHash: "1".repeat(64),
    baseSha: "7".repeat(40),
    authorizedFiles: [
      "tools/agent-orchestrator/src/work-package.ts",
      "tools/agent-orchestrator/src/index.ts",
    ],
    prohibitedFiles: ["prisma/schema.prisma", "apps/web/package.json"],
    fixedProfiles: ["code-standard", "docs-only"],
    planApprovalBinding: baseBinding,
    createdAt: "2026-07-26T13:00:00Z",
  };

  it("normalizes and validates relative paths strictly", () => {
    expect(normalizePackagePath("src/index.ts")).toBe("src/index.ts");
    expect(() => normalizePackagePath("/absolute/path")).toThrow(
      /ambiguous separators/,
    );
    expect(() => normalizePackagePath("path/../traversal")).toThrow(
      /traversal segments/,
    );
    expect(() => normalizePackagePath("double//slash")).toThrow(
      /ambiguous separators/,
    );
  });

  it("canonicalizes value deterministically with lexicographic keys", () => {
    const obj = { z: 1, a: [3, 2], b: { y: "test", x: null } };
    const can = canonicalizeValue(obj);
    expect(can).toBe('{"a":[3,2],"b":{"x":null,"y":"test"},"z":1}');
  });

  it("canonicalizes work package excluding packageHash and enforcing invariants", () => {
    const pkg = createWorkPackage(sampleInput);
    const can1 = canonicalizeWorkPackage(pkg);
    const can2 = canonicalizeWorkPackage({
      ...sampleInput,
      packageHash: "dummy",
    });
    expect(can1).toBe(can2);
    expect(can1).not.toContain("packageHash");
  });

  it("forbids downstream mutable approval state inside work package", () => {
    const invalidPkg = {
      ...sampleInput,
      implementApproved: true,
    } as unknown as WorkPackage;
    expect(() => canonicalizeWorkPackage(invalidPkg)).toThrow(
      /must not contain downstream approval state/,
    );
  });

  it("computes immutable packageHash and validates against run snapshot", () => {
    const pkg = createWorkPackage(sampleInput);
    expect(pkg.packageHash).toMatch(/^[0-9a-f]{64}$/);
    expect(pkg.packageHash).toBe(computePackageHash(pkg));

    const runSnapshot = {
      sourceSnapshotHash: "2".repeat(64),
      issueBodyHash: "3".repeat(64),
      planHash: "1".repeat(64),
      baseSha: "7".repeat(40),
      authorizedFilesHash: "any",
    };

    expect(() => validateWorkPackage(pkg, runSnapshot)).not.toThrow();

    expect(() =>
      validateWorkPackage(pkg, {
        ...runSnapshot,
        sourceSnapshotHash: "9".repeat(64),
      }),
    ).toThrow(/sourceSnapshotHash does not match/);

    expect(() =>
      validateWorkPackage(pkg, {
        ...runSnapshot,
        issueBodyHash: "8".repeat(64),
      }),
    ).toThrow(/issueBodyHash does not match/);
  });
});
