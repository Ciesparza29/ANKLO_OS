import type { CutRequestDto } from "@anklo/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testContext = vi.hoisted(() => {
  const service = {
    create: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    submit: vi.fn(),
    cancel: vi.fn(),
  };
  return {
    actorError: null as Error | null,
    service,
    getService: vi.fn(() => service),
  };
});

const mocks = testContext.service;

vi.mock("@/lib/cut-request-context", () => ({
  getActorContext: () => {
    if (testContext.actorError) throw testContext.actorError;
    return {
      actorId: "00000000-0000-4000-8000-000000000001",
      organizationId: "00000000-0000-4000-8000-000000000002",
      capabilities: new Set(),
    };
  },
  getCutRequestService: testContext.getService,
}));

import { GET as list, POST as create } from "./route";
import { GET as get } from "./[id]/route";
import { POST as submit } from "./[id]/submit/route";
import { POST as cancel } from "./[id]/cancel/route";

const id = "00000000-0000-4000-8000-000000000010";
const dto: CutRequestDto = {
  id,
  organizationId: "00000000-0000-4000-8000-000000000002",
  requestingUnit: "Unidad ficticia",
  requester: "Solicitante ficticio",
  materialOwner: "Propietario ficticio",
  currentCustodian: "Custodio ficticio",
  executionMode: "INTERNAL",
  priority: "Normal",
  requiredAt: "2026-07-20T12:00:00.000Z",
  status: "DRAFT",
  version: 1,
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000001",
  lines: [],
};

describe("API cut requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testContext.actorError = null;
  });

  it("falla cerrado antes de construir persistencia si no hay identidad", async () => {
    testContext.actorError = new Error("Identidad no configurada");

    const response = await list(
      new Request("http://localhost/api/cut-requests"),
    );

    expect(response.status).toBe(500);
    expect(testContext.getService).not.toHaveBeenCalled();
  });

  it("devuelve listado vacío", async () => {
    mocks.list.mockResolvedValue([]);
    const response = await list(
      new Request("http://localhost/api/cut-requests"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ requests: [] });
  });

  it("crea una solicitud validada", async () => {
    mocks.create.mockResolvedValue(dto);
    const response = await create(
      new Request("http://localhost/api/cut-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientOperationId: "00000000-0000-4000-8000-000000000011",
          requestingUnit: "Unidad ficticia",
          requester: "Solicitante ficticio",
          materialOwner: "Propietario ficticio",
          currentCustodian: "Custodio ficticio",
          executionMode: "INTERNAL",
          priority: "Normal",
          requiredAt: "2026-07-20T12:00:00.000Z",
          lines: [
            {
              productSpecification: "Producto",
              quantity: "1",
              unit: "MM",
              requestedLength: "100",
            },
          ],
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it("rechaza creación inválida antes del servicio", async () => {
    const response = await create(
      new Request("http://localhost/api/cut-requests", {
        method: "POST",
        body: JSON.stringify({ lines: [] }),
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("consulta detalle, envía y cancela", async () => {
    mocks.get.mockResolvedValue(dto);
    mocks.submit.mockResolvedValue({ ...dto, status: "SUBMITTED", version: 2 });
    mocks.cancel.mockResolvedValue({ ...dto, status: "CANCELLED", version: 2 });
    const context = { params: Promise.resolve({ id }) };
    expect((await get(new Request("http://localhost"), context)).status).toBe(
      200,
    );
    expect(
      (
        await submit(
          new Request("http://localhost", {
            method: "POST",
            body: JSON.stringify({
              clientOperationId: "00000000-0000-4000-8000-000000000012",
              expectedVersion: 1,
            }),
          }),
          context,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await cancel(
          new Request("http://localhost", {
            method: "POST",
            body: JSON.stringify({
              clientOperationId: "00000000-0000-4000-8000-000000000013",
              expectedVersion: 1,
              reason: "Motivo ficticio",
            }),
          }),
          context,
        )
      ).status,
    ).toBe(200);
  });

  it("valida acceso directo por UUID", async () => {
    const response = await get(new Request("http://localhost"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(response.status).toBe(400);
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
