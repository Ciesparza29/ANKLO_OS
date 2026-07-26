import { createHash } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { GIT_SHA_PATTERN, SHA256_PATTERN, isRecord } from "./contracts.ts";
import { OrchestratorError } from "./errors.ts";

export const WORK_PACKAGE_SCHEMA_VERSION = "1.0" as const;
export const WORK_PACKAGE_CANONICALIZATION_VERSION = "1.0" as const;
export const WORK_PACKAGE_PROFILES = ["docs-only", "code-standard"] as const;

export type WorkPackageProfile = (typeof WORK_PACKAGE_PROFILES)[number];

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
  readonly schemaVersion: typeof WORK_PACKAGE_SCHEMA_VERSION;
  readonly canonicalizationVersion: typeof WORK_PACKAGE_CANONICALIZATION_VERSION;
  readonly repository: string;
  readonly issueNumber: number;
  readonly runId: string;
  readonly idempotencyKey: string;
  readonly issueBodyHash: string;
  readonly sourceSnapshotHash: string;
  readonly planHash: string;
  readonly baseBranch: "main";
  readonly baseSha: string;
  readonly targetBranch: string;
  readonly targetHeadSha: string;
  readonly targetWorktreeId: string;
  readonly worktreePath: string;
  readonly authorizedFiles: readonly string[];
  readonly prohibitedFiles: readonly string[];
  readonly authorizedFilesHash: string;
  readonly fixedProfiles: readonly WorkPackageProfile[];
  readonly requiredSkills: readonly string[];
  readonly acceptanceCriteria: readonly string[];
  readonly planApprovalBinding: PlanApprovalBinding;
  readonly createdAt: string;
  readonly packageHash?: string;
}

export interface RunSnapshotInput {
  readonly repository: string;
  readonly issueNumber: number;
  readonly runId: string;
  readonly idempotencyKey: string;
  readonly sourceSnapshotHash: string;
  readonly issueBodyHash: string;
  readonly planHash: string;
  readonly baseSha: string;
  readonly targetBranch: string;
  readonly targetHeadSha: string;
  readonly targetWorktreeId: string;
  readonly worktreePath: string;
  readonly authorizedFilesHash: string;
}

export interface PersistWorkPackageInput {
  readonly workPackage: WorkPackage & { readonly packageHash: string };
  readonly runtimeDirectory: string;
  readonly repositoryRoot: string;
  readonly worktreePath: string;
}

const PACKAGE_KEYS = [
  "schemaVersion",
  "canonicalizationVersion",
  "repository",
  "issueNumber",
  "runId",
  "idempotencyKey",
  "issueBodyHash",
  "sourceSnapshotHash",
  "planHash",
  "baseBranch",
  "baseSha",
  "targetBranch",
  "targetHeadSha",
  "targetWorktreeId",
  "worktreePath",
  "authorizedFiles",
  "prohibitedFiles",
  "authorizedFilesHash",
  "fixedProfiles",
  "requiredSkills",
  "acceptanceCriteria",
  "planApprovalBinding",
  "createdAt",
] as const;

const BINDING_KEYS = [
  "approvalEventId",
  "approvalCommentId",
  "approvalAuthorLogin",
  "approvalCommentUpdatedAt",
  "expiresAt",
  "baseSha",
  "planHash",
  "sourceSnapshotHash",
] as const;

function fail(code: string, message: string): never {
  throw new OrchestratorError(code, message);
}

function assertExactKeys(
  input: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(input).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail("INVALID_WORK_PACKAGE_SCHEMA", `${label} has invalid fields`);
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    fail(
      "INVALID_WORK_PACKAGE_SCHEMA",
      `${field} must be a non-empty NUL-free string`,
    );
  }
  return value;
}

function requireHash(value: unknown, field: string): string {
  const text = requireString(value, field);
  if (!SHA256_PATTERN.test(text)) {
    fail(
      "INVALID_WORK_PACKAGE_SCHEMA",
      `${field} must be a lowercase SHA-256 hash`,
    );
  }
  return text;
}

function requireGitSha(value: unknown, field: string): string {
  const text = requireString(value, field);
  if (!GIT_SHA_PATTERN.test(text)) {
    fail(
      "INVALID_WORK_PACKAGE_SCHEMA",
      `${field} must be a lowercase 40-character Git SHA`,
    );
  }
  return text;
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    fail(
      "INVALID_WORK_PACKAGE_SCHEMA",
      `${field} must be a positive safe integer`,
    );
  }
  return Number(value);
}

