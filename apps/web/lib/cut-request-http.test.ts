import { CutRequestDomainError } from "@anklo/domain";
import {
  CutRequestAuthorizationError,
  CutRequestNotFoundError,
} from "@anklo/domain";
import { describe, expect, it } from "vitest";
import { createCutRequestSchema } from "@anklo/contracts";
import { apiError, parseJson } from "./cut-request-http";

describe("contratos HTTP de solicitud de corte", () => {
  it("rechaza formulario sin líneas y magnitudes inválidas", () => {
    const base = {
      clientOperationId: "00000000-0000-4000-8000-000000000001",
      requestingUnit: "Unidad ficticia",
      requester: "Solicitante ficticio",
      currentCustodian: "Custodio ficticio",
      executionMode: "INTERNAL",
      priority: "Normal",
      requiredAt: "2026-07-20T12:00:00.000Z",
    };
    expect(
      createCutRequestSchema.safeParse({ ...base, lines: [] }).success,
    ).toBe(false);
    expect(
      createCutRequestSchema.safeParse({
        ...base,
        lines: [
          {
            productSpecification: "Producto",
            quantity: "-1",
            unit: "MM",
            requestedLength: "0",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("exige proveedor externo y prohíbe proveedor en modalidad interna", () => {
    const values = {
      clientOperationId: "00000000-0000-4000-8000-000000000001",
      requestingUnit: "Unidad",
      requester: "Solicitante",
      currentCustodian: "Custodio",
      priority: "Normal",
      requiredAt: "2026-07-20T12:00:00.000Z",
      lines: [
        {
          productSpecification: "Producto",
          quantity: "1",
          unit: "MM",
          requestedLength: "2",
        },
      ],
    };
    expect(
      createCutRequestSchema.safeParse({ ...values, executionMode: "EXTERNAL" })
        .success,
    ).toBe(false);
    expect(
      createCutRequestSchema.safeParse({
        ...values,
        executionMode: "INTERNAL",
        externalProvider: "Inventado",
      }).success,
    ).toBe(false);
  });

  it("parsea JSON válido y rechaza JSON roto", async () => {
    await expect(
      parseJson(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ value: "ok" }),
        }),
        { parse: (value: unknown) => value as { value: string } } as never,
      ),
    ).resolves.toEqual({ value: "ok" });
    await expect(
      parseJson(
        new Request("http://localhost", { method: "POST", body: "{" }),
        { parse: (value: unknown) => value } as never,
      ),
    ).rejects.toThrow();
  });

  it.each([
    [new CutRequestAuthorizationError("forbidden"), 403, "FORBIDDEN"],
    [new CutRequestNotFoundError("hidden"), 404, "NOT_FOUND"],
    [
      new CutRequestDomainError("VERSION_CONFLICT", "conflict"),
      409,
      "VERSION_CONFLICT",
    ],
  ])("traduce errores seguros", async (error, status, code) => {
    const response = apiError(error);
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: code });
  });

  it("no expone detalles internos", async () => {
    const response = apiError(new Error("DATABASE_URL=secret"));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});
