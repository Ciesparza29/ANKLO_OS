import { describe, expect, it } from "vitest";
import {
  CutRequest,
  CutRequestDomainError,
  type CreateCutRequestDomainInput,
} from "./cut-request";

const now = new Date("2026-07-16T12:00:00.000Z");

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000010",
    organizationId: "00000000-0000-4000-8000-000000000001",
    createdBy: "00000000-0000-4000-8000-000000000002",
    createdAt: now,
    lineIds: ["00000000-0000-4000-8000-000000000011"],
    requestingUnit: "Unidad ficticia",
    requester: "Persona ficticia",
    materialOwner: "Propietario ficticio",
    currentCustodian: "Custodio ficticio",
    executionMode: "INTERNAL" as const,
    priority: "Normal",
    requiredAt: "2026-07-20T12:00:00.000Z",
    lines: [
      {
        productSpecification: "Producto ficticio",
        quantity: "2",
        unit: "MM",
        requestedLength: "100.5",
      },
    ],
    ...overrides,
  } as CreateCutRequestDomainInput;
}

describe("CutRequest", () => {
  it("crea un borrador válido con propietario y custodio separados", () => {
    const request = CutRequest.create(validInput(), new Set(["MM"]));
    expect(request.snapshot()).toMatchObject({
      status: "DRAFT",
      version: 1,
      materialOwner: "Propietario ficticio",
      currentCustodian: "Custodio ficticio",
    });
  });

  it("permite que propietario y custodio coincidan", () => {
    const request = CutRequest.create(
      validInput({ currentCustodian: "Propietario ficticio" }),
      new Set(["MM"]),
    );
    expect(request.snapshot().currentCustodian).toBe(
      request.snapshot().materialOwner,
    );
  });

  it("rechaza una solicitud sin líneas", () => {
    expect(() =>
      CutRequest.create(
        validInput({ lines: [], lineIds: [] }),
        new Set(["MM"]),
      ),
    ).toThrowError(CutRequestDomainError);
  });

  it.each(["0", "-1"])("rechaza cantidad no positiva %s", (quantity) => {
    const lines = [{ ...validInput().lines[0]!, quantity }];
    expect(() =>
      CutRequest.create(validInput({ lines }), new Set(["MM"])),
    ).toThrowError(/mayores que cero/);
  });

  it.each(["0", "-1"])("rechaza longitud no positiva %s", (requestedLength) => {
    const lines = [{ ...validInput().lines[0]!, requestedLength }];
    expect(() =>
      CutRequest.create(validInput({ lines }), new Set(["MM"])),
    ).toThrowError(/mayores que cero/);
  });

  it("rechaza una unidad no reconocida", () => {
    expect(() => CutRequest.create(validInput(), new Set(["M"]))).toThrowError(
      /no está reconocida/,
    );
  });

  it("rechaza modalidad externa sin proveedor", () => {
    expect(() =>
      CutRequest.create(
        validInput({ executionMode: "EXTERNAL" }),
        new Set(["MM"]),
      ),
    ).toThrowError(/exige proveedor/);
  });

  it("no admite proveedor ficticio en modalidad interna", () => {
    expect(() =>
      CutRequest.create(
        validInput({ externalProvider: "Proveedor" }),
        new Set(["MM"]),
      ),
    ).toThrowError(/no admite proveedor/);
  });

  it("rechaza enviar sin propietario", () => {
    const request = CutRequest.create(
      validInput({ materialOwner: undefined }),
      new Set(["MM"]),
    );
    expect(() => request.submit("actor", now, 1)).toThrowError(/propietario/);
  });

  it("envía una vez e impide reenvío y edición", () => {
    const request = CutRequest.create(validInput(), new Set(["MM"]));
    request.submit("actor", now, 1);
    expect(request.snapshot()).toMatchObject({
      status: "SUBMITTED",
      version: 2,
    });
    expect(() => request.submit("actor", now, 2)).toThrowError(/borrador/);
    expect(() => request.replaceDraft(request.snapshot(), 2)).toThrowError(
      /borrador/,
    );
  });

  it("cancela sin borrar la historia", () => {
    const request = CutRequest.create(validInput(), new Set(["MM"]));
    request.cancel("actor", now, 1, "Motivo ficticio");
    expect(request.snapshot().status).toBe("CANCELLED");
    expect(() => request.remove()).toThrowError(/no se elimina/);
  });

  it("rechaza cancelar sin motivo", () => {
    const request = CutRequest.create(validInput(), new Set(["MM"]));
    expect(() => request.cancel("actor", now, 1, " ")).toThrowError(/motivo/);
  });
});
