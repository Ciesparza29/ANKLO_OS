import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { GIT_SHA_PATTERN, isRecord } from "./contracts.ts";
import { OrchestratorError } from "./errors.ts";

const GH_EXECUTABLE = "gh";
const GH_HOST = "github.com";
const GH_TIMEOUT_MS = 30_000;
const GH_MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
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

  #environment(): NodeJS.ProcessEnv {
    return {
      PATH: process.env.PATH ?? "/usr/bin:/bin",
      HOME: "/nonexistent",
      XDG_CONFIG_HOME: "/nonexistent",
      LANG: "C",
      LC_ALL: "C",
      GH_CONFIG_DIR: this.#ghConfigDirectory,
      GH_HOST,
      GH_PROMPT_DISABLED: "1",
      NO_COLOR: "1",
    };
  }

  #run(args: readonly string[]): string {
    const result = spawnSync(GH_EXECUTABLE, args, {
      cwd: this.#ghConfigDirectory,
      encoding: "utf8",
      env: this.#environment(),
      timeout: GH_TIMEOUT_MS,
      maxBuffer: GH_MAX_OUTPUT_BYTES,
      shell: false,
      windowsHide: true,
    });
    if (result.error) {
      fail(
        "GITHUB_READ_FAILED",
        `GitHub read could not complete: ${result.error.message}`,
      );
    }
    if (result.status !== 0) {
      fail(
        "GITHUB_READ_FAILED",
        `GitHub read failed with exit code ${String(result.status)}`,
      );
    }
    return result.stdout;
  }

  getIssue(issueNumber: number): GitHubIssue {
    const number = requirePositiveInteger(issueNumber, "issueNumber");
    const output = this.#run([
      "issue",
      "view",
      String(number),
      "--repo",
      this.#repository,
      "--json",
      "number,title,body,state",
    ]);
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

  getExactIssueBody(issueNumber: number): string {
    return this.getIssue(issueNumber).body;
  }

  computeIssueBodyHash(issueNumber: number): string {
    return createHash("sha256")
      .update(this.getExactIssueBody(issueNumber), "utf8")
      .digest("hex");
  }

  getPullRequest(prNumber: number): GitHubPullRequest {
    const number = requirePositiveInteger(prNumber, "prNumber");
    const output = this.#run([
      "pr",
      "view",
      String(number),
      "--repo",
      this.#repository,
      "--json",
      "number,headRefOid,baseRefOid,state",
    ]);
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

  apiGet(resource: GitHubApiResource): unknown {
    let endpoint: string;
    if (resource.kind === "issue") {
      endpoint = `repos/${this.#repository}/issues/${requirePositiveInteger(
        resource.number,
        "issueNumber",
      )}`;
    } else if (resource.kind === "pull") {
      endpoint = `repos/${this.#repository}/pulls/${requirePositiveInteger(
        resource.number,
        "prNumber",
      )}`;
    } else {
      if (!GIT_SHA_PATTERN.test(resource.commitSha)) {
        fail("INVALID_GITHUB_RESOURCE", "commitSha is invalid");
      }
      endpoint = `repos/${this.#repository}/commits/${resource.commitSha}/check-runs`;
    }
    const output = this.#run([
      "api",
      "--method",
      "GET",
      "--hostname",
      GH_HOST,
      endpoint,
    ]);
    return JSON.parse(output) as unknown;
  }
}