function requireCanonicalUtc(value: unknown, field: string): string {
  const text = requireString(value, field);
  const epoch = Date.parse(text);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== text) {
    fail(
      "INVALID_WORK_PACKAGE_SCHEMA",
      `${field} must be a canonical UTC timestamp`,
    );
  }
  return text;
}

function requireStringArray(value: unknown, field: string): readonly string[] {
  if (!Array.isArray(value)) {
    fail("INVALID_WORK_PACKAGE_SCHEMA", `${field} must be an array`);
  }
  const values = value.map((entry, index) =>
    requireString(entry, `${field}[${index}]`),
  );
  if (new Set(values).size !== values.length) {
    fail("DUPLICATE_WORK_PACKAGE_VALUE", `${field} contains duplicates`);
  }
  return values;
}

function isWithin(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

function assertNoSymlinkComponents(pathInput: string): void {
  const absolute = resolve(pathInput);
  const root = absolute.slice(0, absolute.indexOf(sep) + 1);
  const parts = absolute.slice(root.length).split(sep).filter(Boolean);
  let cursor = root;
  for (const part of parts) {
    cursor = join(cursor, part);
    if (!existsSync(cursor)) break;
    if (lstatSync(cursor).isSymbolicLink()) {
      fail(
        "WORK_PACKAGE_SYMLINK_ESCAPE",
        `Work package path traverses a symbolic link: ${cursor}`,
      );
    }
  }
}

/**
 * Paths are repository-relative, case-sensitive and must identify an
 * unambiguous file or directory scope. Symlinks are rejected separately when
 * the package is bound to a concrete repository checkout.
 */
export function normalizePackagePath(pathInput: string): string {
  if (
    typeof pathInput !== "string" ||
    pathInput.length === 0 ||
    pathInput.trim() !== pathInput ||
    pathInput.includes("\0")
  ) {
    fail(
      "INVALID_WORK_PACKAGE_PATH",
      "Path must be a non-empty, unpadded, NUL-free string",
    );
  }
  if (
    isAbsolute(pathInput) ||
    /^[A-Za-z]:/u.test(pathInput) ||
    pathInput.includes("\\")
  ) {
    fail(
      "INVALID_WORK_PACKAGE_PATH",
      `Absolute or ambiguous path is forbidden: ${pathInput}`,
    );
  }
  const segments = pathInput.split("/");
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    fail(
      "INVALID_WORK_PACKAGE_PATH",
      `Empty or traversal path segment is forbidden: ${pathInput}`,
    );
  }
  return pathInput;
}

function assertNoPathAmbiguity(
  authorizedFiles: readonly string[],
  prohibitedFiles: readonly string[],
): void {
  const all = [...authorizedFiles, ...prohibitedFiles];
  const folded = new Map<string, string>();
  for (const path of all) {
    const lower = path.toLowerCase();
    const previous = folded.get(lower);
    if (previous && previous !== path) {
      fail(
        "WORK_PACKAGE_CASE_COLLISION",
        `Case-colliding paths are forbidden: ${previous}, ${path}`,
      );
    }
    folded.set(lower, path);
  }

  for (let leftIndex = 0; leftIndex < all.length; leftIndex += 1) {
    const left = all[leftIndex];
    if (!left) continue;
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < all.length;
      rightIndex += 1
    ) {
      const right = all[rightIndex];
      if (!right) continue;
      if (
        left === right ||
        left.startsWith(`${right}/`) ||
        right.startsWith(`${left}/`)
      ) {
        fail(
          "WORK_PACKAGE_PATH_OVERLAP",
          `Overlapping or prefix-ambiguous paths are forbidden: ${left}, ${right}`,
        );
      }
    }
  }
}

export function validatePackagePathsAgainstRepository(
  repositoryRoot: string,
  paths: readonly string[],
): void {
  const root = realpathSync(repositoryRoot);
  assertNoSymlinkComponents(root);
  for (const path of paths) {
    const normalized = normalizePackagePath(path);
    const candidate = resolve(root, normalized);
    if (!isWithin(root, candidate)) {
      fail(
        "WORK_PACKAGE_REPOSITORY_ESCAPE",
        `Package path escapes repository root: ${path}`,
      );
    }
    assertNoSymlinkComponents(candidate);
  }
}

