import { createHash } from "node:crypto";
import { existsSync, lstatSync, statSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_VERSION } from "./contracts.ts";
import { executeBootstrapGitQuery } from "./trusted-process.ts";
import { bootstrapIssue27View } from "./github-adapter.ts";
import {
  SqliteStateStore,
  type ControlStateInspection,
} from "./state-store.ts";
import {
  DENIED_CAPABILITIES,
  SAFE_CAPABILITIES,
  isSafeCapability,
} from "./policy.ts";

export const PILOT_PREFLIGHT_SCHEMA_VERSION = SCHEMA_VERSION;

/** Exact repository slug required for Issue #27. */
export const REQUIRED_REPOSITORY = "Ciesparza29/ANKLO_OS";

/** The issue number that pilot:preflight is scoped to. */
export const SUPERVISED_PILOT_ISSUE_NUMBER = 27;

/** The exact base SHA that must be present on the target branch. */
export const REQUIRED_BASE_SHA = "633c98c6effd7523a623c6e3a180e9dc06b877cf";

/** The exact body SHA-256 required for Issue #27. */
export const REQUIRED_ISSUE_BODY_SHA256 =
  "a377072c738955d9582cd0cc84f716a6082cf0f0c8ad42c0f27d75f1d5a899e8";

/** The target branch for the supervised pilot. */
export const SUPERVISED_PILOT_BRANCH = "feat/27-supervised-pilot-v11";

/** The base branch that HEAD must track. */
export const REQUIRED_BASE_BRANCH = "main";

/**
 * Denied capabilities sourced directly from policy.ts.
 * Structurally verified against the canonical policy module at preflight time.
 */
export const PREFLIGHT_DENIED_CAPABILITIES = DENIED_CAPABILITIES;

export type PreflightDeniedCapability =
  (typeof PREFLIGHT_DENIED_CAPABILITIES)[number];

export interface PreflightCheckResult {
  /** Human-readable name of the check. */
  readonly check: string;
  /** Whether the check passed. */
  readonly passed: boolean;
  /** Additional diagnostic detail (never contains secrets). */
  readonly detail: string;
}

export interface PreflightReport {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly issueNumber: typeof SUPERVISED_PILOT_ISSUE_NUMBER;
  readonly repository: string;
  readonly baseSha: string;
  readonly branch: string;
  readonly issueBodySha256: string | null;
  readonly checks: readonly PreflightCheckResult[];
  readonly passed: boolean;
  /** Effects executed — always 0; preflight is diagnostic-only. */
  readonly effectsExecuted: 0;
}

export interface PreflightInput {
  /**
   * Path to the repository root.  Must be an existing directory.
   */
  readonly repoRoot: string;
  /**
   * Path to the GitHub CLI configuration directory.
   */
  readonly ghConfigDirectory: string;
  /**
   * Path to the SQLite state database.
   */
  readonly databasePath: string;
  /**
   * Effective capabilities allowed by the runtime configuration.
   */
  readonly allowedCapabilities: readonly string[];
}

/**
 * Compute SHA-256 of the exact bytes of the supplied string (UTF-8 encoded)
 * without any normalisation.
 */
