import { createHash } from "node:crypto";
import {
  executeGitHubRead,
  type TrustedExecutionContext,
} from "./trusted-process.ts";
import { existsSync, realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { GIT_SHA_PATTERN, isRecord } from "./contracts.ts";
import { OrchestratorError } from "./errors.ts";

const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;

export interface GitHubIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly state: "OPEN" | "CLOSED";
}

export interface GitHubPullRequest {
  readonly number: number;
  readonly headSha: string;
  readonly baseSha: string;
  readonly state: "OPEN" | "CLOSED" | "MERGED";
}

export interface GitHubReadOnlyConfig {
  readonly repository: string;
  readonly ghConfigDirectory: string;
  readonly ghExecutablePath?: string;
}

export type GitHubApiResource =
  | Readonly<{ kind: "issue"; number: number }>
  | Readonly<{ kind: "pull"; number: number }>
  | Readonly<{ kind: "check-runs"; commitSha: string }>;

function fail(code: string, message: string): never {
  throw new OrchestratorError(code, message);
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail("INVALID_GITHUB_RESOURCE", `${label} must be a positive integer`);
  }
  return value;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail("MALFORMED_GITHUB_OUTPUT", `${label} contains unexpected fields`);
  }
}

function stringField(record: Record<string, unknown>, field: string): string {
  const value = record[field];
  if (typeof value !== "string") {
    fail("MALFORMED_GITHUB_OUTPUT", `${field} must be a string`);
  }
  return value;
}

export class GitHubReadOnlyAdapter {
  readonly #repository: string;
  readonly #ghConfigDirectory: string;
  constructor(config: GitHubReadOnlyConfig) {
    if (!REPOSITORY_PATTERN.test(config.repository)) {
      fail("INVALID_GITHUB_CONFIG", "Repository must use owner/name form");
    }
    if (
      !isAbsolute(config.ghConfigDirectory) ||
      !existsSync(config.ghConfigDirectory)
    ) {
      fail(
        "INVALID_GITHUB_CONFIG",
        "GH_CONFIG_DIR must be an existing absolute directory",
      );
    }
    this.#repository = config.repository;
    this.#ghConfigDirectory = realpathSync(config.ghConfigDirectory);
  }

  getIssue(context: TrustedExecutionContext, issueNumber: number): GitHubIssue {
    const number = requirePositiveInteger(issueNumber, "issueNumber");
    const output = executeGitHubRead(
      context,
      { kind: "issue-view", number },
      this.#ghConfigDirectory,
    );
    const parsed = JSON.parse(output) as unknown;
    if (!isRecord(parsed)) {
      fail("MALFORMED_GITHUB_OUTPUT", "Issue output must be an object");
    }
    exactKeys(parsed, ["number", "title", "body", "state"], "issue");
    if (parsed.number !== number) {
      fail(
        "GITHUB_RESOURCE_MISMATCH",
        "GitHub returned a different issue number",
      );
    }
    const state = stringField(parsed, "state");
    if (state !== "OPEN" && state !== "CLOSED") {
      fail("MALFORMED_GITHUB_OUTPUT", "Issue state is invalid");
    }
    return Object.freeze({
      number,
      title: stringField(parsed, "title"),
      body: stringField(parsed, "body"),
      state,
    });
  }

  getExactIssueBody(
    context: TrustedExecutionContext,
    issueNumber: number,
  ): string {
    return this.getIssue(context, issueNumber).body;
  }

  computeIssueBodyHash(
    context: TrustedExecutionContext,
    issueNumber: number,
  ): string {
    return createHash("sha256")
      .update(this.getExactIssueBody(context, issueNumber), "utf8")
      .digest("hex");
  }

  getPullRequest(
    context: TrustedExecutionContext,
    prNumber: number,
  ): GitHubPullRequest {
    const number = requirePositiveInteger(prNumber, "prNumber");
    const output = executeGitHubRead(
      context,
      { kind: "pr-view", number },
      this.#ghConfigDirectory,
    );
    const parsed = JSON.parse(output) as unknown;
    if (!isRecord(parsed)) {
      fail("MALFORMED_GITHUB_OUTPUT", "Pull request output must be an object");
    }
    exactKeys(
      parsed,
      ["number", "headRefOid", "baseRefOid", "state"],
      "pull request",
    );
    if (parsed.number !== number) {
      fail(
        "GITHUB_RESOURCE_MISMATCH",
        "GitHub returned a different pull request number",
      );
    }
    const headSha = stringField(parsed, "headRefOid");
    const baseSha = stringField(parsed, "baseRefOid");
    if (!GIT_SHA_PATTERN.test(headSha) || !GIT_SHA_PATTERN.test(baseSha)) {
      fail("MALFORMED_GITHUB_OUTPUT", "Pull request SHA is invalid");
    }
    const state = stringField(parsed, "state");
    if (!["OPEN", "CLOSED", "MERGED"].includes(state)) {
      fail("MALFORMED_GITHUB_OUTPUT", "Pull request state is invalid");
    }
    return Object.freeze({
      number,
      headSha,
      baseSha,
      state: state as GitHubPullRequest["state"],
    });
  }

  apiGet(
    context: TrustedExecutionContext,
    resource: GitHubApiResource,
  ): unknown {
    let output: string;
    if (resource.kind === "issue") {
      const number = requirePositiveInteger(resource.number, "issueNumber");
      output = executeGitHubRead(
        context,
        { kind: "api-issue", number },
        this.#ghConfigDirectory,
      );
    } else if (resource.kind === "pull") {
      const number = requirePositiveInteger(resource.number, "prNumber");
      output = executeGitHubRead(
        context,
        { kind: "api-pull", number },
        this.#ghConfigDirectory,
      );
    } else {
      if (!GIT_SHA_PATTERN.test(resource.commitSha)) {
        fail("INVALID_GITHUB_RESOURCE", "commitSha is invalid");
      }
      output = executeGitHubRead(
        context,
        { kind: "api-commit-check-runs", commitSha: resource.commitSha },
        this.#ghConfigDirectory,
      );
    }
    return JSON.parse(output) as unknown;
  }
}
