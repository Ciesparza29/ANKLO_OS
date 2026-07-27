import ts from "typescript";

export interface AnalysisViolation {
  readonly code: string;
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly forbiddenCapability: string;
  readonly processExecuted: boolean;
  readonly nodeText?: string;
}

type Candidate = Readonly<{
  capability: string;
  node: ts.Node;
  priority: number;
}>;

type BindingOrigin = Readonly<{
  capability: string;
  node: ts.Node;
}>;

type LoaderClassification = Readonly<{
  capability: string;
  node: ts.Node;
}>;

const INTERNAL_ALLOWED_FILES = new Set(["trusted-process.ts"]);

const CAPABILITY_PRIORITIES: Readonly<Record<string, number>> = {
  unresolved_suspicious_construction: 110,
  aliased_require: 100,
  create_require: 100,
  destructured_require: 100,
  dynamic_import: 100,
  dynamic_require: 100,
  get_builtin_module: 100,
  re_export: 100,
  resolvable_concatenation: 100,
  resolvable_template_literal: 100,
  apply: 90,
  bind: 90,
  call: 90,
  computed_access: 90,
  function_reference_assignment: 90,
  optional_chaining: 90,
  reflect_get: 90,
  wrapper_function: 90,
  namespace_import: 70,
  static_import_alias: 70,
  direct_require: 60,
  static_import: 60,
};

function basename(path: string): string {
  return path.split(/[\\/]/u).at(-1) ?? path;
}

function isInternallyAllowed(
  filename: string,
  requestedAllowedFiles: readonly string[],
): boolean {
  const normalizedFilename = basename(filename);
  const requested = new Set(requestedAllowedFiles.map(basename));

  return (
    INTERNAL_ALLOWED_FILES.has(normalizedFilename) &&
    requested.has(normalizedFilename)
  );
}

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;

  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function identifierName(expression: ts.Expression): string | null {
  const current = unwrapExpression(expression);
  return ts.isIdentifier(current) ? current.text : null;
}

function rootIdentifierName(expression: ts.Expression): string | null {
  const current = unwrapExpression(expression);

  if (ts.isIdentifier(current)) {
    return current.text;
  }

  if (
    ts.isPropertyAccessExpression(current) ||
    ts.isElementAccessExpression(current)
  ) {
    return rootIdentifierName(current.expression);
  }

  return null;
}

function bindingIdentifiers(name: ts.BindingName): readonly string[] {
  if (ts.isIdentifier(name)) {
    return [name.text];
  }

  return name.elements.flatMap((element) =>
    ts.isOmittedExpression(element) ? [] : bindingIdentifiers(element.name),
  );
}

function resolveStaticString(
  expression: ts.Expression,
  constants: ReadonlyMap<string, string>,
  visited = new Set<string>(),
): string | null {
  const current = unwrapExpression(expression);

  if (
    ts.isStringLiteralLike(current) ||
    ts.isNoSubstitutionTemplateLiteral(current)
  ) {
    return current.text;
  }

  if (ts.isIdentifier(current)) {
    if (visited.has(current.text)) {
      return null;
    }

    visited.add(current.text);
    return constants.get(current.text) ?? null;
  }

  if (
    ts.isBinaryExpression(current) &&
    current.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = resolveStaticString(current.left, constants, new Set(visited));
    const right = resolveStaticString(
      current.right,
      constants,
      new Set(visited),
    );

    return left !== null && right !== null ? left + right : null;
  }

  return null;
}

function propertyName(
  expression: ts.Expression,
  constants: ReadonlyMap<string, string>,
): string | null {
  const current = unwrapExpression(expression);

  if (ts.isPropertyAccessExpression(current)) {
    return current.name.text;
  }

  if (ts.isElementAccessExpression(current) && current.argumentExpression) {
    return resolveStaticString(current.argumentExpression, constants);
  }

  return null;
}

function isChildProcessModule(value: string | null): boolean {
  return value === "child_process" || value === "node:child_process";
}

function moduleSpecifier(node: ts.ImportDeclaration): string | null {
  return ts.isStringLiteralLike(node.moduleSpecifier)
    ? node.moduleSpecifier.text
    : null;
}

