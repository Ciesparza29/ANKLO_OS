import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildDockerRunVector,
  VERIFIER_IMAGE_ID,
  VERIFIER_PLATFORM,
  VERIFIER_REPO_DIGEST,
} from "../../src/trusted-process.ts";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const trustedProcessSource = readFileSync(
  join(testDirectory, "../../src/trusted-process.ts"),
  "utf8",
);
const verificationRunnerSource = readFileSync(
  join(testDirectory, "../../src/verification-runner.ts"),
  "utf8",
);
const phaseSource = readFileSync(
  join(testDirectory, "../../src/phase-16-5.ts"),
  "utf8",
);

function indexAfter(
  vector: readonly string[],
  flag: string,
): string | undefined {
  const index = vector.indexOf(flag);
  return index < 0 ? undefined : vector[index + 1];
}

describe("R6 adversarial process boundaries", () => {
  it("builds the complete immutable Docker sandbox vector", () => {
    const vector = buildDockerRunVector({
      sourcePath: "/safe/source",
      workspacePath: "/safe/runtime/workspace",
      nodeModulesPath: "/safe/snapshot/node_modules",
      pnpmRootPath: "/safe/pnpm",
      command: [
        "node",
        "/workspace/node_modules/prettier/bin/prettier.cjs",
        "--check",
        ".",
      ],
    });

    expect(vector.slice(0, 3)).toEqual(["run", "--rm", "--pull"]);
    expect(indexAfter(vector, "--pull")).toBe("never");
    expect(indexAfter(vector, "--network")).toBe("none");
    expect(vector).toContain("--read-only");
    expect(indexAfter(vector, "--cap-drop")).toBe("ALL");
    expect(indexAfter(vector, "--security-opt")).toBe("no-new-privileges:true");
    expect(indexAfter(vector, "--pids-limit")).toBe("256");
    expect(indexAfter(vector, "--memory")).toBe("4g");
    expect(indexAfter(vector, "--cpus")).toBe("2");
    expect(indexAfter(vector, "--user")).toBe("1000:1000");
    expect(indexAfter(vector, "--platform")).toBe(VERIFIER_PLATFORM);
    expect(vector).toContain("/tmp:rw,noexec,nosuid,nodev,size=256m");
    expect(vector).toContain("/home/sandbox:rw,noexec,nosuid,nodev,size=64m");
    expect(vector).toContain("/safe/source:/source:ro");
    expect(vector).toContain("/safe/runtime/workspace:/workspace");
    expect(vector).toContain(
      "/safe/snapshot/node_modules:/workspace/node_modules:ro",
    );
    expect(vector).toContain("/safe/pnpm:/opt/pnpm:ro");
    expect(vector).toContain(VERIFIER_IMAGE_ID);
    expect(vector).not.toContain(VERIFIER_REPO_DIGEST);
    expect(vector.join(" ")).not.toMatch(
      /docker\.sock|:latest|\/bin\/sh|sh -c|npm install|pnpm install|yarn/u,
    );
  });

  it("rejects forbidden Docker socket and personal configuration mounts", () => {
    expect(() =>
      buildDockerRunVector({
        sourcePath: "/var/run/docker.sock",
        workspacePath: "/safe/runtime/workspace",
        nodeModulesPath: "/safe/snapshot/node_modules",
        pnpmRootPath: "/safe/pnpm",
        command: ["node", "--version"],
      }),
    ).toThrow(/forbidden host mount/u);

    expect(() =>
      buildDockerRunVector({
        sourcePath: "/safe/source",
        workspacePath: "/Users/israel/.config/workspace",
        nodeModulesPath: "/safe/snapshot/node_modules",
        pnpmRootPath: "/safe/pnpm",
        command: ["node", "--version"],
      }),
    ).toThrow(/forbidden host mount/u);
  });

  it("keeps the adversarial Codex prompt after an argument terminator", () => {
    expect(trustedProcessSource).toMatch(
      /"exec",\s*"--ignore-user-config",\s*"--ignore-rules",\s*"--strict-config",\s*"-c",\s*"mcp_servers=\{\}",\s*"--sandbox",\s*"read-only",\s*"--ephemeral",\s*"--json",\s*"--output-schema",[\s\S]*?"--cd",[\s\S]*?"--",\s*request\.prompt/u,
    );
    expect(trustedProcessSource).not.toMatch(
      /"--cd",[\s\S]*?"--ignore-rules",\s*"--"/u,
    );
  });

  it("requires structured runtime evidence and persists it", () => {
    expect(verificationRunnerSource).toContain(
      "readonly runtimeEvidence: VerificationRuntimeEvidence;",
    );
    expect(verificationRunnerSource).not.toMatch(
      /readonly\s+runtimeEvidence\s*\?/u,
    );
    expect(verificationRunnerSource).not.toContain("toolVersions?");
    expect(phaseSource).toContain("runtime_evidence: result.runtimeEvidence");
    expect(phaseSource).not.toContain("result.toolVersions");
  });

  it("contains no host execution path for repository verification", () => {
    expect(verificationRunnerSource).toContain("executeDockerVerification");
    expect(verificationRunnerSource).not.toContain("executeNodeVerification");
    expect(trustedProcessSource).not.toContain("anklo-os-verifier:latest");
    expect(trustedProcessSource).not.toContain("executeNodeVerification");
  });
});
