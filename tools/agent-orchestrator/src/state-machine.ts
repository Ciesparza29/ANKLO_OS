import { OrchestratorError } from "./errors.ts";

export const RUN_STATES = [
  "DRAFT",
  "NEEDS_DECISION",
  "PLAN_READY",
  "PLAN_APPROVED",
  "READY_TO_DISPATCH",
  "RUNNING_IMPLEMENTATION",
  "BLOCKED",
  "IMPLEMENTATION_COMPLETE",
  "READY_FOR_REVIEW",
  "RUNNING_REVIEW",
  "CHANGES_REQUESTED",
  "READY_FOR_PUSH",
  "PUSH_AUTHORIZED",
  "PUSHED",
  "READY_FOR_PR",
  "PR_OPEN",
  "CI_PENDING",
  "CI_RUNNING",
  "CI_FAILED",
  "CI_PASSED",
  "READY_FOR_HUMAN_MERGE",
  "DONE",
  "CANCELLED",
  "QUARANTINED",
] as const;

export type RunState = (typeof RUN_STATES)[number];

const TRANSITIONS: Readonly<Record<RunState, readonly RunState[]>> = {
  DRAFT: ["NEEDS_DECISION", "PLAN_READY"],
  NEEDS_DECISION: ["PLAN_READY", "CANCELLED"],
  PLAN_READY: ["PLAN_APPROVED"],
  PLAN_APPROVED: ["READY_TO_DISPATCH"],
  READY_TO_DISPATCH: ["RUNNING_IMPLEMENTATION"],
  RUNNING_IMPLEMENTATION: [
    "IMPLEMENTATION_COMPLETE",
    "BLOCKED",
    "QUARANTINED",
    "CANCELLED",
  ],
  BLOCKED: [],
  IMPLEMENTATION_COMPLETE: ["READY_FOR_REVIEW"],
  READY_FOR_REVIEW: ["RUNNING_REVIEW"],
  RUNNING_REVIEW: [
    "READY_FOR_PUSH",
    "CHANGES_REQUESTED",
    "BLOCKED",
    "QUARANTINED",
  ],
  CHANGES_REQUESTED: ["PLAN_READY", "CANCELLED"],
  READY_FOR_PUSH: ["PUSH_AUTHORIZED"],
  PUSH_AUTHORIZED: ["PUSHED"],
  PUSHED: ["READY_FOR_PR"],
  READY_FOR_PR: ["PR_OPEN"],
  PR_OPEN: ["CI_PENDING", "CI_RUNNING"],
  CI_PENDING: ["CI_RUNNING", "CI_FAILED"],
  CI_RUNNING: ["CI_FAILED", "CI_PASSED"],
  CI_FAILED: ["CHANGES_REQUESTED", "BLOCKED", "CANCELLED"],
  CI_PASSED: ["READY_FOR_HUMAN_MERGE"],
  READY_FOR_HUMAN_MERGE: ["DONE", "BLOCKED", "QUARANTINED", "CANCELLED"],
  DONE: [],
  CANCELLED: [],
  QUARANTINED: [],
};

export function isRunState(value: string): value is RunState {
  return (RUN_STATES as readonly string[]).includes(value);
}

export function allowedTransitions(from: RunState): readonly RunState[] {
  return TRANSITIONS[from];
}

export function assertTransition(from: RunState, to: RunState): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new OrchestratorError(
      "INVALID_STATE_TRANSITION",
      `Transition ${from} -> ${to} is not allowed`,
      { details: { from, to, allowed: TRANSITIONS[from] } },
    );
  }
}
