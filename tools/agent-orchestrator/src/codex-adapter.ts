import { runCodexCommand } from "./trusted-process.ts";
import { existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";
import { isRecord } from "./contracts.ts";
import { OrchestratorError } from "./errors.ts";
import { type GitEvidence, type WorktreeManager } from "./worktree.ts";

const CODEX_EXECUTABLE = "codex";
const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

export type CodexReviewDecision =
  "APPROVE" | "REQUEST_CHANGES" | "BLOCKED" | "NOT_VERIFIABLE";

export interface CodexReviewResult {
  readonly decision: CodexReviewDecision;
  readonly summary: string;
  readonly findings: readonly string[];
  readonly timestamp: string;
}

export interface CodexReadOnlyConfig {
  readonly runtimeDirectory: string;
  readonly outputSchemaPath: string;
  readonly codexExecutablePath?: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
}

export interface CodexReviewExecution {
  readonly result: CodexReviewResult;
  readonly beforeEvidence: GitEvidence;
  readonly afterEvidence: GitEvidence;
  readonly stderr: string;
}

function fail(code: string, message: string): never {
  throw new OrchestratorError(code, message);
}

function isWithin(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

function sanitizeDiagnostic(value: string): string {
  const sanitized = value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/gu, "[REDACTED]")
    .replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/gu, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/gu, "[REDACTED]");
  return sanitized;
}

function exactKeys(
  object: Record<string, unknown>,
  expected: readonly string[],
): void {
  const actual = Object.keys(object).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail(
      "MALFORMED_CODEX_OUTPUT",
      "Codex result contains missing or unknown fields",
    );
  }
}

