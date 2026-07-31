import { createTrustManifest } from "../src/operational-trust.ts";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { GitHubReadOnlyAdapter } from "../src/github-adapter.ts";
import {
  CodexReadOnlyAdapter,
  parseCodexJsonLines,
} from "../src/codex-adapter.ts";
import { WorktreeManager } from "../src/worktree.ts";
import {
  createNodeToolIdentity,
  createRepositoryIdentity,
  createToolIdentity,
} from "../src/operational-trust.ts";
import { SqliteStateStore } from "../src/state-store.ts";
import type { TrustedExecutionContext } from "../src/trusted-process.ts";

const projectRoot = realpathSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../.."),
);
const outputSchemaPath = join(
  projectRoot,
  "tools/agent-orchestrator/schemas/codex-review-result.schema.json",
);
const temporaryDirectories: string[] = [];

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

function createTestContext(
  repoRoot: string,
  options?: {
    worktree?: string;
    main?: string;
    ghBin?: string;
    codexBin?: string;
    headSha?: string;
  },
): TrustedExecutionContext {
  const dbDir = temporaryDirectory("anklo-adapter-db-");
  const store = SqliteStateStore.open(join(dbDir, "store.db"));
  const now = new Date("2026-07-27T00:00:00.000Z");
  const runId = "run-adapter-test";
  store.createRun({
    runId,
    repository: "Ciesparza29/ANKLO_OS",
    issueNumber: 24,
    idempotencyKey: "0".repeat(64),
    baseSha: "2".repeat(40),
    planHash: "3".repeat(64),
    sourceSnapshotHash: "4".repeat(64),
    now,
  });

  const gitBin = spawnSync("which", ["git"], {
    encoding: "utf8",
  }).stdout.trim();
  const tools = [
    createNodeToolIdentity(),
    createToolIdentity("git", gitBin, "1.0.0"),
  ];
  if (options?.ghBin) {
    tools.push(createToolIdentity("gh", options.ghBin, "1.0.0"));
  }
  if (options?.codexBin) {
    tools.push(createToolIdentity("codex", options.codexBin, "1.0.0"));
  }

  const worktreePath = options?.worktree
    ? realpathSync(options.worktree)
    : realpathSync(repoRoot);
  const mainPath = options?.main
    ? realpathSync(options.main)
    : realpathSync(repoRoot);

  let gitDir = realpathSync(repoRoot);
  let commonGitDir = realpathSync(repoRoot);
  if (options?.worktree && existsSync(options.worktree)) {
    const gd = git(options.worktree, ["rev-parse", "--git-dir"]);
    gitDir = realpathSync(resolve(options.worktree, gd));
    const cgd = git(options.worktree, ["rev-parse", "--git-common-dir"]);
    commonGitDir = realpathSync(resolve(options.worktree, cgd));
  }

  const repIdentity = createRepositoryIdentity({
    repositorySlug: "Ciesparza29/ANKLO_OS",
    host: "github.com",
    normalizedOrigin: "github.com/Ciesparza29/ANKLO_OS",
    repositoryRealpath: realpathSync(repoRoot),
    worktreeRealpath: worktreePath,
    mainCloneRealpath: mainPath,
    gitDir,
    commonGitDir,
    worktreeRegistrationHash: "1".repeat(64),
    branch: "feat/review",
    headSha: options?.headSha ?? "2".repeat(40),
    baseSha: options?.headSha ?? "2".repeat(40),
    worktreeId: "worktree-adapter",
    issueNumber: 24,
    protectedPaths: [mainPath],
    remoteIdentity: "origin:github.com/Ciesparza29/ANKLO_OS",
  });

  store.bindRunTrust({
    runId,
    trustManifest: createTrustManifest({
      createdAt: now.toISOString(),
      toolIdentities: tools,
      repositoryIdentity: repIdentity,
      lockfileHash: "4".repeat(64),
      workspaceManifestHash: "5".repeat(64),
      packageManifestHash: "0".repeat(64),
      analyzerVersion: "1.0.0",
      commonGitDirIdentity: "6".repeat(64),
    }),
    correlationId: runId,
    now,
  });

  return { runId, stateStore: store };
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe("concrete read-only GitHub adapter", () => {
  function adapter(): {
    github: GitHubReadOnlyAdapter;
    context: TrustedExecutionContext;
  } {
    const root = temporaryDirectory("anklo-gh-test-");
    const bin = join(root, "bin");
    const config = join(root, "gh-config");
    mkdirSync(bin);
    mkdirSync(config);
    const ghBin = join(bin, "gh");
    executable(
      ghBin,
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
    const github = new GitHubReadOnlyAdapter({
      repository: "Ciesparza29/ANKLO_OS",
      ghConfigDirectory: config,
    });
    const context = createTestContext(root, { ghBin });
    return { github, context };
  }

  it("allows only fixed issue, PR and forced-GET API reads", () => {
    const { github, context } = adapter();
    expect(github.getIssue(context, 24).body).toBe("Exact UTF-8 body");
    expect(github.computeIssueBodyHash(context, 24)).toMatch(/^[0-9a-f]{64}$/u);
    expect(github.getPullRequest(context, 25).headSha).toBe("a".repeat(40));
    expect(github.apiGet(context, { kind: "issue", number: 24 })).toEqual({
      read_only: true,
    });
    expect(
      github.apiGet(context, { kind: "check-runs", commitSha: "a".repeat(40) }),
    ).toEqual({
      read_only: true,
    });
  });

  it("rejects invalid resource identifiers before invoking gh", () => {
    const { github, context } = adapter();
    expect(() => github.getIssue(context, 0)).toThrow(/positive integer/u);
    expect(() =>
      github.apiGet(context, { kind: "check-runs", commitSha: "main" }),
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
  }

  it("uses isolated config, empty MCP configuration and parses JSONL", async () => {
    const repo = createWorktree();
    installMockCodex(
      repo.root,
      `#!/bin/sh
set -eu
index=0
separator_index=-1
prompt_index=-1
expect_value=""
seen_ignore_user_config=0
seen_ignore_rules=0
seen_strict_config=0
seen_mcp=0
seen_sandbox=0
seen_ephemeral=0
seen_json=0
seen_output_schema=0
seen_cd=0
for arg in "$@"; do
  if [ -n "$expect_value" ]; then
    case "$expect_value" in
      "__PATH__")
        case "$arg" in
          /*) ;;
          *) exit 93 ;;
        esac
        case "$index" in
          11|13) ;;
          *) exit 93 ;;
        esac
        if [ "$index" -eq 11 ]; then seen_output_schema=1; fi
        if [ "$index" -eq 13 ]; then seen_cd=1; fi
        ;;
      *)
        [ "$arg" = "$expect_value" ] || exit 93
        case "$expect_value" in
          "mcp_servers={}") seen_mcp=1 ;;
          "read-only") seen_sandbox=1 ;;
        esac
        ;;
    esac
    expect_value=""
    index=$((index + 1))
    continue
  fi
  case "$index:$arg" in
    "0:exec") ;;
    "1:--ignore-user-config") seen_ignore_user_config=1 ;;
    "2:--ignore-rules") seen_ignore_rules=1 ;;
    "3:--strict-config") seen_strict_config=1 ;;
    "4:-c") expect_value="mcp_servers={}" ;;
    "6:--sandbox") expect_value="read-only" ;;
    "8:--ephemeral") seen_ephemeral=1 ;;
    "9:--json") seen_json=1 ;;
    "10:--output-schema") expect_value="__PATH__" ;;
    "12:--cd") expect_value="__PATH__" ;;
    "14:--") separator_index="$index" ;;
    "15:--dangerously-bypass-approvals-and-sandbox") prompt_index="$index" ;;
    *) exit 93 ;;
  esac
  index=$((index + 1))
done
[ "$index" -eq 16 ] || exit 93
[ "$separator_index" -eq 14 ] || exit 93
[ "$prompt_index" -eq 15 ] || exit 93
[ "$seen_ignore_user_config" -eq 1 ] || exit 93
[ "$seen_ignore_rules" -eq 1 ] || exit 93
[ "$seen_strict_config" -eq 1 ] || exit 93
[ "$seen_mcp" -eq 1 ] || exit 93
[ "$seen_sandbox" -eq 1 ] || exit 93
[ "$seen_ephemeral" -eq 1 ] || exit 93
[ "$seen_json" -eq 1 ] || exit 93
[ "$seen_output_schema" -eq 1 ] || exit 93
[ "$seen_cd" -eq 1 ] || exit 93
printf '%s\\n' '{"type":"thread.started","thread_id":"test"}'
printf '%s\\n' '{"type":"item.completed","item":{"type":"agent_message","text":"{\\"decision\\":\\"APPROVE\\",\\"summary\\":\\"Verified\\",\\"findings\\":[]}"}}'
`,
    );
    const runtime = join(repo.root, "codex-home");
    const codexBin = join(repo.root, "bin", "codex");
    const adapter = new CodexReadOnlyAdapter(managerFor(repo), {
      runtimeDirectory: runtime,
      outputSchemaPath,
      timeoutMs: 5_000,
      maxOutputBytes: 64 * 1024,
    });
    const context = createTestContext(repo.root, {
      worktree: repo.worktree,
      main: repo.main,
      codexBin,
      headSha: repo.head,
    });
    const result = await adapter.reviewWorktree(
      context,
      repo.worktree,
      repo.head,
      "--dangerously-bypass-approvals-and-sandbox",
    );
    expect(result.result.decision).toBe("APPROVE");
    expect(result.beforeEvidence.headSha).toBe(result.afterEvidence.headSha);
  }, 15000);

  it("rejects mutation during Codex execution", async () => {
    const repo = createWorktree();
    installMockCodex(
      repo.root,
      `#!/bin/sh
touch dirty-by-codex.txt
printf '%s\\n' '{"type":"item.completed","item":{"type":"agent_message","text":"{\\"decision\\":\\"APPROVE\\",\\"summary\\":\\"Unsafe\\",\\"findings\\":[]}"}}'
`,
    );
    const codexBin = join(repo.root, "bin", "codex");
    const adapter = new CodexReadOnlyAdapter(managerFor(repo), {
      runtimeDirectory: join(repo.root, "codex-home"),
      outputSchemaPath,
    });
    const context = createTestContext(repo.root, {
      worktree: repo.worktree,
      main: repo.main,
      codexBin,
      headSha: repo.head,
    });
    await expect(
      adapter.reviewWorktree(context, repo.worktree, repo.head, "review"),
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
