import {
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { GitHubReadOnlyAdapter } from "../src/github-adapter.ts";
import {
  CodexReadOnlyAdapter,
  parseCodexJsonLines,
} from "../src/codex-adapter.ts";
import { WorktreeManager } from "../src/worktree.ts";

const projectRoot = realpathSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../.."),
);
const outputSchemaPath = join(
  projectRoot,
  "tools/agent-orchestrator/schemas/codex-review-result.schema.json",
);
const temporaryDirectories: string[] = [];
const originalPath = process.env.PATH;

function temporaryDirectory(prefix: string): string {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  temporaryDirectories.push(directory);
  return directory;
}

function executable(path: string, contents: string): void {
  writeFileSync(path, contents, { encoding: "utf8", mode: 0o755 });
}

function git(cwd: string, args: readonly string[]): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function createWorktree(): {
  root: string;
  main: string;
  worktree: string;
  head: string;
} {
  const root = temporaryDirectory("anklo-adapter-test-");
  const main = join(root, "main");
  const worktree = join(root, "worktree");
  mkdirSync(main);
  git(main, ["init", "-b", "main"]);
  git(main, ["config", "user.email", "test@anklo.local"]);
  git(main, ["config", "user.name", "Test User"]);
  git(main, [
    "remote",
    "add",
    "origin",
    "https://github.com/Ciesparza29/ANKLO_OS.git",
  ]);
  writeFileSync(join(main, "README.md"), "test\n", "utf8");
  git(main, ["add", "README.md"]);
  git(main, ["commit", "-m", "initial"]);
  const head = git(main, ["rev-parse", "HEAD"]);
  git(main, ["worktree", "add", "-b", "feat/review", worktree, head]);
  return { root, main, worktree, head };
}

function managerFor(repo: ReturnType<typeof createWorktree>): WorktreeManager {
  return new WorktreeManager({
    allowlistedRepository: "Ciesparza29/ANKLO_OS",
    allowlistedWorktrees: [repo.worktree],
    allowedParentDirectories: [repo.root],
    protectedWorktreePaths: [repo.main],
  });
}

afterEach(() => {
  process.env.PATH = originalPath;
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe("concrete read-only GitHub adapter", () => {
  function adapter(): GitHubReadOnlyAdapter {
    const root = temporaryDirectory("anklo-gh-test-");
    const bin = join(root, "bin");
    const config = join(root, "gh-config");
    mkdirSync(bin);
    mkdirSync(config);
    executable(
      join(bin, "gh"),
      `#!/bin/sh
case "$1 $2" in
  "issue view")
    printf '%s\\n' '{"number":24,"title":"Issue","body":"Exact UTF-8 body","state":"OPEN"}'
    ;;
  "pr view")
    printf '%s\\n' '{"number":25,"headRefOid":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","baseRefOid":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","state":"OPEN"}'
    ;;
  "api --method")
    test "$3" = "GET" || exit 91
    printf '%s\\n' '{"read_only":true}'
    ;;
  *)
    exit 92
    ;;
esac
`,
    );
    process.env.PATH = `${bin}:${originalPath ?? ""}`;
    return new GitHubReadOnlyAdapter({
      repository: "Ciesparza29/ANKLO_OS",
      ghConfigDirectory: config,
    });
  }

  it("allows only fixed issue, PR and forced-GET API reads", () => {
    const github = adapter();
    expect(github.getIssue(24).body).toBe("Exact UTF-8 body");
    expect(github.computeIssueBodyHash(24)).toMatch(/^[0-9a-f]{64}$/u);
    expect(github.getPullRequest(25).headSha).toBe("a".repeat(40));
    expect(github.apiGet({ kind: "issue", number: 24 })).toEqual({
      read_only: true,
    });
    expect(
      github.apiGet({ kind: "check-runs", commitSha: "a".repeat(40) }),
    ).toEqual({
      read_only: true,
    });
  });

  it("rejects invalid resource identifiers before invoking gh", () => {
    const github = adapter();
    expect(() => github.getIssue(0)).toThrow(/positive integer/u);
    expect(() =>
      github.apiGet({ kind: "check-runs", commitSha: "main" }),
    ).toThrow(/invalid/u);
    expect("createComment" in github).toBe(false);
    expect("mergePullRequest" in github).toBe(false);
  });
});

describe("Codex 0.144.6 read-only adapter", () => {
  function installMockCodex(root: string, body: string): void {
    const bin = join(root, "bin");
    mkdirSync(bin);
    executable(join(bin, "codex"), body);
    process.env.PATH = `${bin}:${originalPath ?? ""}`;
  }

  it("uses isolated config, empty MCP configuration and parses JSONL", async () => {
    const repo = createWorktree();
    installMockCodex(
      repo.root,
      `#!/bin/sh
all="$*"
case "$all" in
  *"--ignore-user-config"*"mcp_servers={}"*"--sandbox read-only"*"--ephemeral"*"--json"*"--output-schema"*"--cd"*) ;;
  *) exit 93 ;;
esac
printf '%s\\n' '{"type":"thread.started","thread_id":"test"}'
printf '%s\\n' '{"type":"item.completed","item":{"type":"agent_message","text":"{\\"decision\\":\\"APPROVE\\",\\"summary\\":\\"Verified\\",\\"findings\\":[]}"}}'
`,
    );
    const runtime = join(repo.root, "codex-home");
    const adapter = new CodexReadOnlyAdapter(managerFor(repo), {
      runtimeDirectory: runtime,
      outputSchemaPath,
      timeoutMs: 5_000,
      maxOutputBytes: 64 * 1024,
    });
    const result = await adapter.reviewWorktree(
      repo.worktree,
      repo.head,
      "Review this exact worktree",
    );
    expect(result.result.decision).toBe("APPROVE");
    expect(result.beforeEvidence.headSha).toBe(result.afterEvidence.headSha);
  });

  it("rejects mutation during Codex execution", async () => {
    const repo = createWorktree();
    installMockCodex(
      repo.root,
      `#!/bin/sh
touch dirty-by-codex.txt
printf '%s\\n' '{"type":"item.completed","item":{"type":"agent_message","text":"{\\"decision\\":\\"APPROVE\\",\\"summary\\":\\"Unsafe\\",\\"findings\\":[]}"}}'
`,
    );
    const adapter = new CodexReadOnlyAdapter(managerFor(repo), {
      runtimeDirectory: join(repo.root, "codex-home"),
      outputSchemaPath,
    });
    await expect(
      adapter.reviewWorktree(repo.worktree, repo.head, "review"),
    ).rejects.toThrow(/must be clean/u);
  });

  it("denies malformed, multiple, unknown-field and trailing output", () => {
    const valid =
      '{"type":"item.completed","item":{"type":"agent_message","text":"{\\"decision\\":\\"BLOCKED\\",\\"summary\\":\\"blocked\\",\\"findings\\":[]}"}}';
    expect(parseCodexJsonLines(valid).decision).toBe("BLOCKED");
    expect(() => parseCodexJsonLines(`${valid}\n${valid}`)).toThrow(
      /exactly one/u,
    );
    expect(() => parseCodexJsonLines(`${valid}\ntrailing`)).toThrow(
      /trailing text/u,
    );
    expect(() =>
      parseCodexJsonLines(
        '{"type":"item.completed","item":{"type":"agent_message","text":"{\\"decision\\":\\"APPROVE\\",\\"summary\\":\\"x\\",\\"findings\\":[],\\"extra\\":true}"}}',
      ),
    ).toThrow(/unknown fields/u);
  });
});
