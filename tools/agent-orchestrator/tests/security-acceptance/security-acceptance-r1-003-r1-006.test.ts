import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const sourceDirectory = new URL("../../src/", import.meta.url);
const fixtureDirectory = new URL("./fixtures/", import.meta.url);

const sourcePath = sourceDirectory.pathname;
const fixturePath = fixtureDirectory.pathname;

const requiredSecurityFiles = [
  "operational-trust.ts",
  "trusted-process.ts",
  "security-boundary-analyzer.ts",
] as const;

const effectBoundaryFiles = [
  "operational-trust.ts",
  "trusted-process.ts",
  "worktree.ts",
  "github-adapter.ts",
  "codex-adapter.ts",
  "verification-runner.ts",
] as const;

type FixtureManifestEntry = Readonly<{
  id: string;
  file: string;
  capability: string;
}>;

type AnalysisViolation = Readonly<{
  code: string;
  file: string;
  line: number;
  column: number;
  forbiddenCapability: string;
  processExecuted: boolean;
  nodeText?: string;
}>;

type AnalyzerModule = Readonly<{
  analyzeSecurityBoundaries?: (
    filename: string,
    sourceCode: string,
    allowedFiles: readonly string[],
  ) => unknown;
}>;

function sourceFiles(): readonly string[] {
  return readdirSync(sourcePath)
    .filter((file) => file.endsWith(".ts"))
    .sort();
}

function sourceText(file: string): string {
  return readFileSync(join(sourcePath, file), "utf8");
}

function sourceAst(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    sourceText(file),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
}

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

function moduleSpecifier(node: ts.Node): string | null {
  if (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    return node.moduleSpecifier.text;
  }

  if (
    ts.isExportDeclaration(node) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    return node.moduleSpecifier.text;
  }

  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference) &&
    node.moduleReference.expression &&
    ts.isStringLiteral(node.moduleReference.expression)
  ) {
    return node.moduleReference.expression.text;
  }

  if (!ts.isCallExpression(node)) return null;

  if (
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    node.arguments[0] &&
    ts.isStringLiteralLike(node.arguments[0])
  ) {
    return node.arguments[0].text;
  }

  if (
    ts.isIdentifier(node.expression) &&
    node.expression.text === "require" &&
    node.arguments[0] &&
    ts.isStringLiteralLike(node.arguments[0])
  ) {
    return node.arguments[0].text;
  }

  return null;
}

function isChildProcessModule(value: string | null): boolean {
  return value === "child_process" || value === "node:child_process";
}

function isExported(node: ts.Node): boolean {
  const candidate = node as ts.Node & {
    modifiers?: ts.NodeArray<ts.ModifierLike>;
  };

  return (
    candidate.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ) ?? false
  );
}

function declarationMemberNames(node: ts.Node): readonly string[] {
  if (ts.isInterfaceDeclaration(node)) {
    return node.members
      .map((member) => member.name?.getText())
      .filter((name): name is string => typeof name === "string");
  }

  if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
    return node.type.members
      .map((member) => member.name?.getText())
      .filter((name): name is string => typeof name === "string");
  }

  return [];
}

function allProductiveSource(): string {
  return sourceFiles()
    .map((file) => sourceText(file))
    .join("\n");
}

function fixtureManifest(): readonly FixtureManifestEntry[] {
  return JSON.parse(
    readFileSync(join(fixturePath, "manifest.json"), "utf8"),
  ) as FixtureManifestEntry[];
}

async function loadAnalyzer(): Promise<AnalyzerModule> {
  const analyzerPath = join(sourcePath, "security-boundary-analyzer.ts");
  const analyzerUrl = pathToFileURL(analyzerPath).href;

  return (await import(/* @vite-ignore */ analyzerUrl)) as AnalyzerModule;
}

