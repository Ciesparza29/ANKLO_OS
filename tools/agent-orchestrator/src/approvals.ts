import { OrchestratorError } from "./errors.ts";
import {
  GIT_SHA_PATTERN,
  SHA256_PATTERN,
  isRecord,
  SCHEMA_VERSION,
} from "./contracts.ts";

export const APPROVAL_KINDS = [
  "PLAN_APPROVED",
  "IMPLEMENT_APPROVED",
  "PUSH_APPROVED",
  "MERGE_APPROVED",
] as const;

export type ApprovalKind = (typeof APPROVAL_KINDS)[number];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;

const COMMON_FIELDS = [
  "schema_version",
  "approval_kind",
  "repository",
  "issue_number",
  "expires_at",
  "approval_event_id",
  "nonce",
] as const;

const SPECIFIC_FIELDS: Readonly<Record<ApprovalKind, readonly string[]>> = {
  PLAN_APPROVED: ["base_sha", "plan_hash", "source_snapshot_hash"],
  IMPLEMENT_APPROVED: [
    "target_branch",
    "target_worktree_id",
    "target_head_sha",
    "authorized_files_hash",
    "package_hash",
  ],
  PUSH_APPROVED: [
    "target_repository",
    "target_remote",
    "target_branch",
    "target_head_sha",
    "package_hash",
  ],
  MERGE_APPROVED: ["pull_request_number", "pull_request_head_sha"],
};

export type ApprovalBody = Readonly<Record<string, string | number>> &
  Readonly<{
    schema_version: typeof SCHEMA_VERSION;
    approval_kind: ApprovalKind;
    repository: string;
    issue_number: number;
    expires_at: string;
    approval_event_id: string;
    nonce: string;
  }>;

export type ObservedApproval = Readonly<{
  body: ApprovalBody;
  approval_comment_id: number;
  approval_author_login: string;
  approval_comment_created_at: string;
  approval_comment_updated_at: string;
}>;

function requireString(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      `${field} must be a non-empty string`,
    );
  }
  return value;
}

function requireInteger(
  record: Record<string, unknown>,
  field: string,
): number {
  const value = record[field];
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      `${field} must be a positive integer`,
    );
  }
  return Number(value);
}

function requireIsoDate(
  record: Record<string, unknown>,
  field: string,
): string {
  const value = requireString(record, field);
  if (!ISO_UTC_PATTERN.test(value)) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      `${field} must be an ISO-8601 UTC timestamp`,
    );
  }

  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch)) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      `${field} must represent a real UTC instant`,
    );
  }

  const canonical = new Date(epoch).toISOString();
  const normalizedInput = value.includes(".")
    ? value
    : value.replace(/Z$/u, ".000Z");
  if (canonical !== normalizedInput) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      `${field} must be a canonical UTC timestamp`,
    );
  }
  return value;
}

function requirePattern(
  record: Record<string, unknown>,
  field: string,
  pattern: RegExp,
): string {
  const value = requireString(record, field);
  if (!pattern.test(value)) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      `${field} has an invalid format`,
    );
  }
  return value;
}

function isApprovalKind(value: unknown): value is ApprovalKind {
  return (
    typeof value === "string" &&
    (APPROVAL_KINDS as readonly string[]).includes(value)
  );
}

export function parseApprovalBody(input: unknown): ApprovalBody {
  if (!isRecord(input)) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      "Approval body must be a structured object",
    );
  }
  if (!isApprovalKind(input.approval_kind)) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      "approval_kind is not supported",
    );
  }

  const approvalKind = input.approval_kind;
  const expected = [...COMMON_FIELDS, ...SPECIFIC_FIELDS[approvalKind]].sort();
  const actual = Object.keys(input).sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      "Approval fields do not match the approval_kind schema",
      { details: { actual, expected, approvalKind } },
    );
  }

  if (input.schema_version !== SCHEMA_VERSION) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      "Unsupported approval schema version",
    );
  }

  const normalized: Record<string, string | number> = {
    schema_version: SCHEMA_VERSION,
    approval_kind: approvalKind,
    repository: requireString(input, "repository"),
    issue_number: requireInteger(input, "issue_number"),
    expires_at: requireIsoDate(input, "expires_at"),
    approval_event_id: requirePattern(input, "approval_event_id", UUID_PATTERN),
    nonce: requirePattern(input, "nonce", UUID_PATTERN),
  };

  for (const field of SPECIFIC_FIELDS[approvalKind]) {
    if (field === "pull_request_number") {
      normalized[field] = requireInteger(input, field);
    } else if (field.endsWith("_sha") || field === "pull_request_head_sha") {
      normalized[field] = requirePattern(input, field, GIT_SHA_PATTERN);
    } else if (field.endsWith("_hash")) {
      normalized[field] = requirePattern(input, field, SHA256_PATTERN);
    } else {
      normalized[field] = requireString(input, field);
    }
  }

  if (
    approvalKind === "PUSH_APPROVED" &&
    normalized.repository !== normalized.target_repository
  ) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      "PUSH_APPROVED requires repository == target_repository",
    );
  }

  return Object.freeze(normalized) as ApprovalBody;
}

export function validateObservedApproval(
  input: unknown,
  context: Readonly<{
    repository: string;
    issueNumber: number;
    approvedActors: readonly string[];
    orchestratorActor: string;
    now?: Date;
  }>,
): ObservedApproval {
  if (!isRecord(input)) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      "Observed approval must be an object",
    );
  }
  const expected = [
    "body",
    "approval_comment_id",
    "approval_author_login",
    "approval_comment_created_at",
    "approval_comment_updated_at",
  ].sort();
  const actual = Object.keys(input).sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new OrchestratorError(
      "INVALID_APPROVAL",
      "Observed approval has invalid fields",
      { details: { actual, expected } },
    );
  }

  const body = parseApprovalBody(input.body);
  const commentId = requireInteger(input, "approval_comment_id");
  const author = requireString(input, "approval_author_login");
  const createdAt = requireIsoDate(input, "approval_comment_created_at");
  const updatedAt = requireIsoDate(input, "approval_comment_updated_at");

  if (body.repository !== context.repository) {
    throw new OrchestratorError(
      "APPROVAL_CONTEXT_MISMATCH",
      "Approval repository does not match the execution context",
    );
  }
  if (body.issue_number !== context.issueNumber) {
    throw new OrchestratorError(
      "APPROVAL_CONTEXT_MISMATCH",
      "Approval issue does not match the execution context",
    );
  }
  if (!context.approvedActors.includes(author)) {
    throw new OrchestratorError(
      "APPROVAL_ACTOR_DENIED",
      "Approval author is not allowlisted",
    );
  }
  if (author === context.orchestratorActor) {
    throw new OrchestratorError(
      "APPROVAL_ACTOR_DENIED",
      "The orchestrator cannot approve its own effects",
    );
  }
  if (createdAt !== updatedAt) {
    throw new OrchestratorError(
      "APPROVAL_EDITED",
      "Initial approval must be unedited",
    );
  }

  const now = (context.now ?? new Date()).getTime();
  if (!Number.isFinite(now)) {
    throw new OrchestratorError(
      "INVALID_TIME_SOURCE",
      "Approval validation requires a valid time source",
    );
  }
  const expiresAt = Date.parse(body.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    throw new OrchestratorError("APPROVAL_EXPIRED", "Approval has expired");
  }

  return Object.freeze({
    body,
    approval_comment_id: commentId,
    approval_author_login: author,
    approval_comment_created_at: createdAt,
    approval_comment_updated_at: updatedAt,
  });
}
