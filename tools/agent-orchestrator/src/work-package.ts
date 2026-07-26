import { createHash } from "node:crypto";
import { OrchestratorError } from "./errors.ts";

export interface PlanApprovalBinding {
  readonly approvalEventId: string;
  readonly approvalCommentId: number;
  readonly approvalAuthorLogin: string;
  readonly approvalCommentUpdatedAt: string;
  readonly expiresAt: string;
  readonly baseSha: string;
  readonly planHash: string;
  readonly sourceSnapshotHash: string;
}

export interface WorkPackage {
  readonly schemaVersion: "1.0";
  readonly repository: string;
  readonly issueNumber: number;
  readonly issueBodyHash: string;
  readonly sourceSnapshotHash: string;
  readonly planHash: string;
  readonly baseSha: string;
  readonly authorizedFiles: readonly string[];
  readonly prohibitedFiles: readonly string[];
  readonly fixedProfiles: readonly string[];
  readonly planApprovalBinding: PlanApprovalBinding;
  readonly createdAt: string;
  readonly packageHash?: string;
}

export interface RunSnapshotInput {
  readonly sourceSnapshotHash: string;
  readonly issueBodyHash: string;
  readonly planHash: string;
  readonly baseSha: string;
  readonly authorizedFilesHash: string;
}

/**
 * Validates and normalizes relative paths according to ADR-0010.
 * Rejects absolute paths, '..' segments, ambiguous separators ('//', '\\').
 */
export function normalizePackagePath(pathInput: string): string {
  if (typeof pathInput !== "string" || pathInput.trim() === "") {
    throw new OrchestratorError(
      "INVALID_WORK_PACKAGE_PATH",
      "Path must be a non-empty string",
    );
  }
  if (
    pathInput.startsWith("/") ||
    pathInput.includes("\\") ||
    pathInput.includes("//")
  ) {
    throw new OrchestratorError(
      "INVALID_WORK_PACKAGE_PATH",
      `Path contains invalid or ambiguous separators: ${pathInput}`,
    );
  }
  const segments = pathInput.split("/");
  if (segments.includes("..") || segments.includes(".")) {
    throw new OrchestratorError(
      "INVALID_WORK_PACKAGE_PATH",
      `Path traversal segments not allowed: ${pathInput}`,
    );
  }
  return pathInput;
}

/**
 * Deterministic JSON serializer that sorts object keys lexicographically
 * and ensures LF line endings without implicit string normalization.
 */
export function canonicalizeValue(val: unknown): string {
  if (val === null || typeof val !== "object") {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    const items = val.map((item) => canonicalizeValue(item));
    return `[${items.join(",")}]`;
  }
  const obj = val as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs: string[] = [];
  for (const key of keys) {
    if (obj[key] !== undefined) {
      pairs.push(`${JSON.stringify(key)}:${canonicalizeValue(obj[key])}`);
    }
  }
  return `{${pairs.join(",")}}`;
}

/**
 * Generates the canonical string representation of a work package,
 * excluding the packageHash field per ADR-0010.
 */