describe("R1-003 through R1-006 security acceptance harness", () => {
  it("requires the three security-boundary modules", () => {
    const missing = requiredSecurityFiles.filter(
      (file) => !existsSync(join(sourcePath, file)),
    );

    expect(missing).toEqual([]);
  });

  it("allows node:child_process only in trusted-process.ts", () => {
    const unauthorized: string[] = [];
    let trustedProcessImports = 0;

    for (const file of sourceFiles()) {
      walk(sourceAst(file), (node) => {
        if (!isChildProcessModule(moduleSpecifier(node))) return;

        if (file === "trusted-process.ts") {
          trustedProcessImports += 1;
        } else {
          unauthorized.push(file);
        }
      });
    }

    expect([...new Set(unauthorized)].sort()).toEqual([]);
    expect(trustedProcessImports).toBeGreaterThan(0);
  });

  it("forbids inherited discovery and production test bypasses", () => {
    const violations: string[] = [];

    const forbiddenPatterns: readonly [string, RegExp][] = [
      [
        "inherited PATH/HOME/PNPM_HOME/NODE_ENV",
        /process\.env\.(?:PATH|HOME|PNPM_HOME|NODE_ENV)\b/u,
      ],
      [
        "process.env enumeration",
        /Object\.(?:entries|keys|values)\(\s*process\.env\s*\)/u,
      ],
      ["PNPM_HOME", /\bPNPM_HOME\b/u],
      ["NODE_ENV", /\bNODE_ENV\b/u],
      ["TEST_*", /\bTEST_[A-Z0-9_]*\b/u],
      ["which", /\bwhich\b/u],
      ["command -v", /\bcommand\s+-v\b/u],
    ];

    for (const file of effectBoundaryFiles) {
      const path = join(sourcePath, file);
      if (!existsSync(path)) continue;

      const text = readFileSync(path, "utf8");

      for (const [label, pattern] of forbiddenPatterns) {
        if (pattern.test(text)) {
          violations.push(`${file}:${label}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("anchors Node exclusively to process.execPath and fails closed on versions", () => {
    const path = join(sourcePath, "operational-trust.ts");

    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;

    const text = readFileSync(path, "utf8");
    const ast = ts.createSourceFile(
      "operational-trust.ts",
      text,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );

    const hardcodedNodePaths: string[] = [];

    walk(ast, (node) => {
      if (ts.isStringLiteralLike(node) && /(?:^|[/\\])node$/u.test(node.text)) {
        hardcodedNodePaths.push(node.text);
      }
    });

    expect(text).toContain("process.execPath");
    expect(hardcodedNodePaths).toEqual([]);
    expect(text).not.toMatch(/unknown(?:-runtime-version)?/iu);
  });

  it("does not export raw process authority from trusted-process.ts", () => {
    const path = join(sourcePath, "trusted-process.ts");

    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;

    const text = readFileSync(path, "utf8");
    const ast = ts.createSourceFile(
      "trusted-process.ts",
      text,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.TS,
    );

    const forbiddenNames = new Set([
      "args",
      "argv",
      "cwd",
      "env",
      "executable",
      "worktreePath",
      "manifest",
      "toolName",
    ]);

    const exportedAuthority: string[] = [];

    walk(ast, (node) => {
      if (!isExported(node)) return;

      if (ts.isFunctionDeclaration(node)) {
        for (const parameter of node.parameters) {
          const name = parameter.name.getText();
          if (forbiddenNames.has(name)) {
            exportedAuthority.push(`${node.name?.text ?? "anonymous"}:${name}`);
          }
        }
      }

      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        for (const name of declarationMemberNames(node)) {
          if (forbiddenNames.has(name)) {
            exportedAuthority.push(
              `${"name" in node ? node.name.text : "type"}:${name}`,
            );
          }
        }
      }
    });

    expect(text).toMatch(/\brunId\b/u);
    expect(text).toMatch(/\bRunRecord\b/u);
    expect(exportedAuthority).toEqual([]);
    expect(text).not.toMatch(/TrustManifest\s*\|\s*null/u);
  });

  it("persists immutable trust and repository identity in RunRecord", () => {
    const path = join(sourcePath, "state-store.ts");
    const text = readFileSync(path, "utf8");

    const versionMatch = text.match(
      /STATE_SCHEMA_VERSION\s*=\s*(?<version>\d+)/u,
    );

    expect(versionMatch?.groups?.version).toBeDefined();

    const version = Number(versionMatch?.groups?.version ?? 0);
    expect(version).toBeGreaterThan(5);

    const requiredRunFields = [
      "trustManifestHash",
      "repositoryIdentityHash",
      "toolIdentities",
      "lockfileHash",
      "workspaceManifestHash",
      "analyzerVersion",
      "remoteIdentity",
      "commonGitDirIdentity",
    ] as const;

    for (const field of requiredRunFields) {
      expect(text, `RunRecord and persistence require ${field}`).toContain(
        field,
      );
    }
  });

  it("blocks missing trust and binds effects to persisted runs", () => {
    const text = allProductiveSource();

    expect(text).not.toMatch(/run(?:Git|Gh|Codex|Pnpm)Command\(\s*null/u);
    expect(text).not.toMatch(/TrustManifest\s*\|\s*null/u);
    expect(text).toMatch(
      /assertRunHasTrustManifest|assert[A-Za-z0-9]*Run[A-Za-z0-9]*Trust|TRUST_MANIFEST_REQUIRED/u,
    );
    expect(text).toContain("trustManifestHash");
    expect(text).toContain("repositoryIdentityHash");
    expect(text).toMatch(/\bgetRun\s*\(/u);
    expect(text).toMatch(/\blease\b/iu);
  });

  it("represents the complete revalidable repository identity", () => {
    const text = allProductiveSource();

    const requiredConcepts: readonly [string, RegExp][] = [
      ["repository slug", /\brepositorySlug\b|\brepository\b/u],
      ["host", /\bhost\b/u],
      ["normalized origin", /normalizedOrigin|normalizeGitHubRepository/u],
      ["repository realpath", /repositoryRealpath|repositoryRootRealpath/u],
      ["worktree realpath", /worktreeRealpath/u],
      ["main clone realpath", /mainCloneRealpath|mainClonePath/u],
      ["git dir", /\bgitDir\b/u],
      ["common git dir", /\bcommonGitDir\b/u],
      [
        "worktree registry",
        /worktreeRegistration|worktree[ -]list[ -]{1,2}porcelain/u,
      ],
      ["branch", /\bbranch\b/u],
      ["head SHA", /\bheadSha\b/u],
      ["base SHA", /\bbaseSha\b/u],
      ["worktree id", /\bworktreeId\b/u],
      ["issue number", /\bissueNumber\b/u],
      ["protected paths", /protectedWorktreePaths|protectedPaths/u],
      ["remote identity", /\bremoteIdentity\b/u],
    ];

    const missing = requiredConcepts
      .filter(([, pattern]) => !pattern.test(text))
      .map(([label]) => label);

    expect(missing).toEqual([]);
  });

  it("contains exactly twenty separate negative AST fixtures", () => {
    const manifest = fixtureManifest();

    expect(manifest).toHaveLength(20);
    expect(new Set(manifest.map((entry) => entry.id)).size).toBe(20);
    expect(new Set(manifest.map((entry) => entry.file)).size).toBe(20);
    expect(new Set(manifest.map((entry) => entry.capability)).size).toBe(20);

    for (const entry of manifest) {
      const path = join(fixturePath, entry.file);

      expect(existsSync(path), entry.id).toBe(true);
      expect(statSync(path).isFile(), entry.id).toBe(true);
      expect(
        readFileSync(path, "utf8").trim().length,
        entry.id,
      ).toBeGreaterThan(0);
    }
  });

  it("rejects all twenty AST evasions and reports processExecuted=false", async () => {
    const analyzerPath = join(sourcePath, "security-boundary-analyzer.ts");

    expect(existsSync(analyzerPath)).toBe(true);
    if (!existsSync(analyzerPath)) return;

    const analyzerModule = await loadAnalyzer();
    const analyze = analyzerModule.analyzeSecurityBoundaries;

    expect(typeof analyze).toBe("function");
    if (typeof analyze !== "function") return;

    for (const entry of fixtureManifest()) {
      const path = join(fixturePath, entry.file);
      const source = readFileSync(path, "utf8");

      const result = analyze(entry.file, source, ["trusted-process.ts"]);

      expect(Array.isArray(result), entry.id).toBe(true);
      if (!Array.isArray(result)) continue;

      const violations = result as AnalysisViolation[];

      expect(violations.length, entry.id).toBeGreaterThan(0);

      for (const violation of violations) {
        expect(violation.code, entry.id).toMatch(/^[A-Z][A-Z0-9_]+$/u);
        expect(violation.file, entry.id).toBe(entry.file);
        expect(violation.forbiddenCapability, entry.id).toBe(entry.capability);
        expect(violation.line, entry.id).toBeGreaterThan(0);
        expect(violation.column, entry.id).toBeGreaterThan(0);
        expect(
          violation.forbiddenCapability.trim().length,
          entry.id,
        ).toBeGreaterThan(0);
        expect(violation.processExecuted, entry.id).toBe(false);
      }
    }

    const safeDecoyResult = analyze(
      "safe-decoy.ts",
      [
        "// node:child_process must not be detected inside comments",
        'const documentation = "node:child_process";',
        "void documentation;",
      ].join("\n"),
      ["trusted-process.ts"],
    );

    expect(safeDecoyResult).toEqual([]);

    const allowedResult = analyze(
      "trusted-process.ts",
      'import { spawn } from "node:child_process";',
      ["trusted-process.ts"],
    );

    expect(allowedResult).toEqual([]);
  });

  it("contains no productive test hooks or bypasses", () => {
    const text = allProductiveSource();

    expect(text).not.toMatch(
      /injectToolMockForTesting|clearToolMocksForTesting|TEST_OVERRIDES/u,
    );
    expect(text).not.toMatch(/NODE_ENV\s*={2,3}\s*["']test["']/u);
  });

  it("contains no caller-supplied null trust bypass", () => {
    for (const file of sourceFiles()) {
      const text = sourceText(file);

      expect(
        text,
        `${file} must not supply null trust to an effect`,
      ).not.toMatch(
        /run(?:Git|Gh|Codex|Pnpm)Command\(\s*null|runVerificationCommandAsync\(\s*null/u,
      );
    }
  });

  it("keeps every fixture outside productive source", () => {
    for (const entry of fixtureManifest()) {
      expect(basename(entry.file)).toMatch(/\.fixture\.txt$/u);
      expect(join(fixturePath, entry.file).startsWith(fixturePath)).toBe(true);
    }
  });
});
