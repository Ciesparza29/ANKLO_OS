import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  GitHubReadOnlyAdapter,
  type GitHubReadOnlyClient,
} from "../src/github-adapter.ts";
import { CodexReadOnlyAdapter } from "../src/codex-adapter.ts";
import { WorktreeManager } from "../src/worktree.ts";

const tempDirs: string[] = [];

function createTempDir(prefix = "anklo-adp-script-"): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  tempDirs.push(dir);
  return dir;
}

function createTempGitRepo(name = "test-adapter-repo"): string {
  const dir = createTempDir("anklo-adp-repo-");
  const repoDir = join(dir, name);
  spawnSync("mkdir", ["-p", repoDir]);
  spawnSync("git", ["init", "-b", "feat/test-branch"], { cwd: repoDir });
  spawnSync("git", ["config", "user.email", "test@anklo.local"], {
    cwd: repoDir,
  });
  spawnSync("git", ["config", "user.name", "Test User"], { cwd: repoDir });
  spawnSync("touch", ["README.md"], { cwd: repoDir });
  spawnSync("git", ["add", "README.md"], { cwd: repoDir });
  spawnSync("git", ["commit", "-m", "initial commit"], { cwd: repoDir });
  return repoDir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("Read-Only GitHub Adapter (ADR-0010 Section 7 & 8)", () => {
  const mockClient: GitHubReadOnlyClient = {
    fetchIssue: (number) => ({
      number,
      title: "Test Issue",
      body: "Exact UTF-8 Issue Body Content",
      state: "open",
    }),
    fetchPullRequest: (number) => ({
      number,
      headSha: "a".repeat(40),
      baseSha: "b".repeat(40),
      state: "open",
    }),
  };

  it("fetches issue data and calculates exact SHA-256 issue body hash", () => {
    const adapter = new GitHubReadOnlyAdapter(mockClient);
    expect(adapter.getIssue(24).title).toBe("Test Issue");
    expect(adapter.getExactIssueBody(24)).toBe(
      "Exact UTF-8 Issue Body Content",
    );
    expect(adapter.computeIssueBodyHash(24)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("strictly forbids any mutating or writing operations", () => {
    const adapter = new GitHubReadOnlyAdapter(mockClient);
    expect(() => adapter.push()).toThrow(/strictly read-only/);
    expect(() => adapter.createPullRequest()).toThrow(/strictly read-only/);
    expect(() => adapter.modifyPullRequest()).toThrow(/strictly read-only/);
    expect(() => adapter.mergePullRequest()).toThrow(/strictly read-only/);
    expect(() => adapter.createComment()).toThrow(/strictly read-only/);
    expect(() => adapter.modifyIssue()).toThrow(/strictly read-only/);
    expect(() => adapter.closeIssue()).toThrow(/strictly read-only/);
  });
});

describe("Read-Only Codex Adapter (ADR-0010 Section 11)", () => {
  it("invokes codex and parses structured JSON decision with git evidence verification", () => {
    const repoDir = createTempGitRepo();
    const scriptDir = createTempDir("anklo-adp-scripts-");
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
    }).stdout.trim();

    const mockCodexScript = join(scriptDir, "mock-codex.sh");
    writeFileSync(
      mockCodexScript,
      `#!/bin/sh\necho '{"decision": "APPROVE", "summary": "All tests pass", "findings": ["Clean code"]}'\n`,
      { mode: 0o755 },
    );

    const wtManager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repoDir],
    });

    const adapter = new CodexReadOnlyAdapter(wtManager, {
      codexBinary: mockCodexScript,
      timeoutMs: 5000,
      maxOutputBytes: 1024,
    });

    const rev = adapter.reviewWorktree(
      repoDir,
      headSha,
      "Please review this worktree",
    );
    expect(rev.result.decision).toBe("APPROVE");
    expect(rev.result.summary).toBe("All tests pass");
    expect(rev.result.findings).toEqual(["Clean code"]);
    expect(rev.beforeEvidence.headSha).toBe(headSha);
    expect(rev.afterEvidence.headSha).toBe(headSha);
    expect(rev.afterEvidence.isClean).toBe(true);
  });

  it("defaults to NOT_VERIFIABLE decision when JSON parsing fails", () => {
    const repoDir = createTempGitRepo();
    const scriptDir = createTempDir("anklo-adp-scripts-");
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
    }).stdout.trim();

    const mockCodexScript = join(scriptDir, "mock-codex-bad.sh");
    writeFileSync(mockCodexScript, `#!/bin/sh\necho 'not a json'\n`, {
      mode: 0o755,
    });

    const wtManager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repoDir],
    });

    const adapter = new CodexReadOnlyAdapter(wtManager, {
      codexBinary: mockCodexScript,
    });
    const rev = adapter.reviewWorktree(repoDir, headSha, "review");
    expect(rev.result.decision).toBe("NOT_VERIFIABLE");
    expect(rev.result.summary).toContain("Failed to parse");
  });

  it("detects and rejects git mutations during codex execution", () => {
    const repoDir = createTempGitRepo();
    const scriptDir = createTempDir("anklo-adp-scripts-");
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoDir,
      encoding: "utf8",
    }).stdout.trim();

    const mockCodexMutator = join(scriptDir, "mock-codex-mutator.sh");
    writeFileSync(
      mockCodexMutator,
      `#!/bin/sh\ntouch "${join(repoDir, "dirty.txt")}"\necho '{"decision":"APPROVE","summary":"ok","findings":[]}'\n`,
      { mode: 0o755 },
    );

    const wtManager = new WorktreeManager({
      allowlistedRepository: "Ciesparza29/ANKLO_OS",
      allowlistedWorktrees: [repoDir],
    });

    const adapter = new CodexReadOnlyAdapter(wtManager, {
      codexBinary: mockCodexMutator,
    });
    expect(() => adapter.reviewWorktree(repoDir, headSha, "review")).toThrow(
      /worktree git state or clean status was altered/,
    );
  });

  it("strictly forbids authoritative or mutating methods", () => {
    const wtManager = new WorktreeManager({
      allowlistedRepository: "repo",
      allowlistedWorktrees: [],
    });
    const adapter = new CodexReadOnlyAdapter(wtManager);
    expect(() => adapter.approvePlan()).toThrow(
      /no authority to approve requirements/,
    );
    expect(() => adapter.commit()).toThrow(/forbids git commit/);
    expect(() => adapter.push()).toThrow(/forbids git push/);
    expect(() => adapter.merge()).toThrow(/forbids git merge/);
  });
});