export function parseCodexJsonLines(output: string): CodexReviewResult {
  const messages: string[] = [];
  const lines = output.split("\n").filter((line) => line.length > 0);
  if (lines.length === 0) {
    fail("MALFORMED_CODEX_OUTPUT", "Codex returned no JSONL events");
  }
  for (const line of lines) {
    let event: unknown;
    try {
      event = JSON.parse(line) as unknown;
    } catch {
      fail("MALFORMED_CODEX_OUTPUT", "Codex emitted non-JSON trailing text");
    }
    if (!isRecord(event)) {
      fail("MALFORMED_CODEX_OUTPUT", "Codex JSONL event must be an object");
    }
    if (event.type !== "item.completed") continue;
    if (!isRecord(event.item) || event.item.type !== "agent_message") continue;
    if (typeof event.item.text !== "string") {
      fail("MALFORMED_CODEX_OUTPUT", "Codex agent message text is invalid");
    }
    messages.push(event.item.text);
  }
  if (messages.length !== 1) {
    fail(
      "MALFORMED_CODEX_OUTPUT",
      "Codex must emit exactly one final agent_message result",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(messages[0] ?? "") as unknown;
  } catch {
    fail(
      "MALFORMED_CODEX_OUTPUT",
      "Codex final agent_message is not the required JSON result",
    );
  }
  if (!isRecord(parsed)) {
    fail("MALFORMED_CODEX_OUTPUT", "Codex result must be an object");
  }
  exactKeys(parsed, ["decision", "summary", "findings"]);
  const decisions: readonly CodexReviewDecision[] = [
    "APPROVE",
    "REQUEST_CHANGES",
    "BLOCKED",
    "NOT_VERIFIABLE",
  ];
  if (
    typeof parsed.decision !== "string" ||
    !decisions.includes(parsed.decision as CodexReviewDecision)
  ) {
    fail("MALFORMED_CODEX_OUTPUT", "Codex decision is invalid");
  }
  if (typeof parsed.summary !== "string" || parsed.summary.length === 0) {
    fail("MALFORMED_CODEX_OUTPUT", "Codex summary is invalid");
  }
  if (
    !Array.isArray(parsed.findings) ||
    parsed.findings.some((finding) => typeof finding !== "string")
  ) {
    fail("MALFORMED_CODEX_OUTPUT", "Codex findings are invalid");
  }
  return Object.freeze({
    decision: parsed.decision as CodexReviewDecision,
    summary: parsed.summary,
    findings: Object.freeze([...parsed.findings] as string[]),
    timestamp: new Date().toISOString(),
  });
}

export class CodexReadOnlyAdapter {
  readonly #worktreeManager: WorktreeManager;
  readonly #codexHome: string;
  readonly #outputSchemaPath: string;
  readonly #codexExecutablePath: string;
  readonly #timeoutMs: number;
  readonly #maxOutputBytes: number;

  constructor(worktreeManager: WorktreeManager, config: CodexReadOnlyConfig) {
    if (!isAbsolute(config.runtimeDirectory)) {
      fail("INVALID_CODEX_CONFIG", "Runtime directory must be absolute");
    }
    mkdirSync(config.runtimeDirectory, { recursive: true, mode: 0o700 });
    this.#codexHome = realpathSync(config.runtimeDirectory);
    if (
      !isAbsolute(config.outputSchemaPath) ||
      !existsSync(config.outputSchemaPath)
    ) {
      fail(
        "INVALID_CODEX_CONFIG",
        "Output schema must be an existing absolute path",
      );
    }
    this.#outputSchemaPath = realpathSync(config.outputSchemaPath);
    this.#codexExecutablePath = config.codexExecutablePath ?? CODEX_EXECUTABLE;
    if (!lstatSync(this.#outputSchemaPath).isFile()) {
      fail("INVALID_CODEX_CONFIG", "Output schema must be a regular file");
    }
    this.#timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.#maxOutputBytes = config.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    if (
      !Number.isSafeInteger(this.#timeoutMs) ||
      this.#timeoutMs <= 0 ||
      this.#timeoutMs > 900_000 ||
      !Number.isSafeInteger(this.#maxOutputBytes) ||
      this.#maxOutputBytes <= 0 ||
      this.#maxOutputBytes > 20 * 1024 * 1024
    ) {
      fail("INVALID_CODEX_CONFIG", "Codex resource limits are invalid");
    }
    this.#worktreeManager = worktreeManager;
  }

  async reviewWorktree(
    worktreePath: string,
    expectedHeadSha: string,
    prompt: string,
  ): Promise<CodexReviewExecution> {
    if (
      typeof prompt !== "string" ||
      prompt.length === 0 ||
      prompt.length > 200_000 ||
      prompt.includes("\0")
    ) {
      fail("INVALID_CODEX_PROMPT", "Codex prompt is invalid");
    }
    const beforeEvidence = this.#worktreeManager.validateWorktreeAccess(
      worktreePath,
      expectedHeadSha,
    );
    if (
      isWithin(beforeEvidence.worktreePath, this.#codexHome) ||
      isWithin(this.#codexHome, beforeEvidence.worktreePath)
    ) {
      fail(
        "INVALID_CODEX_CONFIG",
        "Codex runtime and worktree must be disjoint",
      );
    }
    const args = Object.freeze([
      "exec",
      "--ignore-user-config",
      "--strict-config",
      "-c",
      "mcp_servers={}",
      "--sandbox",
      "read-only",
      "--ephemeral",
      "--json",
      "--output-schema",
      this.#outputSchemaPath,
      "--cd",
      beforeEvidence.worktreePath,
      prompt,
    ]);

    const rawExecution = await runCodexCommand({
      binaryPath: this.#codexExecutablePath,
      vector: args,
      directory: beforeEvidence.worktreePath,
      runtimeDirectory: this.#codexHome,
      timeoutMs: this.#timeoutMs,
      maxOutputBytes: this.#maxOutputBytes,
    });

    const execution = Object.freeze({
      ...rawExecution,
      stderr: sanitizeDiagnostic(
        rawExecution.spawnError
          ? `${rawExecution.stderr}\n${rawExecution.spawnError.message}`
          : rawExecution.stderr,
      ),
    });

    const afterEvidence = this.#worktreeManager.validateWorktreeAccess(
      worktreePath,
      expectedHeadSha,
    );
    this.#worktreeManager.assertEvidenceUnchanged(
      beforeEvidence,
      afterEvidence,
    );
    if (
      execution.spawnError ||
      execution.exitCode !== 0 ||
      execution.timedOut ||
      execution.outputLimitExceeded
    ) {
      fail(
        "CODEX_EXECUTION_FAILED",
        `Codex read-only execution failed with exit code ${String(
          execution.exitCode,
        )}`,
      );
    }
    return Object.freeze({
      result: parseCodexJsonLines(execution.stdout),
      beforeEvidence,
      afterEvidence,
      stderr: execution.stderr,
    });
  }
}
