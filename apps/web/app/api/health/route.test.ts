import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "@anklo/contracts";
import { createHealthResponse } from "./route";

describe("health response", () => {
  it("returns the strict shared contract", () => {
    const result = createHealthResponse(new Date("2026-07-10T12:00:00.000Z"));
    expect(healthResponseSchema.parse(result)).toEqual({
      status: "ok",
      service: "anklo-os-web",
      timestamp: "2026-07-10T12:00:00.000Z",
      version: "0.0.0",
    });
    expect(Object.keys(result).sort()).toEqual([
      "service",
      "status",
      "timestamp",
      "version",
    ]);
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