export function sha256Exact(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function check(
  name: string,
  passed: boolean,
  detail: string,
): PreflightCheckResult {
  return Object.freeze({ check: name, passed, detail });
}

/** Exact remote URL patterns that satisfy the repository identity requirement. */
const EXACT_REMOTE_PATTERNS: readonly RegExp[] = [
  /^https:\/\/github\.com\/Ciesparza29\/ANKLO_OS$/u,
  /^https:\/\/github\.com\/Ciesparza29\/ANKLO_OS\.git$/u,
  /^git@github\.com:Ciesparza29\/ANKLO_OS$/u,
  /^git@github\.com:Ciesparza29\/ANKLO_OS\.git$/u,
];

function isExactRemoteMatch(origin: string): boolean {
  return EXACT_REMOTE_PATTERNS.some((pattern) => pattern.test(origin));
}

/**
 * Parse git status --porcelain=v1 output and determine if the tree is valid.
 *
 * Valid means: the only entry is exactly `?? READY_TO_DISPATCH`.
 * Returns `{ onlyReadyToDispatch: true }` when only `?? READY_TO_DISPATCH` is present,
 * `{ onlyReadyToDispatch: false }` for any other dirty state or completely clean state.
 */
function parseGitStatus(porcelainOutput: string): {
  onlyReadyToDispatch: boolean;
  lines: readonly string[];
} {
  const lines = porcelainOutput.split("\n").filter((line) => line.length > 0);
  const onlyReadyToDispatch =
    lines.length === 1 && lines[0] === "?? READY_TO_DISPATCH";
  return { onlyReadyToDispatch, lines };
}

/**
 * Run pilot preflight diagnostics for Issue #27.
 *
 * This function is **diagnostic-only**: it never creates directories, SQLite
 * databases, branches, worktrees, files, leases, approvals, or audit events.
 * Calling it with `apply: true` is rejected before any work is performed.
 *
 * @param input   All external state the preflight needs, injected by the caller.
 * @param apply   Must be `false`.  Pass `true` only to get the rejection error.
 * @throws        `Error` when `apply` is `true`.
 */
export async function runPilotPreflight(
  input: PreflightInput,
  apply: boolean,
): Promise<PreflightReport> {
  if (apply) {
    throw new Error(
      "APPLY_NOT_SUPPORTED: pilot:preflight is diagnostic-only and never executes effects",
    );
  }

  const checks: PreflightCheckResult[] = [];

  // ── 1. Repository root exists ──────────────────────────────────────────
  const repoRootExists =
    typeof input.repoRoot === "string" &&
    input.repoRoot.length > 0 &&
    existsSync(input.repoRoot) &&
    statSync(input.repoRoot).isDirectory();

  checks.push(
    check(
      "repository-root-exists",
      repoRootExists,
      repoRootExists
        ? `Repository root present at ${input.repoRoot}`
        : `Repository root not found: ${input.repoRoot}`,
    ),
  );

  // ── 2. Repository identity (exact remote match, no includes) ──────────
  let remoteIdentityOk = false;
  let observedOrigin = "(unknown)";
  if (repoRootExists) {
    try {
      const topLevel = executeBootstrapGitQuery(
        input.repoRoot,
        "show-toplevel",
      ).trim();
      observedOrigin = executeBootstrapGitQuery(
        input.repoRoot,
        "get-remote-origin",
      ).trim();
      if (topLevel === input.repoRoot && isExactRemoteMatch(observedOrigin)) {
        remoteIdentityOk = true;
      }
    } catch {
      // remoteIdentityOk remains false
    }
  }

  checks.push(
    check(
      "repository-identity",
      remoteIdentityOk,
      remoteIdentityOk
        ? `Git remote exactly matches ${REQUIRED_REPOSITORY}`
        : `Git remote ${observedOrigin} does not match ${REQUIRED_REPOSITORY}`,
    ),
  );

  // ── 3. Issue #27 is open ──────────────────────────────────────────────
  let issueBody: string | null = null;
  let issueOk = false;
  try {
    const issue = bootstrapIssue27View(input.ghConfigDirectory);
    if (issue.state === "OPEN" && issue.number === 27) {
      issueBody = issue.body;
      issueOk = true;
    }
  } catch {
    // issueOk remains false
  }

  checks.push(
    check(
      "issue-27-open",
      issueOk,
      issueOk
        ? "Issue #27 is open and fetched securely"
        : "Could not verify Issue #27 is open",
    ),
  );

  // ── 4. Issue body SHA-256 (exact, no normalisation) ───────────────────
  const issueBodySha256 = issueBody !== null ? sha256Exact(issueBody) : null;

  let sha256CheckPassed = false;
  let sha256Detail = "Issue body not available for hashing";

  if (issueBodySha256 !== null) {
    sha256CheckPassed = issueBodySha256 === REQUIRED_ISSUE_BODY_SHA256;
    sha256Detail = sha256CheckPassed
      ? `Issue body SHA-256 matches expected value`
      : `Issue body SHA-256 mismatch: computed ${issueBodySha256} expected ${REQUIRED_ISSUE_BODY_SHA256}`;
  }

  checks.push(
    check("issue-body-sha256-exact", sha256CheckPassed, sha256Detail),
  );

  // ── 5. Base SHA (canonical, no operator override) ─────────────────────
  let headSha = "";
  if (repoRootExists) {
    try {
      headSha = executeBootstrapGitQuery(
        input.repoRoot,
        "rev-parse-head",
      ).trim();
    } catch {
      // headSha remains empty
    }
  }

  const baseShaOk =
    headSha.length === 40 &&
    headSha.toLowerCase() === REQUIRED_BASE_SHA.toLowerCase();

  checks.push(
    check(
      "base-sha-exact",
      baseShaOk,
      baseShaOk
        ? `HEAD SHA matches required base SHA ${REQUIRED_BASE_SHA}`
        : `HEAD SHA ${headSha || "(unknown)"} does not match required base SHA ${REQUIRED_BASE_SHA}`,
    ),
  );

  // ── 6. Branch is main ─────────────────────────────────────────────────
  let currentBranch = "";
  if (repoRootExists) {
    try {
      currentBranch = executeBootstrapGitQuery(
        input.repoRoot,
        "show-current-branch",
      ).trim();
    } catch {
      // currentBranch remains empty
    }
  }
  const branchOk = currentBranch === REQUIRED_BASE_BRANCH;

  checks.push(
    check(
      "branch-is-main",
      branchOk,
      branchOk
        ? `Current branch is ${REQUIRED_BASE_BRANCH}`
        : `Current branch is ${currentBranch || "(unknown)"}, expected ${REQUIRED_BASE_BRANCH}`,
    ),
  );

  // ── 7. Working-tree and index cleanliness ─────────────────────────────
  // Valid states: the only entry is `?? READY_TO_DISPATCH`
  let statusParsed = {
    onlyReadyToDispatch: false,
    lines: [] as readonly string[],
  };
  if (repoRootExists) {
    try {
      const statusRaw = executeBootstrapGitQuery(
        input.repoRoot,
        "status-porcelain",
      );
      statusParsed = parseGitStatus(statusRaw);
    } catch {
      // statusParsed remains all-false
    }
  }

  const gitStateValid = statusParsed.onlyReadyToDispatch;

  checks.push(
    check(
      "git-state-valid",
      gitStateValid,
      gitStateValid
        ? "Only untracked READY_TO_DISPATCH present (acceptable)"
        : statusParsed.lines.length === 0
          ? "Working tree is completely empty of changes (READY_TO_DISPATCH required)"
          : `Working tree has ${statusParsed.lines.length} dirty entries`,
    ),
  );

  // ── 8. Kill switch is off (env + StateStore) ──────────────────────────
  const envKill = process.env.ANKLO_ORCHESTRATOR_KILL_SWITCH === "1";
  let stateInspection: ControlStateInspection;
  try {
    stateInspection = SqliteStateStore.inspectControlStateReadOnly(
      input.databasePath,
    );
  } catch {
    // Fail closed: if inspection itself fails, treat as active.
    stateInspection = Object.freeze({
      databaseExists: false,
      quarantineMarkerActive: true,
      globalKillSwitchActive: true,
      runKillSwitchActive: false,
      runQuarantined: false,
    });
  }

  const killSwitchOff =
    !envKill &&
    !stateInspection.globalKillSwitchActive &&
    !stateInspection.quarantineMarkerActive;

  checks.push(
    check(
      "kill-switch-off",
      killSwitchOff,
      killSwitchOff
        ? "Kill switch is not active"
        : envKill
          ? "ANKLO_ORCHESTRATOR_KILL_SWITCH=1 is active"
          : stateInspection.quarantineMarkerActive
            ? "Quarantine marker is active"
            : "Persistent global kill switch is active in state database",
    ),
  );

  // ── 9. Denied capabilities verified from policy.ts ────────────────────
  // Verify structurally: every denied capability is NOT in the safe list,
  // and the list itself is non-empty.
  const deniedCapsOk =
    PREFLIGHT_DENIED_CAPABILITIES.length > 0 &&
    PREFLIGHT_DENIED_CAPABILITIES.every((cap) => !isSafeCapability(cap)) &&
    SAFE_CAPABILITIES.every(
      (cap) =>
        !(PREFLIGHT_DENIED_CAPABILITIES as readonly string[]).includes(cap),
    );

  checks.push(
    check(
      "denied-capabilities-verified",
      deniedCapsOk,
      deniedCapsOk
        ? `All ${PREFLIGHT_DENIED_CAPABILITIES.length} denied capabilities confirmed absent from safe allowlist`
        : "Denied capabilities overlap with safe capabilities or list is empty",
    ),
  );

  // ── 10. READY_TO_DISPATCH sentinel ────────────────────────────────────
  // The sentinel must be: existing, regular file, empty, not a symlink,
  // untracked, not staged, not in index, and not in HEAD.
  let sentinelOk = false;
  let sentinelDetail = "READY_TO_DISPATCH check could not run";

  if (repoRootExists) {
    const sentinelPath = join(input.repoRoot, "READY_TO_DISPATCH");
    const existsLocally = existsSync(sentinelPath);

    if (!existsLocally) {
      // Sentinel must exist.
      sentinelOk = false;
      sentinelDetail = "READY_TO_DISPATCH does not exist";
    } else {
      // Sentinel exists: verify all properties.
      try {
        const lstats = lstatSync(sentinelPath);
        const isSymlink = lstats.isSymbolicLink();
        const isRegularFile = lstats.isFile();
        const isEmpty = lstats.size === 0;

        // Check if in HEAD via ls-tree.
        const headCheck = executeBootstrapGitQuery(
          input.repoRoot,
          "ready-to-dispatch-in-head",
        ).trim();
        const inHead = headCheck.length > 0;

        // Check if staged in index via ls-files --stage.
        const stageOutput = executeBootstrapGitQuery(
          input.repoRoot,
          "ls-files-stage",
        );
        const inIndex = stageOutput
          .split("\n")
          .some(
            (line) => line.length > 0 && line.endsWith("\tREADY_TO_DISPATCH"),
          );

        // Check if in untracked list.
        const othersOutput = executeBootstrapGitQuery(
          input.repoRoot,
          "ls-files-others",
        );
        const isUntracked = othersOutput
          .split("\n")
          .includes("READY_TO_DISPATCH");

        if (isSymlink) {
          sentinelDetail =
            "READY_TO_DISPATCH is a symlink — must be a regular file";
        } else if (!isRegularFile) {
          sentinelDetail = "READY_TO_DISPATCH is not a regular file";
        } else if (!isEmpty) {
          sentinelDetail = `READY_TO_DISPATCH is not empty (${lstats.size} bytes)`;
        } else if (inHead) {
          sentinelDetail = "READY_TO_DISPATCH is committed in HEAD";
        } else if (inIndex) {
          sentinelDetail = "READY_TO_DISPATCH is staged in the index";
        } else if (!isUntracked) {
          sentinelDetail = "READY_TO_DISPATCH is not in the untracked list";
        } else {
          sentinelOk = true;
          sentinelDetail =
            "READY_TO_DISPATCH is regular, empty, untracked, not staged, not committed";
        }
      } catch {
        sentinelDetail = "READY_TO_DISPATCH verification failed";
      }
    }
  }

  checks.push(check("ready-to-dispatch-sentinel", sentinelOk, sentinelDetail));

  // ── 11. Effective capabilities validation ──────────────────────────────
  const hasDiagnose = input.allowedCapabilities.includes("DIAGNOSE");
  const allSafe = input.allowedCapabilities.every(isSafeCapability);
  const noneDenied = input.allowedCapabilities.every(
    (cap) =>
      !(PREFLIGHT_DENIED_CAPABILITIES as readonly string[]).includes(cap),
  );

  const capsOk = hasDiagnose && allSafe && noneDenied;

  checks.push(
    check(
      "effective-capabilities-valid",
      capsOk,
      capsOk
        ? "Capabilities are valid and safe"
        : "Invalid, denied, or missing capabilities in configuration",
    ),
  );

  // ── Summary ───────────────────────────────────────────────────────────
  const allPassed = checks.every((c) => c.passed);

  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    issueNumber: SUPERVISED_PILOT_ISSUE_NUMBER,
    repository: REQUIRED_REPOSITORY,
    baseSha: REQUIRED_BASE_SHA,
    branch: REQUIRED_BASE_BRANCH,
    issueBodySha256,
    checks: Object.freeze([...checks]),
    passed: allPassed,
    effectsExecuted: 0,
  });
}