function isProcessGetBuiltinModule(call: ts.CallExpression): boolean {
  const callee = unwrapExpression(call.expression);

  return (
    ts.isPropertyAccessExpression(callee) &&
    identifierName(callee.expression) === "process" &&
    callee.name.text === "getBuiltinModule"
  );
}

function isReflectGet(call: ts.CallExpression): boolean {
  const callee = unwrapExpression(call.expression);

  return (
    ts.isPropertyAccessExpression(callee) &&
    identifierName(callee.expression) === "Reflect" &&
    callee.name.text === "get"
  );
}

function candidateCode(capability: string): string {
  return `SECURITY_BOUNDARY_${capability.toUpperCase()}`;
}

export function analyzeSecurityBoundaries(
  filename: string,
  sourceCode: string,
  allowedFiles: readonly string[],
): readonly AnalysisViolation[] {
  if (isInternallyAllowed(filename, allowedFiles)) {
    return [];
  }

  const sourceFile = ts.createSourceFile(
    filename,
    sourceCode,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS,
  );

  const candidates: Candidate[] = [];
  const variableDeclarations: ts.VariableDeclaration[] = [];
  const functionDeclarations: ts.FunctionDeclaration[] = [];

  const constants = new Map<string, string>();
  const moduleBindings = new Map<string, BindingOrigin>();
  const functionBindings = new Map<string, BindingOrigin>();

  const requireAliases = new Set<string>();
  const createRequireFactories = new Set<string>();
  const createdRequireBindings = new Set<string>();

  function addCandidate(capability: string, node: ts.Node): void {
    candidates.push({
      capability,
      node,
      priority: CAPABILITY_PRIORITIES[capability] ?? 0,
    });
  }

  walk(sourceFile, (node) => {
    if (ts.isVariableDeclaration(node)) {
      variableDeclarations.push(node);
    }

    if (ts.isFunctionDeclaration(node)) {
      functionDeclarations.push(node);
    }

    if (ts.isImportDeclaration(node)) {
      const importedModule = moduleSpecifier(node);

      if (importedModule === "node:module" || importedModule === "module") {
        const bindings = node.importClause?.namedBindings;

        if (bindings && ts.isNamedImports(bindings)) {
          for (const specifier of bindings.elements) {
            const importedName =
              specifier.propertyName?.text ?? specifier.name.text;

            if (importedName === "createRequire") {
              createRequireFactories.add(specifier.name.text);
            }
          }
        }
      }

      if (!isChildProcessModule(importedModule)) {
        return;
      }

      const importClause = node.importClause;

      if (!importClause) {
        addCandidate("static_import", node);
        return;
      }

      if (importClause.name) {
        const origin: BindingOrigin = {
          capability: "static_import",
          node: importClause.name,
        };

        moduleBindings.set(importClause.name.text, origin);
        addCandidate(origin.capability, origin.node);
      }

      const namedBindings = importClause.namedBindings;

      if (!namedBindings) {
        return;
      }

      if (ts.isNamespaceImport(namedBindings)) {
        const origin: BindingOrigin = {
          capability: "namespace_import",
          node: namedBindings,
        };

        moduleBindings.set(namedBindings.name.text, origin);
        addCandidate(origin.capability, origin.node);
        return;
      }

      for (const specifier of namedBindings.elements) {
        const capability = specifier.propertyName
          ? "static_import_alias"
          : "static_import";

        const origin: BindingOrigin = {
          capability,
          node: specifier,
        };

        functionBindings.set(specifier.name.text, origin);
        addCandidate(capability, specifier);
      }

      return;
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      isChildProcessModule(node.moduleSpecifier.text)
    ) {
      addCandidate("re_export", node);
    }
  });

  for (
    let iteration = 0;
    iteration < variableDeclarations.length + 1;
    iteration += 1
  ) {
    let changed = false;

    for (const declaration of variableDeclarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }

      const resolved = resolveStaticString(declaration.initializer, constants);

      if (
        resolved !== null &&
        constants.get(declaration.name.text) !== resolved
      ) {
        constants.set(declaration.name.text, resolved);
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  for (const declaration of variableDeclarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
      continue;
    }

    const initializer = unwrapExpression(declaration.initializer);

    if (ts.isIdentifier(initializer) && initializer.text === "require") {
      requireAliases.add(declaration.name.text);
    }
  }

  for (const declaration of variableDeclarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
      continue;
    }

    const initializer = unwrapExpression(declaration.initializer);

    if (!ts.isCallExpression(initializer)) {
      continue;
    }

    const callee = identifierName(initializer.expression);

    if (callee && createRequireFactories.has(callee)) {
      createdRequireBindings.add(declaration.name.text);
    }
  }

  function classifyModuleLoader(
    call: ts.CallExpression,
  ): LoaderClassification | null {
    const argument = call.arguments[0];

    if (!argument) {
      return null;
    }

    if (call.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const resolved = resolveStaticString(argument, constants);

      if (isChildProcessModule(resolved)) {
        return {
          capability: "dynamic_import",
          node: call,
        };
      }

      if (resolved === null) {
        return {
          capability: "unresolved_suspicious_construction",
          node: call,
        };
      }

      return null;
    }

    if (isProcessGetBuiltinModule(call)) {
      const resolved = resolveStaticString(argument, constants);

      if (isChildProcessModule(resolved)) {
        return {
          capability: "get_builtin_module",
          node: call,
        };
      }

      if (resolved === null) {
        return {
          capability: "unresolved_suspicious_construction",
          node: call,
        };
      }

      return null;
    }

    const callee = identifierName(call.expression);

    if (!callee) {
      return null;
    }

    const isDirectRequire = callee === "require";
    const isRequireAlias = requireAliases.has(callee);
    const isCreatedRequire = createdRequireBindings.has(callee);

    if (!isDirectRequire && !isRequireAlias && !isCreatedRequire) {
      return null;
    }

    const resolved = resolveStaticString(argument, constants);

    if (resolved === null) {
      return {
        capability: "unresolved_suspicious_construction",
        node: call,
      };
    }

    if (!isChildProcessModule(resolved)) {
      return null;
    }

    if (isCreatedRequire) {
      return {
        capability: "create_require",
        node: call,
      };
    }

    if (isRequireAlias) {
      return {
        capability: "aliased_require",
        node: call,
      };
    }

    const unwrappedArgument = unwrapExpression(argument);

    if (ts.isNoSubstitutionTemplateLiteral(unwrappedArgument)) {
      return {
        capability: "resolvable_template_literal",
        node: call,
      };
    }

    if (
      ts.isBinaryExpression(unwrappedArgument) &&
      unwrappedArgument.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      return {
        capability: "resolvable_concatenation",
        node: call,
      };
    }

    if (ts.isIdentifier(unwrappedArgument)) {
      return {
        capability: "dynamic_require",
        node: call,
      };
    }

    return {
      capability: "direct_require",
      node: call,
    };
  }

  for (const declaration of variableDeclarations) {
    const initializer = declaration.initializer
      ? unwrapExpression(declaration.initializer)
      : null;

    if (!initializer) {
      continue;
    }

    if (
      ts.isObjectBindingPattern(declaration.name) &&
      ts.isCallExpression(initializer)
    ) {
      const classification = classifyModuleLoader(initializer);

      if (!classification) {
        continue;
      }

      const capability =
        classification.capability === "unresolved_suspicious_construction"
          ? classification.capability
          : "destructured_require";

      addCandidate(capability, declaration);

      for (const name of bindingIdentifiers(declaration.name)) {
        functionBindings.set(name, {
          capability,
          node: declaration,
        });
      }

      continue;
    }

    if (!ts.isIdentifier(declaration.name)) {
      continue;
    }

    const declaredName = declaration.name.text;

    if (ts.isIdentifier(initializer)) {
      const functionOrigin = functionBindings.get(initializer.text);

      if (functionOrigin) {
        const origin: BindingOrigin = {
          capability: "function_reference_assignment",
          node: declaration,
        };

        functionBindings.set(declaredName, origin);
        addCandidate(origin.capability, origin.node);
        continue;
      }

      const moduleOrigin = moduleBindings.get(initializer.text);

      if (moduleOrigin) {
        moduleBindings.set(declaredName, moduleOrigin);
      }

      continue;
    }

    if (!ts.isCallExpression(initializer)) {
      continue;
    }

    const callCallee = unwrapExpression(initializer.expression);

    if (
      ts.isPropertyAccessExpression(callCallee) ||
      ts.isElementAccessExpression(callCallee)
    ) {
      const method = propertyName(callCallee, constants);
      const targetName = identifierName(callCallee.expression);

      if (method === "bind" && targetName && functionBindings.has(targetName)) {
        const origin: BindingOrigin = {
          capability: "bind",
          node: initializer,
        };

        functionBindings.set(declaredName, origin);
        addCandidate(origin.capability, origin.node);
        continue;
      }
    }

    if (isReflectGet(initializer)) {
      const target = initializer.arguments[0];
      const targetName = target ? identifierName(target) : null;
      const targetOrigin = targetName
        ? moduleBindings.get(targetName)
        : undefined;

      if (
        targetOrigin &&
        ["namespace_import", "static_import"].includes(targetOrigin.capability)
      ) {
        const origin: BindingOrigin = {
          capability: "reflect_get",
          node: initializer,
        };

        functionBindings.set(declaredName, origin);
        addCandidate(origin.capability, origin.node);
        continue;
      }
    }

    const classification = classifyModuleLoader(initializer);

    if (classification) {
      const origin: BindingOrigin = {
        capability: classification.capability,
        node: classification.node,
      };

      moduleBindings.set(declaredName, origin);
      addCandidate(origin.capability, origin.node);
    }
  }

  for (const declaration of functionDeclarations) {
    if (!declaration.body) {
      continue;
    }

    let forbiddenCall: ts.CallExpression | null = null;

    walk(declaration.body, (node) => {
      if (forbiddenCall || !ts.isCallExpression(node)) {
        return;
      }

      const callee = identifierName(node.expression);

      if (callee && functionBindings.has(callee)) {
        forbiddenCall = node;
      }
    });

    if (forbiddenCall) {
      addCandidate("wrapper_function", declaration);
    }
  }

  walk(sourceFile, (node) => {
    if (ts.isElementAccessExpression(node)) {
      const rootName = rootIdentifierName(node.expression);
      const origin = rootName ? moduleBindings.get(rootName) : undefined;

      if (
        origin &&
        ["namespace_import", "static_import"].includes(origin.capability)
      ) {
        addCandidate("computed_access", node);
      }
    }

    if (!ts.isCallExpression(node)) {
      return;
    }

    const callee = unwrapExpression(node.expression);

    if (
      ts.isPropertyAccessExpression(callee) ||
      ts.isElementAccessExpression(callee)
    ) {
      const method = propertyName(callee, constants);
      const targetName = identifierName(callee.expression);

      if (
        method &&
        ["call", "apply", "bind"].includes(method) &&
        targetName &&
        functionBindings.has(targetName)
      ) {
        addCandidate(method, node);
      }
    }

    if (isReflectGet(node)) {
      const target = node.arguments[0];
      const targetName = target ? identifierName(target) : null;
      const origin = targetName ? moduleBindings.get(targetName) : undefined;

      if (
        origin &&
        ["namespace_import", "static_import"].includes(origin.capability)
      ) {
        addCandidate("reflect_get", node);
      }
    }

    if (node.getText(sourceFile).includes("?.")) {
      const rootName = rootIdentifierName(node.expression);
      const origin = rootName ? moduleBindings.get(rootName) : undefined;

      if (
        origin &&
        ["namespace_import", "static_import"].includes(origin.capability)
      ) {
        addCandidate("optional_chaining", node);
      }
    }
  });

  const selected = candidates.slice().sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return left.node.getStart(sourceFile) - right.node.getStart(sourceFile);
  })[0];

  if (!selected) {
    return [];
  }

  const position = sourceFile.getLineAndCharacterOfPosition(
    selected.node.getStart(sourceFile),
  );

  return [
    {
      code: candidateCode(selected.capability),
      file: filename,
      line: position.line + 1,
      column: position.character + 1,
      forbiddenCapability: selected.capability,
      processExecuted: false,
      nodeText: selected.node.getText(sourceFile),
    },
  ];
}
