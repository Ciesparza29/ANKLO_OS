import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const sourcePath = new URL("../../src/", import.meta.url).pathname;
const harnessPath = new URL("./", import.meta.url).pathname;

function parseSource(file: string): ts.SourceFile {
  const path = join(sourcePath, file);

  return ts.createSourceFile(
    file,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
}

function modifiers(node: ts.Node): readonly ts.Modifier[] {
  if (!ts.canHaveModifiers(node)) return [];
  return ts.getModifiers(node) ?? [];
}

function isExported(node: ts.Node): boolean {
  return modifiers(node).some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  );
}

function memberName(member: ts.TypeElement): string | null {
  if (!member.name) return null;

  if (
    ts.isIdentifier(member.name) ||
    ts.isStringLiteral(member.name) ||
    ts.isNumericLiteral(member.name)
  ) {
    return member.name.text;
  }

  return member.name.getText();
}

function unwrapTypeLiteral(type: ts.TypeNode): ts.TypeLiteralNode | null {
  if (ts.isTypeLiteralNode(type)) return type;

  if (
    ts.isTypeReferenceNode(type) &&
    ts.isIdentifier(type.typeName) &&
    type.typeName.text === "Readonly" &&
    type.typeArguments?.[0] &&
    ts.isTypeLiteralNode(type.typeArguments[0])
  ) {
    return type.typeArguments[0];
  }

  return null;
}

function declaredMembers(file: string, declarationName: string): Set<string> {
  const ast = parseSource(file);

  for (const statement of ast.statements) {
    if (
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === declarationName
    ) {
      return new Set(
        statement.members
          .map(memberName)
          .filter((name): name is string => name !== null),
      );
    }

    if (
      ts.isTypeAliasDeclaration(statement) &&
      statement.name.text === declarationName
    ) {
      const literal = unwrapTypeLiteral(statement.type);
      if (!literal) return new Set();

      return new Set(
        literal.members
          .map(memberName)
          .filter((name): name is string => name !== null),
      );
    }
  }

  return new Set();
}

function expectRequiredMembers(
  actual: Set<string>,
  required: readonly string[],
  declarationName: string,
): void {
  const missing = required.filter((field) => !actual.has(field));

  expect(missing, `${declarationName} is missing required fields`).toEqual([]);
}

function allHarnessTypeScriptFiles(directory = harnessPath): string[] {
  const result: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      result.push(...allHarnessTypeScriptFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      result.push(path);
    }
  }

  return result.sort();
}

