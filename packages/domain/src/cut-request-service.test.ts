import type {
  CreateCutRequestInput,
  CutRequestCapability,
  CutRequestHistoryEntryDto,
  CutRequestListQuery,
} from "@anklo/contracts";
import { describe, expect, it } from "vitest";
import { CutRequestDomainError, type CutRequestState } from "./cut-request";
import {
  CutRequestAuthorizationError,
  CutRequestNotFoundError,
  CutRequestService,
  type ActorContext,
  type AtomicCreateInput,
  type AtomicTransitionInput,
  type CutRequestAction,
  type CutRequestStore,
} from "./cut-request-service";

class MemoryStore implements CutRequestStore {
  readonly requests = new Map<string, CutRequestState>();
  readonly operations = new Map<
    string,
    { action: CutRequestAction; id: string }
  >();
  readonly audits: AtomicCreateInput["audit"][] = [];
  failAudit = false;

  key(organizationId: string, id: string) {
    return `${organizationId}:${id}`;
  }

  async create(input: AtomicCreateInput) {
    const replay = await this.findOperationResult(
      input.request.organizationId,
      input.clientOperationId,
      input.audit.action,
    );
    if (replay) return replay;
    if (this.failAudit) throw new Error("audit failed");
    this.requests.set(
      this.key(input.request.organizationId, input.request.id),
      structuredClone(input.request),
    );
    this.operations.set(
      this.key(input.request.organizationId, input.clientOperationId),
      { action: input.audit.action, id: input.request.id },
    );
    this.audits.push(input.audit);
    return structuredClone(input.request);
  }

  async findById(organizationId: string, requestId: string) {
    return structuredClone(
      this.requests.get(this.key(organizationId, requestId)) ?? null,
    );
  }

  async list(organizationId: string, query: CutRequestListQuery) {
    return [...this.requests.values()]
      .filter(
        (request) =>
          request.organizationId === organizationId &&
          (!query.status || request.status === query.status),
      )
      .map((request) => structuredClone(request));
  }

  async listHistory(
    organizationId: string,
    requestId: string,
  ): Promise<readonly CutRequestHistoryEntryDto[]> {
    return this.audits
      .filter(
        (audit) =>
          audit.organizationId === organizationId &&
          audit.entityId === requestId,
      )
      .sort(
        (left, right) =>
          left.occurredAt.localeCompare(right.occurredAt) ||
          left.id.localeCompare(right.id),
      )
      .map((audit) => {
        const event = {
          id: audit.id,
          occurredAt: audit.occurredAt,
          actorReference: audit.actorId,
        };
        return audit.action === "CUT_REQUEST_CANCELLED"
          ? {
              ...event,
              action: "CUT_REQUEST_CANCELLED" as const,
              reason: audit.reason ?? "",
            }
          : { ...event, action: audit.action };
      });
  }

  async findOperationResult(
    organizationId: string,
    clientOperationId: string,
    action: CutRequestAction,
  ) {
    const operation = this.operations.get(
      this.key(organizationId, clientOperationId),
    );
    if (!operation || operation.action !== action) return null;
    return this.findById(organizationId, operation.id);
  }

  async transition(input: AtomicTransitionInput) {
    const current = this.requests.get(
      this.key(input.request.organizationId, input.request.id),
    );
    if (
      !current ||
      current.status !== input.expectedStatus ||
      current.version !== input.expectedVersion
    ) {
      throw new CutRequestDomainError("VERSION_CONFLICT", "conflict");
    }
    if (this.failAudit) throw new Error("audit failed");
    this.requests.set(
      this.key(input.request.organizationId, input.request.id),
      structuredClone(input.request),
    );
    this.operations.set(
      this.key(input.request.organizationId, input.clientOperationId),
      { action: input.audit.action, id: input.request.id },
    );
    this.audits.push(input.audit);
    return structuredClone(input.request);
  }
}

