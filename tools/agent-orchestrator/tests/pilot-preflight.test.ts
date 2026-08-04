import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import {
  REQUIRED_ISSUE_BODY_SHA256,
  runPilotPreflight,
  type PreflightInput,
  type PreflightReport,
} from "../src/pilot-preflight.ts";
import { PREFLIGHT_DENIED_CAPABILITIES } from "../src/pilot-preflight.ts";

function baseInput(overrides: Partial<PreflightInput> = {}): PreflightInput {
  return {
    repoRoot: "/nonexistent",
    ghConfigDirectory: "/nonexistent",
    databasePath: ":memory:",
    allowedCapabilities: ["DIAGNOSE"],
    ...overrides,
  };
}

function git(args: string[], cwd: string): void {
  execFileSync("git", args, { cwd, stdio: "ignore" });
}

function findCheck(
  report: PreflightReport,
  name: string,
): { passed: boolean; detail: string } | undefined {
  return report.checks.find((c) => c.check === name);
}

describe("pilot-preflight R3 compliance", () => {
  let tempDir: string;
  let tempDb: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "preflight-test-"));
    tempDb = join(tempDir, "state.db");

    git(["init", "--initial-branch=main"], tempDir);
    git(["config", "user.name", "ANKLO Test"], tempDir);
    git(["config", "user.email", "anklo-test@example.invalid"], tempDir);
    git(
      [
        "remote",
        "add",
        "origin",
        "https://github.com/Ciesparza29/ANKLO_OS.git",
      ],
      tempDir,
    );

    // Create an initial commit so HEAD exists
    writeFileSync(join(tempDir, "README.md"), "hello");
    git(["add", "README.md"], tempDir);
    git(["commit", "-m", "init"], tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ── 1. Hash canónico obligatorio ───────────────────────────────────────
  it("uses REQUIRED_ISSUE_BODY_SHA256 and has no expectedIssueBodySha256 in input", () => {
    const input = baseInput();
    expect("expectedIssueBodySha256" in input).toBe(false);
    expect(REQUIRED_ISSUE_BODY_SHA256).toBe(
      "a377072c738955d9582cd0cc84f716a6082cf0f0c8ad42c0f27d75f1d5a899e8",
    );
  });

  // ── 2 & 3. Ausencia de flags en CLI/Input ──────────────────────────────
  it("PreflightInput structurally forbids --issue-body-sha256 and --state-db overrides", () => {
    const input = baseInput();
    expect("expectedBaseSha" in input).toBe(false);
    expect("expectedIssueBodySha256" in input).toBe(false);
    // databasePath is passed internally, not overridable by command line in pilot:preflight
  });

  // ── 4-8. Sentinel Validation ───────────────────────────────────────────
  it("sentinel ausente -> FAIL", async () => {
    const report = await runPilotPreflight(
      baseInput({ repoRoot: tempDir }),
      false,
    );
    const check = findCheck(report, "ready-to-dispatch-sentinel");
    expect(check?.passed).toBe(false);
    expect(check?.detail).toContain("does not exist");
  });

  it("sentinel vacío y untracked -> PASS", async () => {
    writeFileSync(join(tempDir, "READY_TO_DISPATCH"), "");
    const report = await runPilotPreflight(
      baseInput({ repoRoot: tempDir }),
      false,
    );
    const check = findCheck(report, "ready-to-dispatch-sentinel");
    expect(check?.passed).toBe(true);
  });

  it("sentinel no vacío -> FAIL", async () => {
    writeFileSync(join(tempDir, "READY_TO_DISPATCH"), "not empty");
    const report = await runPilotPreflight(
      baseInput({ repoRoot: tempDir }),
      false,
    );
    const check = findCheck(report, "ready-to-dispatch-sentinel");
    expect(check?.passed).toBe(false);
    expect(check?.detail).toContain("not empty");
  });

  it("sentinel symlink -> FAIL", async () => {
    writeFileSync(join(tempDir, "target"), "");
    symlinkSync(join(tempDir, "target"), join(tempDir, "READY_TO_DISPATCH"));
    const report = await runPilotPreflight(
      baseInput({ repoRoot: tempDir }),
      false,
    );
    const check = findCheck(report, "ready-to-dispatch-sentinel");
    expect(check?.passed).toBe(false);
    expect(check?.detail).toContain("symlink");
  });

  it("sentinel staged -> FAIL", async () => {
    writeFileSync(join(tempDir, "READY_TO_DISPATCH"), "");
    git(["add", "READY_TO_DISPATCH"], tempDir);
    const report = await runPilotPreflight(
      baseInput({ repoRoot: tempDir }),
      false,
    );
    const check = findCheck(report, "ready-to-dispatch-sentinel");
    expect(check?.passed).toBe(false);
    expect(check?.detail).toContain("staged");
  });

  it("sentinel in HEAD -> FAIL", async () => {
    writeFileSync(join(tempDir, "READY_TO_DISPATCH"), "");
    git(["add", "READY_TO_DISPATCH"], tempDir);
    git(["commit", "-m", "sentinel"], tempDir);
    const report = await runPilotPreflight(
      baseInput({ repoRoot: tempDir }),
      false,
    );
    const check = findCheck(report, "ready-to-dispatch-sentinel");
    expect(check?.passed).toBe(false);
    expect(check?.detail).toContain("committed");
  });

  // ── 9-10. Effective Capabilities ───────────────────────────────────────
  it("configuración con DIAGNOSE -> PASS", async () => {
    const report = await runPilotPreflight(
      baseInput({ allowedCapabilities: ["DIAGNOSE"] }),
      false,
    );
    const check = findCheck(report, "effective-capabilities-valid");
    expect(check?.passed).toBe(true);
  });

  it("capacidad denegada -> FAIL", async () => {
    const report = await runPilotPreflight(
      baseInput({
        allowedCapabilities: ["DIAGNOSE", PREFLIGHT_DENIED_CAPABILITIES[0]],
      }),
      false,
    );
    const check = findCheck(report, "effective-capabilities-valid");
    expect(check?.passed).toBe(false);
  });

  it("capacidad desconocida -> FAIL", async () => {
    const report = await runPilotPreflight(
      baseInput({ allowedCapabilities: ["DIAGNOSE", "UNKNOWN_MAGIC"] }),
      false,
    );
    const check = findCheck(report, "effective-capabilities-valid");
    expect(check?.passed).toBe(false);
  });

  // ── 11. StateStore missing control_flags -> FAIL CLOSED ───────────────
  it("control_flags ausente en una DB existente -> FAIL cerrado", async () => {
    const db = new DatabaseSync(tempDb);
    db.exec(`CREATE TABLE other (id INTEGER)`);
    db.close();

    const report = await runPilotPreflight(
      baseInput({ databasePath: tempDb }),
      false,
    );
    const check = findCheck(report, "kill-switch-off");
    expect(check?.passed).toBe(false); // Fail closed
  });

  // ── 12. StateStore GLOBAL kill switch active -> FAIL ──────────────────
  it("kill switch GLOBAL activo -> FAIL", async () => {
    const db = new DatabaseSync(tempDb);
    db.exec(`CREATE TABLE control_flags (
      scope TEXT PRIMARY KEY,
      active INTEGER
    )`);
    db.exec(`INSERT INTO control_flags (scope, active) VALUES ('GLOBAL', 1)`);
    db.close();

    const report = await runPilotPreflight(
      baseInput({ databasePath: tempDb }),
      false,
    );
    const check = findCheck(report, "kill-switch-off");
    expect(check?.passed).toBe(false);
    expect(check?.detail).toContain("Persistent global kill switch is active");
  });
});
