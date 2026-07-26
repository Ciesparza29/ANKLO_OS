import { describe, expect, it } from "vitest";
import { allowedTransitions, assertTransition } from "../src/state-machine.ts";

describe("run state machine", () => {
  it("preserves the approved happy-path transitions", () => {
    expect(allowedTransitions("DRAFT")).toContain("PLAN_READY");
    expect(allowedTransitions("CI_PASSED")).toContain("READY_FOR_HUMAN_MERGE");
    expect(allowedTransitions("READY_FOR_HUMAN_MERGE")).toContain("DONE");
  });

  it("rejects direct completion from draft", () => {
    expect(() => assertTransition("DRAFT", "DONE")).toThrow(/not allowed/u);
  });

  it("keeps terminal states terminal", () => {
    expect(allowedTransitions("DONE")).toEqual([]);
    expect(allowedTransitions("CANCELLED")).toEqual([]);
    expect(allowedTransitions("QUARANTINED")).toEqual([]);
  });
});
