import { describe, expect, it } from "vitest";
import {
  RUN_STATES,
  allowedTransitions,
  assertTransition,
} from "../src/state-machine.ts";

describe("run state machine", () => {
  it("preserves the approved happy-path transitions", () => {
    expect(allowedTransitions("DRAFT")).toContain("PLAN_READY");
    expect(allowedTransitions("CI_PASSED")).toContain("READY_FOR_HUMAN_MERGE");
    expect(allowedTransitions("READY_FOR_HUMAN_MERGE")).toContain("DONE");
  });

  it("forces change requests through plan revalidation", () => {
    expect(allowedTransitions("CHANGES_REQUESTED")).toEqual([
      "PLAN_READY",
      "CANCELLED",
    ]);
    expect(() =>
      assertTransition("CHANGES_REQUESTED", "READY_TO_DISPATCH"),
    ).toThrow(/not allowed/u);
  });

  it("rejects direct completion from every non-merge state", () => {
    for (const state of RUN_STATES) {
      if (state === "READY_FOR_HUMAN_MERGE" || state === "DONE") continue;
      expect(() => assertTransition(state, "DONE")).toThrow(/not allowed/u);
    }
  });

  it("keeps terminal states terminal", () => {
    expect(allowedTransitions("DONE")).toEqual([]);
    expect(allowedTransitions("CANCELLED")).toEqual([]);
    expect(allowedTransitions("QUARANTINED")).toEqual([]);
  });
});
