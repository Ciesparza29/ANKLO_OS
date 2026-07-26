import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { OrchestratorError } from "./errors.ts";
import { type GitEvidence, type WorktreeManager } from "./worktree.ts";

export type CodexReviewDecision =
  "APPROVE" | "REQUEST_CHANGES" | "BLOCKED" | "NOT_VERIFIABLE";

export interface CodexReviewResult {
  readonly decision: CodexReviewDecision;
  readonly summary: string;
  readonly findings: readonly string[];
  readonly timestamp: string;
}

export interface CodexExecConfig {
  readonly codexBinary: string;
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;
}

export class CodexReadOnlyAdapter {
  readonly #config: CodexExecConfig;
  readonly #worktreeManager: WorktreeManager;

  constructor(
    worktreeManager: WorktreeManager,
    config?: Partial<CodexExecConfig>,
  ) {
    this.#worktreeManager = worktreeManager;
    this.#config = {
      codexBinary: config?.codexBinary || "codex",
      timeoutMs: config?.timeoutMs || 300000,
      maxOutputBytes: config?.maxOutputBytes || 5 * 1024 * 1024,
    };
  }

  /**
   * Invokes Codex in read-only non-interactive exec mode.
   * Enforces ephemeral session, disabled MCP, explicit directory, and JSON output schema.
   * Verifies git evidence before and after to ensure zero mutation occurred.
   */
  reviewWorktree(
    worktreePath: string,
    expectedBaseSha: string,
    prompt: string,
  ): {
    readonly result: CodexReviewResult;
    readonly beforeEvidence: GitEvidence;
    readonly afterEvidence: GitEvidence;
  } {
    if (!existsSync(worktreePath)) {
      throw new OrchestratorError(
        "UNAUTHORIZED_WORKTREE",
        `Worktree directory does not exist: ${worktreePath}`,
      );
    }

    const beforeEvidence = this.#worktreeManager.validateWorktreeAccess(
      worktreePath,
      expectedBaseSha,
    );

    const args = [
      "exec",
      "--sandbox",
      "read-only",
      "--no-mcp",
      "--ephemeral",
      "--json",
      prompt,
    ];

    const res = spawnSync(this.#config.codexBinary, args, {
      cwd: worktreePath,
      timeout: this.#config.timeoutMs,
      maxBuffer: this.#config.maxOutputBytes,
      encoding: "utf8",
      shell: false,
    });

    const afterEvidence = this.#worktreeManager.validateWorktreeAccess(
      worktreePath,
      expectedBaseSha,
    );

    if (
      afterEvidence.headSha !== beforeEvidence.headSha ||
      !afterEvidence.isClean
    ) {
      throw new OrchestratorError(
        "CODEX_MUTATION_DETECTED",
        "Codex read-only sandbox violation: worktree git state or clean status was altered during review",
      );
    }

    let result: CodexReviewResult;
    try {
      if (res.status !== 0 && !res.stdout.trim()) {
        throw new Error(res.stderr || `Codex exited with status ${res.status}`);
      }
      const parsed = JSON.parse(res.stdout.trim()) as Record<string, unknown>;
      const validDecisions: CodexReviewDecision[] = [
        "APPROVE",
        "REQUEST_CHANGES",
        "BLOCKED",
        "NOT_VERIFIABLE",
      ];
      const dec =
        typeof parsed.decision === "string"
          ? (parsed.decision as CodexReviewDecision)
          : "NOT_VERIFIABLE";
      const decision: CodexReviewDecision = validDecisions.includes(dec)
        ? dec
        : "NOT_VERIFIABLE";

      result = {
        decision,
        summary:
          typeof parsed.summary === "string"
            ? parsed.summary
            : "No summary provided by Codex",
        findings: Array.isArray(parsed.findings)
          ? parsed.findings.map((f) => String(f))
          : [],
        timestamp: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result = {
        decision: "NOT_VERIFIABLE",
        summary: "Failed to parse structured JSON output from Codex",
        findings: [msg, res.stderr || ""].filter(Boolean),
        timestamp: new Date().toISOString(),
      };
    }

    return { result, beforeEvidence, afterEvidence };
  }

  // Strictly prohibited mutating or authoritative methods per ADR-0010 Section 11
  approvePlan(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "Codex has no authority to approve requirements or implementation plans",
    );
  }

  commit(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "Codex read-only adapter forbids git commit",
    );
  }

  push(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "Codex read-only adapter forbids git push",
    );
  }

  merge(): never {
    throw new OrchestratorError(
      "READ_ONLY_ADAPTER_VIOLATION",
      "Codex read-only adapter forbids git merge",
    );
  }
}
