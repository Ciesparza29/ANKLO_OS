import type { CutRequestCapability } from "@anklo/contracts";
import { CutRequestService, type ActorContext } from "@anklo/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "../generated/client/client";
import { createPrismaClient } from "./prisma-client";
import { PrismaCutRequestStore } from "./prisma-cut-request-store";

const enabled = Boolean(process.env.DATABASE_URL);
const suite = enabled ? describe : describe.skip;

suite("PrismaCutRequestStore con PostgreSQL", () => {
  let prisma: PrismaClient;
  let service: CutRequestService;
  const organizationId = crypto.randomUUID();
  const otherOrganizationId = crypto.randomUUID();
  const capabilities = new Set<CutRequestCapability>([
    "cut_request:create",
    "cut_request:read",
    "cut_request:read_history",
    "cut_request:submit",
    "cut_request:cancel",
  ]);
  const actor: ActorContext = {
    actorId: crypto.randomUUID(),
    organizationId,
    capabilities,
  };

  beforeAll(() => {
    prisma = createPrismaClient();
    service = new CutRequestService({
      store: new PrismaCutRequestStore(prisma),
      recognizedUnits: new Set(["MM"]),
      allowTolerance: false,
      now: () => new Date("2026-07-16T12:00:00.000Z"),
      newId: () => crypto.randomUUID(),
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("persiste agregado, aísla organización y transiciona una sola vez", async () => {
    const createOperationId = crypto.randomUUID();
    const createInput = {
      clientOperationId: createOperationId,
      requestingUnit: "Unidad de prueba ficticia",
      requester: "Solicitante de prueba ficticio",
      materialOwner: "Propietario de prueba ficticio",
      currentCustodian: "Custodio de prueba ficticio",
      executionMode: "INTERNAL" as const,
      priority: "Prueba",
      requiredAt: new Date(Date.now() + 86_400_000).toISOString(),
      lines: [
        {
          productSpecification: "Producto de prueba ficticio",
          quantity: "2.25",
          unit: "MM",
          requestedLength: "100.125",
        },
      ],
    };
    const created = await service.create(actor, createInput);
    const replay = await service.create(actor, createInput);
    expect(replay.id).toBe(created.id);
    expect(
      (await service.list(actor, {})).some((item) => item.id === created.id),
    ).toBe(true);
    await expect(
      service.get(
        { ...actor, organizationId: otherOrganizationId },
        created.id,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const operationId = crypto.randomUUID();
    const results = await Promise.allSettled([
      service.submit(actor, created.id, {
        clientOperationId: operationId,
        expectedVersion: 1,
      }),
      service.submit(actor, created.id, {
        clientOperationId: operationId,
        expectedVersion: 1,
      }),
    ]);
    expect(results.every((result) => result.status === "fulfilled")).toBe(true);
    expect((await service.get(actor, created.id)).status).toBe("SUBMITTED");

    const auditCount = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
      return transaction.auditEvent.count({
        where: { organizationId, entityId: created.id },
      });
    });
    expect(auditCount).toBe(2);
  });

  it("cancela un borrador sin eliminarlo", async () => {
    const created = await service.create(actor, {
      clientOperationId: crypto.randomUUID(),
      requestingUnit: "Unidad ficticia",
      requester: "Solicitante ficticio",
      currentCustodian: "Custodio ficticio",
      executionMode: "INTERNAL",
      priority: "Prueba",
      requiredAt: new Date(Date.now() + 86_400_000).toISOString(),
      lines: [
        {
          productSpecification: "Producto ficticio",
          quantity: "1",
          unit: "MM",
          requestedLength: "1",
        },
      ],
    });
    const cancelled = await service.cancel(actor, created.id, {
      clientOperationId: crypto.randomUUID(),
      expectedVersion: 1,
      reason: "Cancelación de prueba ficticia",
    });
    expect(cancelled.status).toBe("CANCELLED");
    await expect(service.get(actor, created.id)).resolves.toMatchObject({
      id: created.id,
      status: "CANCELLED",
    });
    const beforeRead = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
      return {
        request: await transaction.cutRequest.findFirstOrThrow({
          where: { organizationId, id: created.id },
        }),
        audits: await transaction.auditEvent.count({
          where: { organizationId, entityId: created.id },
        }),
        operations: await transaction.cutRequestOperation.count({
          where: { organizationId, cutRequestId: created.id },
        }),
      };
    });
    const first = await service.getHistory(actor, created.id);
    const second = await service.getHistory(actor, created.id);
    expect(second).toEqual(first);
    expect(first).toEqual(
      [...first].sort(
        (left, right) =>
          left.occurredAt.localeCompare(right.occurredAt) ||
          left.id.localeCompare(right.id),
      ),
    );
    expect(
      first.find((event) => event.action === "CUT_REQUEST_CANCELLED"),
    ).toMatchObject({ reason: "Cancelación de prueba ficticia" });
    expect(JSON.stringify(first)).not.toMatch(
      /before|after|organizationId|correlationId|status/,
    );
    const afterRead = await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
      return {
        request: await transaction.cutRequest.findFirstOrThrow({
          where: { organizationId, id: created.id },
        }),
        audits: await transaction.auditEvent.count({
          where: { organizationId, entityId: created.id },
        }),
        operations: await transaction.cutRequestOperation.count({
          where: { organizationId, cutRequestId: created.id },
        }),
      };
    });
    expect(afterRead).toEqual(beforeRead);
    await expect(
      service.getHistory(
        { ...actor, organizationId: otherOrganizationId },
        created.id,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("detecta una solicitud del tenant sin eventos", async () => {
    const requestId = crypto.randomUUID();
    const at = new Date("2026-07-16T12:00:00.000Z");
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
      await transaction.cutRequest.create({
        data: {
          id: requestId,
          organizationId,
          requestingUnit: "Unidad ficticia",
          requester: "Solicitante ficticio",
          currentCustodian: "Custodio ficticio",
          executionMode: "INTERNAL",
          priority: "Prueba",
          requiredAt: new Date("2026-07-20T12:00:00.000Z"),
          status: "DRAFT",
          version: 1,
          createdAt: at,
          updatedAt: at,
          createdBy: actor.actorId,
        },
      });
    });
    await expect(service.getHistory(actor, requestId)).rejects.toMatchObject({
      code: "HISTORY_INCONSISTENT",
    });
    await expect(service.get(actor, requestId)).resolves.toMatchObject({
      id: requestId,
      status: "DRAFT",
      version: 1,
    });
  });
});
