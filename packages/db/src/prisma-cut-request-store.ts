import {
  CUT_REQUEST_HISTORY_ACTIONS,
  type CutRequestHistoryEntryDto,
  type CutRequestListQuery,
} from "@anklo/contracts";
import {
  CutRequestDomainError,
  type AtomicCreateInput,
  type AtomicTransitionInput,
  type CutRequestAction,
  type CutRequestState,
  type CutRequestStore,
} from "@anklo/domain";
import { Prisma, type PrismaClient } from "../generated/client/client";

type TransactionClient = Prisma.TransactionClient;
type RequestWithLines = Prisma.CutRequestGetPayload<{
  include: { lines: true };
}>;

function optional<T extends string>(key: string, value: T | null) {
  return value === null ? {} : { [key]: value };
}

function toState(record: RequestWithLines): CutRequestState {
  return {
    id: record.id,
    organizationId: record.organizationId,
    requestingUnit: record.requestingUnit,
    requester: record.requester,
    ...optional("materialOwner", record.materialOwner),
    currentCustodian: record.currentCustodian,
    executionMode: record.executionMode,
    ...optional("expectedExecutor", record.expectedExecutor),
    ...optional("externalProvider", record.externalProvider),
    ...optional("reference", record.reference),
    priority: record.priority,
    requiredAt: record.requiredAt.toISOString(),
    ...optional("observations", record.observations),
    status: record.status,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy,
    lines: [...record.lines]
      .sort((left, right) => left.position - right.position)
      .map((line) => ({
        id: line.id,
        productSpecification: line.productSpecification,
        quantity: line.quantity.toString(),
        unit: line.unit,
        requestedLength: line.requestedLength.toString(),
        ...optional("tolerance", line.tolerance),
        ...optional("observation", line.observation),
        position: line.position,
      })),
  } as CutRequestState;
}