export function canonicalizeWorkPackage(pkg: WorkPackage): string {
  // Validate and normalize all paths
  const authFiles = pkg.authorizedFiles.map(normalizePackagePath);
  const prohFiles = pkg.prohibitedFiles.map(normalizePackagePath);

  // Ensure no downstream mutable state is inside the work package
  const raw = pkg as unknown as Record<string, unknown>;
  if (
    "implementApproved" in raw ||
    "pushApproved" in raw ||
    "mergeApproved" in raw ||
    "downstreamApprovals" in raw
  ) {
    throw new OrchestratorError(
      "INVALID_WORK_PACKAGE_STATE",
      "Work package must not contain downstream approval state (IMPLEMENT_APPROVED, PUSH_APPROVED, MERGE_APPROVED remain external)",
    );
  }

  const cleanPackage = {
    authorizedFiles: [...authFiles],
    baseSha: pkg.baseSha,
    createdAt: pkg.createdAt,
    fixedProfiles: [...pkg.fixedProfiles],
    issueBodyHash: pkg.issueBodyHash,
    issueNumber: pkg.issueNumber,
    planApprovalBinding: {
      approvalAuthorLogin: pkg.planApprovalBinding.approvalAuthorLogin,
      approvalCommentId: pkg.planApprovalBinding.approvalCommentId,
      approvalCommentUpdatedAt:
        pkg.planApprovalBinding.approvalCommentUpdatedAt,
      approvalEventId: pkg.planApprovalBinding.approvalEventId,
      baseSha: pkg.planApprovalBinding.baseSha,
      expiresAt: pkg.planApprovalBinding.expiresAt,
      planHash: pkg.planApprovalBinding.planHash,
      sourceSnapshotHash: pkg.planApprovalBinding.sourceSnapshotHash,
    },
    planHash: pkg.planHash,
    prohibitedFiles: [...prohFiles],
    repository: pkg.repository,
    schemaVersion: pkg.schemaVersion,
    sourceSnapshotHash: pkg.sourceSnapshotHash,
  };

  return canonicalizeValue(cleanPackage);
}

/**
 * Computes SHA-256 hex hash of the canonicalized work package.
 */
export function computePackageHash(pkg: WorkPackage): string {
  const canonical = canonicalizeWorkPackage(pkg);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Creates an immutable work package with calculated packageHash.
 */
export function createWorkPackage(
  input: Omit<WorkPackage, "packageHash">,
): WorkPackage & { readonly packageHash: string } {
  const hash = computePackageHash(input as WorkPackage);
  return Object.freeze({
    ...input,
    authorizedFiles: Object.freeze([...input.authorizedFiles]),
    prohibitedFiles: Object.freeze([...input.prohibitedFiles]),
    fixedProfiles: Object.freeze([...input.fixedProfiles]),
    planApprovalBinding: Object.freeze({ ...input.planApprovalBinding }),
    packageHash: hash,
  });
}

/**
 * Validates the work package against an observed run snapshot and its own hash.
 * Enforces all binding invariants from ADR-0010 Section 8.
 */
export function validateWorkPackage(
  pkg: WorkPackage,
  runSnapshot: RunSnapshotInput,
): void {
  if (!pkg.packageHash) {
    throw new OrchestratorError(
      "INVALID_WORK_PACKAGE",
      "Work package is missing packageHash",
    );
  }
  const expectedHash = computePackageHash(pkg);
  if (pkg.packageHash !== expectedHash) {
    throw new OrchestratorError(
      "WORK_PACKAGE_HASH_MISMATCH",
      `packageHash mismatch: expected ${expectedHash}, got ${pkg.packageHash}`,
    );
  }
  if (pkg.sourceSnapshotHash !== runSnapshot.sourceSnapshotHash) {
    throw new OrchestratorError(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "sourceSnapshotHash does not match run snapshot",
    );
  }
  if (pkg.issueBodyHash !== runSnapshot.issueBodyHash) {
    throw new OrchestratorError(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "issueBodyHash does not match run snapshot",
    );
  }
  if (pkg.planHash !== runSnapshot.planHash) {
    throw new OrchestratorError(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "planHash does not match run snapshot",
    );
  }
  if (pkg.baseSha !== runSnapshot.baseSha) {
    throw new OrchestratorError(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "baseSha does not match run snapshot",
    );
  }
  if (pkg.planApprovalBinding.planHash !== pkg.planHash) {
    throw new OrchestratorError(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "planApprovalBinding.planHash does not match package planHash",
    );
  }
  if (pkg.planApprovalBinding.sourceSnapshotHash !== pkg.sourceSnapshotHash) {
    throw new OrchestratorError(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "planApprovalBinding.sourceSnapshotHash does not match package sourceSnapshotHash",
    );
  }
  if (pkg.planApprovalBinding.baseSha !== pkg.baseSha) {
    throw new OrchestratorError(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "planApprovalBinding.baseSha does not match package baseSha",
    );
  }
}
