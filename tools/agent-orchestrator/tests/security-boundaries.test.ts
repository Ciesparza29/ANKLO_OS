import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDir = fileURLToPath(new URL("../src", import.meta.url));
const forbiddenImports = [
  "node:child_process",
  "node:http",
  "node:https",
  "node:net",
  "node:dgram",
  "node:cluster",
];

describe("static security boundaries", () => {
  it("does not import shell execution or network-listener modules", () => {
    const source = readdirSync(sourceDir)
      .filter((file) => file.endsWith(".ts"))
      .map((file) => readFileSync(join(sourceDir, file), "utf8"))
      .join("\n");

    for (const forbidden of forbiddenImports) {
      expect(source).not.toContain(`from \"${forbidden}\"`);
      expect(source).not.toContain(`from '${forbidden}'`);
    }
  });
});
