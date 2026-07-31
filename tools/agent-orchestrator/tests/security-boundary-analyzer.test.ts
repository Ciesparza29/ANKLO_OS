import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { analyzeSecurityBoundaries } from "../src/security-boundary-analyzer";

type FixtureManifestEntry = Readonly<{
  id: string;
  file: string;
  capability: string;
}>;

const fixtureDirectory = fileURLToPath(
  new URL("./security-acceptance/fixtures/", import.meta.url),
);

const manifest = JSON.parse(
  readFileSync(join(fixtureDirectory, "manifest.json"), "utf8"),
) as readonly FixtureManifestEntry[];

describe("security boundary analyzer", () => {
  it("rejects all twenty hostile AST fixtures deterministically", () => {
    expect(manifest).toHaveLength(20);

    for (const fixture of manifest) {
      const source = readFileSync(join(fixtureDirectory, fixture.file), "utf8");

      const first = analyzeSecurityBoundaries(fixture.file, source, [
        "trusted-process.ts",
      ]);

      const second = analyzeSecurityBoundaries(fixture.file, source, [
        "trusted-process.ts",
      ]);

      expect(first, fixture.id).toEqual(second);
      expect(first, fixture.id).toHaveLength(1);

      const violation = first[0];

      expect(violation, fixture.id).toBeDefined();

      if (!violation) {
        continue;
      }

      expect(violation.code, fixture.id).toMatch(/^[A-Z][A-Z0-9_]+$/u);
      expect(violation.file, fixture.id).toBe(fixture.file);
      expect(violation.line, fixture.id).toBeGreaterThan(0);
      expect(violation.column, fixture.id).toBeGreaterThan(0);
      expect(violation.forbiddenCapability, fixture.id).toBe(
        fixture.capability,
      );
      expect(violation.processExecuted, fixture.id).toBe(false);
      expect(violation.nodeText?.trim().length, fixture.id).toBeGreaterThan(0);
    }
  });

  it("ignores comments and harmless string literals", () => {
    const result = analyzeSecurityBoundaries(
      "safe-decoy.ts",
      [
        "// node:child_process must remain documentation only",
        'const documentation = "node:child_process";',
        "void documentation;",
      ].join("\n"),
      ["trusted-process.ts"],
    );

    expect(result).toEqual([]);
  });

  it("allows only the internal trusted process boundary", () => {
    const trustedResult = analyzeSecurityBoundaries(
      "trusted-process.ts",
      'import { spawn } from "node:child_process";',
      ["trusted-process.ts"],
    );

    expect(trustedResult).toEqual([]);

    const callerSuppliedBypass = analyzeSecurityBoundaries(
      "unsafe-process.ts",
      'import { spawn } from "node:child_process";',
      ["unsafe-process.ts", "trusted-process.ts"],
    );

    expect(callerSuppliedBypass.length).toBeGreaterThan(0);
    expect(
      callerSuppliedBypass.every(
        (violation) => violation.processExecuted === false,
      ),
    ).toBe(true);
  });
});