describe("security acceptance harness structural gates", () => {
  it("cannot be bypassed with skipped tests or TypeScript suppressions", () => {
    const testRoots = new Set(["describe", "it", "test"]);
    const forbiddenControls = new Set(["skip", "only", "todo", "fails"]);
    const violations: string[] = [];

    function accessChain(expression: ts.Expression): readonly string[] {
      if (ts.isIdentifier(expression)) {
        return [expression.text];
      }

      if (ts.isPropertyAccessExpression(expression)) {
        return [...accessChain(expression.expression), expression.name.text];
      }

      if (
        ts.isElementAccessExpression(expression) &&
        expression.argumentExpression &&
        ts.isStringLiteralLike(expression.argumentExpression)
      ) {
        return [
          ...accessChain(expression.expression),
          expression.argumentExpression.text,
        ];
      }

      if (ts.isCallExpression(expression)) {
        return accessChain(expression.expression);
      }

      return [];
    }

    for (const file of allHarnessTypeScriptFiles()) {
      const relativeFile = file.slice(harnessPath.length);
      const text = readFileSync(file, "utf8");
      const ast = ts.createSourceFile(
        relativeFile,
        text,
        ts.ScriptTarget.ESNext,
        true,
        ts.ScriptKind.TS,
      );

      function visit(node: ts.Node): void {
        if (
          ts.isPropertyAccessExpression(node) ||
          ts.isElementAccessExpression(node)
        ) {
          const chain = accessChain(node);

          if (
            chain.length >= 2 &&
            testRoots.has(chain[0] ?? "") &&
            chain.some((part) => forbiddenControls.has(part))
          ) {
            violations.push(relativeFile + ":test-control:" + chain.join("."));
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(ast);

      const scanner = ts.createScanner(
        ts.ScriptTarget.Latest,
        false,
        ts.LanguageVariant.Standard,
        text,
      );

      for (
        let token = scanner.scan();
        token !== ts.SyntaxKind.EndOfFileToken;
        token = scanner.scan()
      ) {
        if (
          token !== ts.SyntaxKind.SingleLineCommentTrivia &&
          token !== ts.SyntaxKind.MultiLineCommentTrivia
        ) {
          continue;
        }

        const comment = scanner.getTokenText();

        if (/@ts-(?:ignore|expect-error)\b/u.test(comment)) {
          violations.push(relativeFile + ":typescript-suppression");
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("requires structural RunRecord fields and matching SQLite columns", () => {
    const stateStore = join(sourcePath, "state-store.ts");
    const text = readFileSync(stateStore, "utf8");
    const fields = declaredMembers("state-store.ts", "RunRecord");

    expectRequiredMembers(
      fields,
      [
        "trustManifestHash",
        "repositoryIdentityHash",
        "toolIdentities",
        "lockfileHash",
        "workspaceManifestHash",
        "analyzerVersion",
        "remoteIdentity",
        "commonGitDirIdentity",
      ],
      "RunRecord",
    );

    const version = Number(
      text.match(/STATE_SCHEMA_VERSION\s*=\s*(\d+)/u)?.[1] ?? 0,
    );

    expect(version).toBeGreaterThan(5);

    for (const column of [
      "trust_manifest_hash",
      "repository_identity_hash",
      "tool_identities_json",
      "lockfile_hash",
      "workspace_manifest_hash",
      "analyzer_version",
      "remote_identity",
      "common_git_dir_identity",
    ]) {
      expect(text, `SQLite schema requires ${column}`).toContain(column);
    }
  });

  it("requires structural tool and repository identity contracts", () => {
    const operationalTrust = join(sourcePath, "operational-trust.ts");

    expect(existsSync(operationalTrust)).toBe(true);
    if (!existsSync(operationalTrust)) return;

    expectRequiredMembers(
      declaredMembers("operational-trust.ts", "ToolIdentity"),
      ["name", "resolvedPath", "realpath", "sha256", "version"],
      "ToolIdentity",
    );

    expectRequiredMembers(
      declaredMembers("operational-trust.ts", "RepositoryIdentity"),
      [
        "repositorySlug",
        "host",
        "normalizedOrigin",
        "repositoryRealpath",
        "worktreeRealpath",
        "mainCloneRealpath",
        "gitDir",
        "commonGitDir",
        "worktreeRegistrationHash",
        "branch",
        "headSha",
        "baseSha",
        "worktreeId",
        "issueNumber",
        "protectedPaths",
        "remoteIdentity",
        "repositoryIdentityHash",
      ],
      "RepositoryIdentity",
    );
  });

  it("requires a stable structural analyzer result contract", () => {
    const analyzer = join(sourcePath, "security-boundary-analyzer.ts");

    expect(existsSync(analyzer)).toBe(true);
    if (!existsSync(analyzer)) return;

    expectRequiredMembers(
      declaredMembers("security-boundary-analyzer.ts", "AnalysisViolation"),
      [
        "code",
        "file",
        "line",
        "column",
        "forbiddenCapability",
        "processExecuted",
      ],
      "AnalysisViolation",
    );

    const ast = parseSource("security-boundary-analyzer.ts");
    const exportedFunctions = ast.statements
      .filter(ts.isFunctionDeclaration)
      .filter(isExported)
      .map((statement) => statement.name?.text)
      .filter((name): name is string => typeof name === "string");

    expect(exportedFunctions).toContain("analyzeSecurityBoundaries");

    const text = readFileSync(analyzer, "utf8");

    expect(text).toMatch(
      /from\s+["']typescript["']|from\s+["']typescript\/lib\/typescript/u,
    );
    expect(text).toContain("createSourceFile");
  });

  it("forbids raw process authority in exported command inputs", () => {
    const trustedProcess = join(sourcePath, "trusted-process.ts");

    expect(existsSync(trustedProcess)).toBe(true);
    if (!existsSync(trustedProcess)) return;

    const ast = parseSource("trusted-process.ts");
    const forbidden = new Set([
      "args",
      "argv",
      "cwd",
      "env",
      "executable",
      "worktreePath",
      "manifest",
      "toolName",
      "script",
      "command",
    ]);

    const violations: string[] = [];

    for (const statement of ast.statements) {
      if (!isExported(statement)) continue;

      if (ts.isFunctionDeclaration(statement)) {
        for (const parameter of statement.parameters) {
          const name = parameter.name.getText();

          if (forbidden.has(name)) {
            violations.push(`${statement.name?.text ?? "anonymous"}:${name}`);
          }
        }
      }

      if (
        (ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement)) &&
        /(?:Input|Options|Command|Request|Operation)$/u.test(
          statement.name.text,
        )
      ) {
        const fields = declaredMembers(
          "trusted-process.ts",
          statement.name.text,
        );

        for (const field of fields) {
          if (forbidden.has(field)) {
            violations.push(`${statement.name.text}:${field}`);
          }
        }
      }
    }

    const text = readFileSync(trustedProcess, "utf8");

    expect(text).toMatch(/\bRunRecord\b/u);
    expect(text).toMatch(/\bStateStore\b/u);
    expect(text).not.toMatch(/TrustManifest\s*\|\s*null/u);
    expect(violations).toEqual([]);
  });
});
