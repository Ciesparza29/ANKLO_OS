import { createHash } from "node:crypto";
import { OrchestratorError } from "./errors.ts";

export interface GitHubIssue {
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly state: "open" | "closed";
}

export interface GitHubPullRequest {
  readonly number: number;
  readonly headSha: string;
  readonly baseSha: string;
  readonly state: "open" | "closed" | "merged";
}

export interface GitHubReadOnlyClient {
  fetchIssue(number: number): GitHubIssue;
  fetchPullRequest(number: number): GitHubPullRequest;
}

export class GitHubReadOnlyAdapter {
  readonly #client: GitHubReadOnlyClient;

  constructor(client: GitHubReadOnlyClient) {
    this.#client = client;
  }

  getIssue(issueNumber: number): GitHubIssue {
    return this.#client.fetchIssue(issueNumber);
  }

  getExactIssueBody(issueNumber: number): string {
    const issue = this.getIssue(issueNumber);
    return issue.body;
  }

  /**
   * Computes SHA-256 hex hash of the exact UTF-8 issue body per ADR-0010 Section 8.
   */
  computeIssueBodyHash(issueNumber: number): string {
    const body = this.getExactIssueBody(issueNumber);
    return createHash("sha256").update(body, "utf8").digest("hex");
  }

  getPullRequestStatus(prNumber: number): GitHubPullRequest {
    return this.#client.fetchPullRequest(prNumber);
  }

  // Prohibited mutating methods explicitly defined to throw read-only violation errors
  push(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "GitHub adapter is strictly read-only: git push is forbidden",
    );
  }

  createPullRequest(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "GitHub adapter is strictly read-only: PR creation is forbidden",
    );
  }

  modifyPullRequest(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "GitHub adapter is strictly read-only: PR modification is forbidden",
    );
  }

  mergePullRequest(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "GitHub adapter is strictly read-only: PR merge is forbidden",
    );
  }

  createComment(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "GitHub adapter is strictly read-only: comment creation is forbidden",
    );
  }

  modifyIssue(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "GitHub adapter is strictly read-only: issue modification is forbidden",
    );
  }

  closeIssue(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "GitHub adapter is strictly read-only: closing issues is forbidden",
    );
  }
}
