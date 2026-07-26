import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const sourceDirectory = fileURLToPath(new URL("../src", import.meta.url));
const sourceFiles = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".ts"))
  .sort();

const childProcessPolicy: Readonly<Record<string, readonly string[]>> = {
  "worktree.ts": ["spawnSync"],
  "verification-runner.ts": ["spawn"],
  "github-adapter.ts": ["spawnSync"],
  "codex-adapter.ts": ["spawn"],
};

function sourceFile(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(join(sourceDirectory, file), "utf8"),
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );
}

function property(
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.PropertyAssignment | ts.ShorthandPropertyAssignment | undefined {
  return object.properties.find(
    (entry): entry is ts.PropertyAssignment | ts.ShorthandPropertyAssignment =>
      (ts.isPropertyAssignment(entry) ||
        ts.isShorthandPropertyAssignment(entry)) &&
      ((ts.isIdentifier(entry.name) && entry.name.text === name) ||
        (ts.isStringLiteral(entry.name) && entry.name.text === name)),
  );
}

function walk(node: ts.Node, visitor: (node: ts.Node) => void): void {
  visitor(node);
  node.forEachChild((child) => walk(child, visitor));
}

describe("structured security boundaries", () => {
  it("does not import network listeners or cluster modules", () => {
    const forbidden = new Set([
      "node:http",
      "node:https",
      "node:net",
      "node:dgram",
      "node:cluster",
    ]);
    for (const file of sourceFiles) {
      walk(sourceFile(file), (node) => {
        if (
          ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier)
        ) {
          expect(
            forbidden.has(node.moduleSpecifier.text),
            `${file} imports ${node.moduleSpecifier.text}`,
          ).toBe(false);
        }
      });
    }
  });

  it("allows child_process only through exact files and exact unaliased symbols", () => {
    for (const file of sourceFiles) {
      const allowed = childProcessPolicy[file] ?? [];
      const imported = new Set<string>();
      walk(sourceFile(file), (node) => {
        if (
          ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier) &&
          node.moduleSpecifier.text === "node:child_process"
        ) {
          expect(allowed.length, `${file} is not allowlisted`).toBeGreaterThan(
            0,
          );
          expect(node.importClause?.namedBindings).toBeDefined();
          expect(
            node.importClause?.namedBindings &&
              ts.isNamedImports(node.importClause.namedBindings),
          ).toBe(true);
          if (
            node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings)
          ) {
            const names = node.importClause.namedBindings.elements.map(
              (element) => {
                expect(
                  element.propertyName,
                  `${file} aliases child_process`,
                ).toBe(undefined);
                imported.add(element.name.text);
                return element.name.text;
              },
            );
            expect(names.sort()).toEqual([...allowed].sort());
          }
        }

        if (!ts.isCallExpression(node)) return;
        if (
          node.expression.kind === ts.SyntaxKind.ImportKeyword &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          expect(node.arguments[0].text).not.toBe("node:child_process");
        }
        if (
          ts.isIdentifier(node.expression) &&
          node.expression.text === "require" &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          expect(node.arguments[0].text).not.toBe("node:child_process");
        }
        if (
          ts.isIdentifier(node.expression) &&
          ["exec", "execSync", "fork", "spawn", "spawnSync"].includes(
            node.expression.text,
          )
        ) {
          expect(
            imported.has(node.expression.text),
            `${file} invokes an unapproved process primitive`,
          ).toBe(true);
        }
      });
    }
  });

  it("requires shell=false, exact cwd, minimal env and resource controls on every spawn", () => {
    for (const file of Object.keys(childProcessPolicy)) {
      const ast = sourceFile(file);
      walk(ast, (node) => {
        if (
          !ts.isCallExpression(node) ||
          !ts.isIdentifier(node.expression) ||
          !["spawn", "spawnSync"].includes(node.expression.text)
        ) {
          return;
        }
        const options = node.arguments[2];
        expect(
          options && ts.isObjectLiteralExpression(options),
          `${file} process options must be an inline object`,
        ).toBe(true);
        if (!options || !ts.isObjectLiteralExpression(options)) return;
        const shell = property(options, "shell");
        expect(shell, `${file} requires shell`).toBeDefined();
        expect(
          shell &&
            ts.isPropertyAssignment(shell) &&
            shell.initializer.kind === ts.SyntaxKind.FalseKeyword,
          `${file} must set shell=false`,
        ).toBe(true);
        expect(property(options, "cwd"), `${file} requires cwd`).toBeDefined();
        expect(property(options, "env"), `${file} requires env`).toBeDefined();
        if (node.expression.text === "spawnSync") {
          expect(
            property(options, "timeout"),
            `${file} requires timeout`,
          ).toBeDefined();
          expect(
            property(options, "maxBuffer"),
            `${file} requires maxBuffer`,
          ).toBeDefined();
        }
      });
      if (childProcessPolicy[file]?.includes("spawn")) {
        const text = ast.getFullText();
        expect(text).toContain("setTimeout(");
        expect(text).toContain("terminateProcessTree(");
      }
    }
  });

  it("forbids eval and Function constructors throughout source", () => {
    for (const file of sourceFiles) {
      walk(sourceFile(file), (node) => {
        if (!ts.isCallExpression(node) && !ts.isNewExpression(node)) return;
        if (ts.isIdentifier(node.expression)) {
          expect(["eval", "Function"]).not.toContain(node.expression.text);
        }
      });
    }
  });
});