const orgA = "00000000-0000-4000-8000-000000000001";
const orgB = "00000000-0000-4000-8000-000000000002";
let sequence = 20;
const newId = () =>
  `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const capabilities = new Set<CutRequestCapability>([
  "cut_request:create",
  "cut_request:read",
  "cut_request:read_history",
  "cut_request:submit",
  "cut_request:cancel",
]);
const actor = (organizationId = orgA): ActorContext => ({
  actorId: "00000000-0000-4000-8000-000000000003",
  organizationId,
  capabilities,
});
const input = (operationId = newId()): CreateCutRequestInput => ({
  clientOperationId: operationId,
  requestingUnit: "Unidad ficticia",
  requester: "Solicitante ficticio",
  materialOwner: "Propietario ficticio",
  currentCustodian: "Custodio ficticio",
  executionMode: "INTERNAL",
  priority: "Normal",
  requiredAt: "2026-07-20T12:00:00.000Z",
  lines: [
    {
      productSpecification: "Producto ficticio",
      quantity: "2",
      unit: "MM",
      requestedLength: "100",
    },
  ],
});

function setup() {
  const store = new MemoryStore();
  const service = new CutRequestService({
    store,
    recognizedUnits: new Set(["MM"]),
    allowTolerance: false,
    now: () => new Date("2026-07-16T12:00:00.000Z"),
    newId,
  });
  return { store, service };
}

describe("CutRequestService", () => {
  it("persiste cabecera y líneas, lista y obtiene por organización", async () => {
    const { service } = setup();
    const created = await service.create(actor(), input());
    await expect(service.list(actor(), {})).resolves.toHaveLength(1);
    await expect(service.get(actor(), created.id)).resolves.toMatchObject({
      id: created.id,
      lines: [{ unit: "MM" }],
    });
    await expect(service.get(actor(orgB), created.id)).rejects.toBeInstanceOf(
      CutRequestNotFoundError,
    );
  });

  it("deniega por defecto cuando falta capacidad", async () => {
    const { service } = setup();
    await expect(
      service.create({ ...actor(), capabilities: new Set() }, input()),
    ).rejects.toBeInstanceOf(CutRequestAuthorizationError);
  });

  it("crea y envía idempotentemente con una auditoría por efecto", async () => {
    const { service, store } = setup();
    const operationId = newId();
    const first = await service.create(actor(), input(operationId));
    const replay = await service.create(actor(), input(operationId));
    expect(replay.id).toBe(first.id);
    const submitOperation = newId();
    const sent = await service.submit(actor(), first.id, {
      clientOperationId: submitOperation,
      expectedVersion: 1,
    });
    const sentReplay = await service.submit(actor(), first.id, {
      clientOperationId: submitOperation,
      expectedVersion: 1,
    });
    expect(sentReplay).toEqual(sent);
    expect(store.audits.map((audit) => audit.action)).toEqual([
      "CUT_REQUEST_CREATED",
      "CUT_REQUEST_SUBMITTED",
    ]);
  });

  it("cancela atómicamente sin eliminar y conserva motivo", async () => {
    const { service, store } = setup();
    const created = await service.create(actor(), input());
    const cancelled = await service.cancel(actor(), created.id, {
      clientOperationId: newId(),
      expectedVersion: 1,
      reason: "Dato ficticio ya no requerido",
    });
    expect(cancelled.status).toBe("CANCELLED");
    expect(store.requests.size).toBe(1);
    expect(store.audits.at(-1)?.reason).toBe("Dato ficticio ya no requerido");
  });

  it("exige conjuntamente lectura básica e historial", async () => {
    const { service } = setup();
    const created = await service.create(actor(), input());
    await expect(
      service.getHistory(
        {
          ...actor(),
          capabilities: new Set<CutRequestCapability>(["cut_request:read"]),
        },
        created.id,
      ),
    ).rejects.toBeInstanceOf(CutRequestAuthorizationError);
    await expect(
      service.getHistory(
        {
          ...actor(),
          capabilities: new Set<CutRequestCapability>([
            "cut_request:read_history",
          ]),
        },
        created.id,
      ),
    ).rejects.toBeInstanceOf(CutRequestAuthorizationError);
    await expect(
      service.get(
        {
          ...actor(),
          capabilities: new Set<CutRequestCapability>(["cut_request:read"]),
        },
        created.id,
      ),
    ).resolves.toMatchObject({ id: created.id });
  });

  it("devuelve historial minimizado, estable y sin efectos", async () => {
    const { service, store } = setup();
    const created = await service.create(actor(), input());
    await service.cancel(actor(), created.id, {
      clientOperationId: newId(),
      expectedVersion: 1,
      reason: "Motivo ficticio autorizado",
    });
    const before = {
      request: await store.findById(orgA, created.id),
      audits: structuredClone(store.audits),
      operations: structuredClone([...store.operations]),
    };
    const first = await service.getHistory(actor(), created.id);
    const second = await service.getHistory(actor(), created.id);
    expect(second).toEqual(first);
    expect(first).toEqual(
      [...first].sort(
        (left, right) =>
          left.occurredAt.localeCompare(right.occurredAt) ||
          left.id.localeCompare(right.id),
      ),
    );
    expect(first.at(-1)).toMatchObject({
      action: "CUT_REQUEST_CANCELLED",
      reason: "Motivo ficticio autorizado",
      actorReference: actor().actorId,
    });
    expect(JSON.stringify(first)).not.toMatch(
      /before|after|organizationId|correlationId|status/,
    );
    expect(await store.findById(orgA, created.id)).toEqual(before.request);
    expect(store.audits).toEqual(before.audits);
    expect([...store.operations]).toEqual(before.operations);
  });

  it("no revela solicitudes de otra organización", async () => {
    const { service } = setup();
    const created = await service.create(actor(), input());
    await expect(
      service.getHistory(actor(orgB), created.id),
    ).rejects.toBeInstanceOf(CutRequestNotFoundError);
  });

  it("trata una solicitud válida sin eventos como inconsistencia controlada", async () => {
    const { service, store } = setup();
    const created = await service.create(actor(), input());
    store.audits.splice(0);
    await expect(service.getHistory(actor(), created.id)).rejects.toMatchObject(
      {
        code: "HISTORY_INCONSISTENT",
      },
    );
    await expect(service.get(actor(), created.id)).resolves.toMatchObject({
      id: created.id,
      status: "DRAFT",
      version: 1,
    });
  });

  it("revierte la transición si falla auditoría", async () => {
    const { service, store } = setup();
    const created = await service.create(actor(), input());
    store.failAudit = true;
    await expect(
      service.submit(actor(), created.id, {
        clientOperationId: newId(),
        expectedVersion: 1,
      }),
    ).rejects.toThrow(/audit failed/);
    expect((await store.findById(orgA, created.id))?.status).toBe("DRAFT");
    expect(store.audits).toHaveLength(1);
  });

  it("revierte la creación si falla auditoría", async () => {
    const { service, store } = setup();
    store.failAudit = true;
    await expect(service.create(actor(), input())).rejects.toThrow(
      /audit failed/,
    );
    expect(store.requests.size).toBe(0);
    expect(store.audits).toHaveLength(0);
  });

  it("solo permite un envío concurrente efectivo", async () => {
    const { service, store } = setup();
    const created = await service.create(actor(), input());
    const results = await Promise.allSettled([
      service.submit(actor(), created.id, {
        clientOperationId: newId(),
        expectedVersion: 1,
      }),
      service.submit(actor(), created.id, {
        clientOperationId: newId(),
        expectedVersion: 1,
      }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      store.audits.filter((audit) => audit.action === "CUT_REQUEST_SUBMITTED"),
    ).toHaveLength(1);
  });
});
