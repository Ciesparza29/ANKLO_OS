import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "../src/contracts.ts";
import { assertCapability } from "../src/policy.ts";

const config = createDefaultConfig("/tmp/anklo/repo", "/tmp/anklo/home");

describe("deny-by-default policy", () => {
  it("allows only explicit safe capabilities", () => {
    expect(() =>
      assertCapability(config.allowedCapabilities, "DIAGNOSE"),
    ).not.toThrow();
  });

  it.each(["ARBITRARY_SHELL", "MERGE", "DEPLOY_PRODUCTION"] as const)(
    "denies %s",
    (capability: "ARBITRARY_SHELL" | "MERGE" | "DEPLOY_PRODUCTION") => {
      expect(() =>
        assertCapability(config.allowedCapabilities, capability),
      ).toThrow(/denied by policy/u);
    },
  );
});
