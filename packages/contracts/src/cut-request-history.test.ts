import { describe, expect, it } from "vitest";
import {
  CUT_REQUEST_HISTORY_ACTIONS,
  cutRequestHistoryEntrySchema,
  cutRequestHistoryResponseSchema,
} from "./index";

const base = {
  id: "00000000-0000-4000-8000-000000000001",
  occurredAt: "2026-07-16T12:00:00.000Z",
  actorReference: "00000000-0000-4000-8000-000000000002",
};

describe("contrato público del historial de solicitudes de corte", () => {
  it("limita las acciones visibles a la allowlist aprobada", () => {
    expect(CUT_REQUEST_HISTORY_ACTIONS).toEqual([
      "CUT_REQUEST_CREATED",
      "CUT_REQUEST_SUBMITTED",
      "CUT_REQUEST_CANCELLED",
    ]);
    for (const action of CUT_REQUEST_HISTORY_ACTIONS) {
      expect(
        cutRequestHistoryEntrySchema.safeParse({
          ...base,
          action,
          ...(action === "CUT_REQUEST_CANCELLED"
            ? { reason: "Motivo ficticio" }
            : {}),
        }).success,
      ).toBe(true);
    }
    expect(
      cutRequestHistoryEntrySchema.safeParse({
        ...base,
        action: "CUT_REQUEST_REOPENED",
      }).success,
    ).toBe(false);
  });

  it("rechaza snapshots, estado y campos internos", () => {
    for (const field of [
      "before",
      "after",
      "before_json",
      "after_json",
      "status",
      "organizationId",
      "correlationId",
    ]) {
      expect(
        cutRequestHistoryEntrySchema.safeParse({
          ...base,
          action: "CUT_REQUEST_CREATED",
          [field]: "no autorizado",
        }).success,
      ).toBe(false);
    }
  });

  it("solo admite motivo en una cancelación", () => {
    expect(
      cutRequestHistoryEntrySchema.safeParse({
        ...base,
        action: "CUT_REQUEST_CREATED",
        reason: "No corresponde",
      }).success,
    ).toBe(false);
    expect(
      cutRequestHistoryEntrySchema.safeParse({
        ...base,
        action: "CUT_REQUEST_CANCELLED",
      }).success,
    ).toBe(false);
  });

  it("valida una respuesta estricta", () => {
    expect(
      cutRequestHistoryResponseSchema.safeParse({
        history: [{ ...base, action: "CUT_REQUEST_SUBMITTED" }],
      }).success,
    ).toBe(true);
    expect(
      cutRequestHistoryResponseSchema.safeParse({ history: [], extra: true })
        .success,
    ).toBe(false);
  });
});