async function setTenant(
  transaction: TransactionClient,
  organizationId: string,
): Promise<void> {
  await transaction.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export class PrismaCutRequestStore implements CutRequestStore {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: AtomicCreateInput): Promise<CutRequestState> {
    try {
      return await this.withTenant(
        input.request.organizationId,
        async (transaction) => {
          const request = input.request;
          const created = await transaction.cutRequest.create({
            data: {
              id: request.id,
              organizationId: request.organizationId,
              requestingUnit: request.requestingUnit,
              requester: request.requester,
              materialOwner: request.materialOwner ?? null,
              currentCustodian: request.currentCustodian,
              executionMode: request.executionMode,
              expectedExecutor: request.expectedExecutor ?? null,
              externalProvider: request.externalProvider ?? null,
              reference: request.reference ?? null,
              priority: request.priority,
              requiredAt: new Date(request.requiredAt),
              observations: request.observations ?? null,
              status: request.status,
              version: request.version,
              createdAt: new Date(request.createdAt),
              updatedAt: new Date(request.updatedAt),
              createdBy: request.createdBy,
              lines: {
                create: request.lines.map((line) => ({
                  id: line.id,
                  productSpecification: line.productSpecification,
                  quantity: line.quantity,
                  unit: line.unit,
                  requestedLength: line.requestedLength,
                  tolerance: line.tolerance ?? null,
                  observation: line.observation ?? null,
                  position: line.position,
                })),
              },
              operations: {
                create: {
                  id: input.audit.id,
                  clientOperationId: input.clientOperationId,
                  action: input.audit.action,
                },
              },
            },
            include: { lines: true },
          });
          await this.writeAudit(transaction, input.audit);
          return toState(created as RequestWithLines);
        },
      );
    } catch (error) {
      return this.replayUniqueOperation(error, input);
    }
  }

  async findById(
    organizationId: string,
    requestId: string,
  ): Promise<CutRequestState | null> {
    return this.withTenant(organizationId, async (transaction) => {
      const record = await transaction.cutRequest.findFirst({
        where: { id: requestId, organizationId },
        include: { lines: true },
      });
      return record ? toState(record as RequestWithLines) : null;
    });
  }

  async list(
    organizationId: string,
    query: CutRequestListQuery,
  ): Promise<readonly CutRequestState[]> {
    return this.withTenant(organizationId, async (transaction) => {
      const records = await transaction.cutRequest.findMany({
        where: {
          organizationId,
          ...(query.status ? { status: query.status } : {}),
        },
        include: { lines: true },
        orderBy: [{ requiredAt: "asc" }, { createdAt: "desc" }],
        take: 200,
      });
      return (records as RequestWithLines[]).map(toState);
    });
  }

  async listHistory(
    organizationId: string,
    requestId: string,
  ): Promise<readonly CutRequestHistoryEntryDto[]> {
    return this.withTenant(organizationId, async (transaction) => {
      const records = await transaction.auditEvent.findMany({
        where: {
          organizationId,
          entityType: "CUT_REQUEST",
          entityId: requestId,
          action: { in: [...CUT_REQUEST_HISTORY_ACTIONS] },
        },
        select: {
          id: true,
          action: true,
          occurredAt: true,
          actorId: true,
          reason: true,
        },
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
      });
      return records.map((record): CutRequestHistoryEntryDto => {
        const base = {
          id: record.id,
          occurredAt: record.occurredAt.toISOString(),
          actorReference: record.actorId,
        };
        if (record.action === "CUT_REQUEST_CREATED") {
          return { ...base, action: "CUT_REQUEST_CREATED" };
        }
        if (record.action === "CUT_REQUEST_SUBMITTED") {
          return { ...base, action: "CUT_REQUEST_SUBMITTED" };
        }
        if (!record.reason?.trim()) {
          throw new CutRequestDomainError(
            "HISTORY_INCONSISTENT",
            "El evento de cancelación no conserva un motivo válido",
          );
        }
        return {
          ...base,
          action: "CUT_REQUEST_CANCELLED",
          reason: record.reason,
        };
      });
    });
  }

  async findOperationResult(
    organizationId: string,
    clientOperationId: string,
    action: CutRequestAction,
  ): Promise<CutRequestState | null> {
    return this.withTenant(organizationId, async (transaction) => {
      const operation = await transaction.cutRequestOperation.findUnique({
        where: {
          organizationId_clientOperationId: {
            organizationId,
            clientOperationId,
          },
        },
        include: { cutRequest: { include: { lines: true } } },
      });
      if (!operation || operation.action !== action) return null;
      return toState(operation.cutRequest as RequestWithLines);
    });
  }

  async transition(input: AtomicTransitionInput): Promise<CutRequestState> {
    try {
      return await this.withTenant(
        input.request.organizationId,
        async (transaction) => {
          const changed = await transaction.cutRequest.updateMany({
            where: {
              id: input.request.id,
              organizationId: input.request.organizationId,
              status: input.expectedStatus,
              version: input.expectedVersion,
            },
            data: {
              status: input.request.status,
              version: input.request.version,
              updatedAt: new Date(input.request.updatedAt),
            },
          });
          if (changed.count !== 1) {
            throw new CutRequestDomainError(
              "VERSION_CONFLICT",
              "La transición compitió con otra operación",
            );
          }
          await transaction.cutRequestOperation.create({
            data: {
              id: input.audit.id,
              organizationId: input.request.organizationId,
              clientOperationId: input.clientOperationId,
              cutRequestId: input.request.id,
              action: input.audit.action,
            },
          });
          await this.writeAudit(transaction, input.audit);
          const updated = await transaction.cutRequest.findFirstOrThrow({
            where: {
              id: input.request.id,
              organizationId: input.request.organizationId,
            },
            include: { lines: true },
          });
          return toState(updated as RequestWithLines);
        },
      );
    } catch (error) {
      return this.replayUniqueOperation(error, input);
    }
  }

  private withTenant<T>(
    organizationId: string,
    work: (transaction: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      await setTenant(transaction, organizationId);
      return work(transaction);
    });
  }

  private async writeAudit(
    transaction: TransactionClient,
    audit: AtomicCreateInput["audit"],
  ): Promise<void> {
    await transaction.auditEvent.create({
      data: {
        id: audit.id,
        organizationId: audit.organizationId,
        actorId: audit.actorId,
        entityType: audit.entityType,
        entityId: audit.entityId,
        action: audit.action,
        occurredAt: new Date(audit.occurredAt),
        before: audit.before === null ? Prisma.DbNull : json(audit.before),
        after: json(audit.after),
        reason: audit.reason,
        correlationId: audit.correlationId,
      },
    });
  }

  private async replayUniqueOperation(
    error: unknown,
    input: AtomicCreateInput,
  ): Promise<CutRequestState> {
    if (
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002") ||
      (error instanceof CutRequestDomainError &&
        error.code === "VERSION_CONFLICT")
    ) {
      const replay = await this.findOperationResult(
        input.request.organizationId,
        input.clientOperationId,
        input.audit.action,
      );
      if (replay) return replay;
    }
    throw error;
  }
}