/**
 * Canonical JSON: UTF-8 when hashed, lexicographically sorted object keys,
 * preserved array order, and no semantic string or newline normalization.
 */
export function canonicalizeValue(value: unknown): string {
  const seen = new WeakSet<object>();

  function visit(current: unknown): string {
    if (current === null) return "null";
    if (typeof current === "string" || typeof current === "boolean") {
      return JSON.stringify(current);
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        fail(
          "INVALID_CANONICAL_JSON",
          "Non-finite numbers are forbidden in canonical JSON",
        );
      }
      return JSON.stringify(current);
    }
    if (
      typeof current === "undefined" ||
      typeof current === "function" ||
      typeof current === "symbol" ||
      typeof current === "bigint"
    ) {
      fail(
        "INVALID_CANONICAL_JSON",
        `Non-JSON value is forbidden: ${typeof current}`,
      );
    }
    if (typeof current !== "object") {
      fail("INVALID_CANONICAL_JSON", "Unsupported canonical JSON value");
    }
    if (seen.has(current)) {
      fail("INVALID_CANONICAL_JSON", "Cyclic values are forbidden");
    }
    seen.add(current);
    try {
      if (Array.isArray(current)) {
        return `[${current.map((item) => visit(item)).join(",")}]`;
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        fail("INVALID_CANONICAL_JSON", "Only plain JSON objects are supported");
      }
      if (Object.getOwnPropertySymbols(current).length > 0) {
        fail("INVALID_CANONICAL_JSON", "Symbol keys are forbidden");
      }
      const object = current as Record<string, unknown>;
      return `{${Object.keys(object)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${visit(object[key])}`)
        .join(",")}}`;
    } finally {
      seen.delete(current);
    }
  }

  return visit(value);
}

export function computeAuthorizedFilesHash(
  authorizedFiles: readonly string[],
): string {
  const normalized = authorizedFiles.map(normalizePackagePath);
  if (new Set(normalized).size !== normalized.length) {
    fail(
      "DUPLICATE_WORK_PACKAGE_PATH",
      "authorizedFiles contains duplicate paths",
    );
  }
  return createHash("sha256")
    .update(canonicalizeValue(normalized), "utf8")
    .digest("hex");
}

function parsePlanApprovalBinding(input: unknown): PlanApprovalBinding {
  if (!isRecord(input)) {
    fail(
      "INVALID_WORK_PACKAGE_SCHEMA",
      "planApprovalBinding must be an object",
    );
  }
  assertExactKeys(input, BINDING_KEYS, "planApprovalBinding");
  return Object.freeze({
    approvalEventId: requireString(
      input.approvalEventId,
      "planApprovalBinding.approvalEventId",
    ),
    approvalCommentId: requirePositiveInteger(
      input.approvalCommentId,
      "planApprovalBinding.approvalCommentId",
    ),
    approvalAuthorLogin: requireString(
      input.approvalAuthorLogin,
      "planApprovalBinding.approvalAuthorLogin",
    ),
    approvalCommentUpdatedAt: requireCanonicalUtc(
      input.approvalCommentUpdatedAt,
      "planApprovalBinding.approvalCommentUpdatedAt",
    ),
    expiresAt: requireCanonicalUtc(
      input.expiresAt,
      "planApprovalBinding.expiresAt",
    ),
    baseSha: requireGitSha(input.baseSha, "planApprovalBinding.baseSha"),
    planHash: requireHash(input.planHash, "planApprovalBinding.planHash"),
    sourceSnapshotHash: requireHash(
      input.sourceSnapshotHash,
      "planApprovalBinding.sourceSnapshotHash",
    ),
  });
}

function parseWorkPackage(
  input: unknown,
  requirePackageHash: boolean,
): WorkPackage {
  if (!isRecord(input)) {
    fail("INVALID_WORK_PACKAGE_SCHEMA", "Work package must be an object");
  }
  const expected = requirePackageHash
    ? [...PACKAGE_KEYS, "packageHash"]
    : PACKAGE_KEYS;
  assertExactKeys(input, expected, "work package");

  if (input.schemaVersion !== WORK_PACKAGE_SCHEMA_VERSION) {
    fail("INVALID_WORK_PACKAGE_SCHEMA", "Unsupported work package schema");
  }
  if (input.canonicalizationVersion !== WORK_PACKAGE_CANONICALIZATION_VERSION) {
    fail("INVALID_WORK_PACKAGE_SCHEMA", "Unsupported canonicalization version");
  }
  if (input.baseBranch !== "main") {
    fail("INVALID_WORK_PACKAGE_SCHEMA", "baseBranch must be main");
  }

  const authorizedFiles = requireStringArray(
    input.authorizedFiles,
    "authorizedFiles",
  ).map(normalizePackagePath);
  const prohibitedFiles = requireStringArray(
    input.prohibitedFiles,
    "prohibitedFiles",
  ).map(normalizePackagePath);
  assertNoPathAmbiguity(authorizedFiles, prohibitedFiles);

  const rawProfiles = requireStringArray(input.fixedProfiles, "fixedProfiles");
  if (
    rawProfiles.some(
      (profile) =>
        !(WORK_PACKAGE_PROFILES as readonly string[]).includes(profile),
    )
  ) {
    fail(
      "INVALID_WORK_PACKAGE_PROFILE",
      "fixedProfiles contains an unauthorized profile",
    );
  }
  const fixedProfiles = rawProfiles as readonly WorkPackageProfile[];
  const authorizedFilesHash = requireHash(
    input.authorizedFilesHash,
    "authorizedFilesHash",
  );
  if (authorizedFilesHash !== computeAuthorizedFilesHash(authorizedFiles)) {
    fail(
      "WORK_PACKAGE_AUTHORIZED_FILES_HASH_MISMATCH",
      "authorizedFilesHash does not match authorizedFiles",
    );
  }

  const result: WorkPackage = {
    schemaVersion: WORK_PACKAGE_SCHEMA_VERSION,
    canonicalizationVersion: WORK_PACKAGE_CANONICALIZATION_VERSION,
    repository: requireString(input.repository, "repository"),
    issueNumber: requirePositiveInteger(input.issueNumber, "issueNumber"),
    runId: requireString(input.runId, "runId"),
    idempotencyKey: requireHash(input.idempotencyKey, "idempotencyKey"),
    issueBodyHash: requireHash(input.issueBodyHash, "issueBodyHash"),
    sourceSnapshotHash: requireHash(
      input.sourceSnapshotHash,
      "sourceSnapshotHash",
    ),
    planHash: requireHash(input.planHash, "planHash"),
    baseBranch: "main",
    baseSha: requireGitSha(input.baseSha, "baseSha"),
    targetBranch: normalizePackagePath(
      requireString(input.targetBranch, "targetBranch"),
    ),
    targetHeadSha: requireGitSha(input.targetHeadSha, "targetHeadSha"),
    targetWorktreeId: requireString(input.targetWorktreeId, "targetWorktreeId"),
    worktreePath: requireString(input.worktreePath, "worktreePath"),
    authorizedFiles: Object.freeze([...authorizedFiles]),
    prohibitedFiles: Object.freeze([...prohibitedFiles]),
    authorizedFilesHash,
    fixedProfiles: Object.freeze([...fixedProfiles]),
    requiredSkills: Object.freeze([
      ...requireStringArray(input.requiredSkills, "requiredSkills"),
    ]),
    acceptanceCriteria: Object.freeze([
      ...requireStringArray(input.acceptanceCriteria, "acceptanceCriteria"),
    ]),
    planApprovalBinding: parsePlanApprovalBinding(input.planApprovalBinding),
    createdAt: requireCanonicalUtc(input.createdAt, "createdAt"),
    ...(requirePackageHash
      ? { packageHash: requireHash(input.packageHash, "packageHash") }
      : {}),
  };

  if (
    result.planApprovalBinding.planHash !== result.planHash ||
    result.planApprovalBinding.sourceSnapshotHash !==
      result.sourceSnapshotHash ||
    result.planApprovalBinding.baseSha !== result.baseSha
  ) {
    fail(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "PLAN_APPROVED binding does not match package inputs",
    );
  }
  if (result.targetHeadSha !== result.baseSha) {
    fail(
      "WORK_PACKAGE_BINDING_MISMATCH",
      "Initial targetHeadSha must equal the exact authorized baseSha",
    );
  }
  return result;
}

export function canonicalizeWorkPackage(pkg: WorkPackage): string {
  const parsed = parseWorkPackage(
    Object.fromEntries(
      Object.entries(pkg).filter(([key]) => key !== "packageHash"),
    ),
    false,
  );
  return canonicalizeValue(parsed);
}

export function computePackageHash(pkg: WorkPackage): string {
  return createHash("sha256")
    .update(canonicalizeWorkPackage(pkg), "utf8")
    .digest("hex");
}

export function createWorkPackage(
  input: Omit<WorkPackage, "packageHash">,
): WorkPackage & { readonly packageHash: string } {
  const parsed = parseWorkPackage(input, false);
  const packageHash = computePackageHash(parsed);
  return Object.freeze({ ...parsed, packageHash });
}

export function validateWorkPackage(
  pkg: WorkPackage,
  runSnapshot: RunSnapshotInput,
): void {
  const parsed = parseWorkPackage(pkg, true);
  if (parsed.packageHash !== computePackageHash(parsed)) {
    fail(
      "WORK_PACKAGE_HASH_MISMATCH",
      "packageHash does not reproduce the canonical package",
    );
  }
  const bindings: readonly [keyof RunSnapshotInput, unknown][] = [
    ["repository", parsed.repository],
    ["issueNumber", parsed.issueNumber],
    ["runId", parsed.runId],
    ["idempotencyKey", parsed.idempotencyKey],
    ["sourceSnapshotHash", parsed.sourceSnapshotHash],
    ["issueBodyHash", parsed.issueBodyHash],
    ["planHash", parsed.planHash],
    ["baseSha", parsed.baseSha],
    ["targetBranch", parsed.targetBranch],
    ["targetHeadSha", parsed.targetHeadSha],
    ["targetWorktreeId", parsed.targetWorktreeId],
    ["worktreePath", parsed.worktreePath],
    ["authorizedFilesHash", parsed.authorizedFilesHash],
  ];
  for (const [field, observed] of bindings) {
    if (runSnapshot[field] !== observed) {
      fail(
        "WORK_PACKAGE_BINDING_MISMATCH",
        `${field} does not match the run snapshot`,
      );
    }
  }
}

export function persistWorkPackage(input: PersistWorkPackageInput): string {
  const runtime = resolve(input.runtimeDirectory);
  const repository = realpathSync(input.repositoryRoot);
  const worktree = realpathSync(input.worktreePath);
  if (
    isWithin(repository, runtime) ||
    isWithin(worktree, runtime) ||
    isWithin(runtime, repository) ||
    isWithin(runtime, worktree)
  ) {
    fail(
      "UNSAFE_WORK_PACKAGE_STORAGE",
      "Runtime, repository and worktree roots must be disjoint",
    );
  }
  assertNoSymlinkComponents(runtime);
  validatePackagePathsAgainstRepository(repository, [
    ...input.workPackage.authorizedFiles,
    ...input.workPackage.prohibitedFiles,
  ]);

  const packageDirectory = join(
    runtime,
    "tasks",
    String(input.workPackage.issueNumber),
    input.workPackage.runId,
  );
  assertNoSymlinkComponents(dirname(packageDirectory));
  mkdirSync(packageDirectory, { recursive: true, mode: 0o700 });
  assertNoSymlinkComponents(packageDirectory);
  const packagePath = join(packageDirectory, "work-package.json");
  const serialized = `${canonicalizeValue(input.workPackage)}\n`;
  let descriptor: number | undefined;
  try {
    descriptor = openSync(packagePath, "wx", 0o600);
    writeFileSync(descriptor, serialized, { encoding: "utf8" });
    fsyncSync(descriptor);
  } catch (error) {
    fail(
      "WORK_PACKAGE_IMMUTABILITY_VIOLATION",
      `Work package already exists or could not be persisted: ${String(error)}`,
    );
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
  chmodSync(packagePath, 0o400);

  const persisted = JSON.parse(readFileSync(packagePath, "utf8")) as unknown;
  const parsed = parseWorkPackage(persisted, true);
  if (parsed.packageHash !== input.workPackage.packageHash) {
    fail(
      "WORK_PACKAGE_AT_REST_MISMATCH",
      "Persisted package hash differs from the dispatched package",
    );
  }
  return packagePath;
}

export function loadAndValidatePersistedWorkPackage(
  packagePath: string,
  runSnapshot: RunSnapshotInput,
): WorkPackage & { readonly packageHash: string } {
  assertNoSymlinkComponents(packagePath);
  const parsed = parseWorkPackage(
    JSON.parse(readFileSync(packagePath, "utf8")) as unknown,
    true,
  ) as WorkPackage & { readonly packageHash: string };
  validateWorkPackage(parsed, runSnapshot);
  return Object.freeze(parsed);
}
