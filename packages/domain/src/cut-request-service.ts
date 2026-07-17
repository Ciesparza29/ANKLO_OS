import type {
  CancelCutRequestInput,
  CreateCutRequestInput,
  CutRequestCapability,
  CutRequestDto,
  CutRequestListQuery,
  SubmitCutRequestInput,
} from "@anklo/contracts";
import { CutRequest, type CutRequestState } from "./cut-request";

export type CutRequestAction =
  "CUT_REQUEST_CREATED" | "CUT_REQUEST_SUBMITTED" | "CUT_REQUEST_CANCELLED";

export interface ActorContext {
  readonly actorId: string;
  readonly organizationId: string;
  readonly capabilities: ReadonlySet<CutRequestCapability>;
}

export interface AuditEventInput {
  readonly id: string;
  readonly organizationId: string;
  readonly actorId: string;
  readonly entityType: "CUT_REQUEST";
  readonly entityId: string;
  readonly action: CutRequestAction;
  readonly occurredAt: string;
  readonly before: CutRequestState | null;
  readonly after: CutRequestState;
  readonly reason: string | null;
  readonly correlationId: string;
}

export interface AtomicCreateInput {
  readonly request: CutRequestState;
  readonly audit: AuditEventInput;
  readonly clientOperationId: string;
}

export interface AtomicTransitionInput extends AtomicCreateInput {
  readonly expectedVersion: number;
  readonly expectedStatus: "DRAFT";
}

export interface CutRequestStore {
  create(input: AtomicCreateInput): Promise<CutRequestState>;
  findById(
    organizationId: string,
    requestId: string,
  ): Promise<CutRequestState | null>;
  list(
    organizationId: string,
    query: CutRequestListQuery,
  ): Promise<readonly CutRequestState[]>;
  findOperationResult(
    organizationId: string,
    clientOperationId: string,
    action: CutRequestAction,
  ): Promise<CutRequestState | null>;
  transition(input: AtomicTransitionInput): Promise<CutRequestState>;
}

export class CutRequestAuthorizationError extends Error {
  readonly code = "FORBIDDEN";
}

export class CutRequestNotFoundError extends Error {
  readonly code = "NOT_FOUND";
}

export interface CutRequestServiceDependencies {
  readonly store: CutRequestStore;
  readonly recognizedUnits: ReadonlySet<string>;
  readonly allowTolerance: boolean;
  readonly now: () => Date;
  readonly newId: () => string;
}

function requireCapability(
  actor: ActorContext,
  capability: CutRequestCapability,
): void {
  if (!actor.capabilities.has(capability)) {
    throw new CutRequestAuthorizationError("Operación no autorizada");
  }
}

export class CutRequestService {
  constructor(private readonly dependencies: CutRequestServiceDependencies) {}

  async create(
    actor: ActorContext,
    input: CreateCutRequestInput,
  ): Promise<CutRequestDto> {
    requireCapability(actor, "cut_request:create");
    if (
      !this.dependencies.allowTolerance &&
      input.lines.some((line) => line.tolerance)
    ) {
      throw new Error(
        "La tolerancia aún no está habilitada por datos aprobados",
      );
    }
    const replay = await this.dependencies.store.findOperationResult(
      actor.organizationId,
      input.clientOperationId,
      "CUT_REQUEST_CREATED",
    );
    if (replay) return replay;
    const at = this.dependencies.now();
    const request = CutRequest.create(
      {
        ...input,
        id: this.dependencies.newId(),
        organizationId: actor.organizationId,
        createdBy: actor.actorId,
        createdAt: at,
        lineIds: input.lines.map(() => this.dependencies.newId()),
      },
      this.dependencies.recognizedUnits,
    ).snapshot();
    return this.dependencies.store.create({
      request,
      audit: this.audit(
        actor,
        request,
        "CUT_REQUEST_CREATED",
        input.clientOperationId,
        at,
        null,
        null,
      ),
      clientOperationId: input.clientOperationId,
    });
  }

  async list(
    actor: ActorContext,
    query: CutRequestListQuery,
  ): Promise<readonly CutRequestDto[]> {
    requireCapability(actor, "cut_request:read");
    return this.dependencies.store.list(actor.organizationId, query);
  }

  async get(actor: ActorContext, requestId: string): Promise<CutRequestDto> {
    requireCapability(actor, "cut_request:read");
    return this.load(actor.organizationId, requestId);
  }

  async submit(
    actor: ActorContext,
    requestId: string,
    input: SubmitCutRequestInput,
  ): Promise<CutRequestDto> {
    requireCapability(actor, "cut_request:submit");
    return this.changeState(
      actor,
      requestId,
      input.clientOperationId,
      input.expectedVersion,
      "CUT_REQUEST_SUBMITTED",
      null,
    );
  }

  async cancel(
    actor: ActorContext,
    requestId: string,
    input: CancelCutRequestInput,
  ): Promise<CutRequestDto> {
    requireCapability(actor, "cut_request:cancel");
    return this.changeState(
      actor,
      requestId,
      input.clientOperationId,
      input.expectedVersion,
      "CUT_REQUEST_CANCELLED",
      input.reason,
    );
  }

  private async changeState(
    actor: ActorContext,
    requestId: string,
    operationId: string,
    expectedVersion: number,
    action: Exclude<CutRequestAction, "CUT_REQUEST_CREATED">,
    reason: string | null,
  ): Promise<CutRequestState> {
    const replay = await this.dependencies.store.findOperationResult(
      actor.organizationId,
      operationId,
      action,
    );
    if (replay) return replay;
    const before = await this.load(actor.organizationId, requestId);
    const aggregate = CutRequest.restore(before);
    const at = this.dependencies.now();
    if (action === "CUT_REQUEST_SUBMITTED") {
      aggregate.submit(actor.actorId, at, expectedVersion);
    } else {
      aggregate.cancel(actor.actorId, at, expectedVersion, reason ?? "");
    }
    const after = aggregate.snapshot();
    return this.dependencies.store.transition({
      request: after,
      audit: this.audit(actor, after, action, operationId, at, before, reason),
      clientOperationId: operationId,
      expectedVersion,
      expectedStatus: "DRAFT",
    });
  }

  private async load(
    organizationId: string,
    requestId: string,
  ): Promise<CutRequestState> {
    const request = await this.dependencies.store.findById(
      organizationId,
      requestId,
    );
    if (!request) throw new CutRequestNotFoundError("Solicitud no encontrada");
    return request;
  }

  private audit(
    actor: ActorContext,
    request: CutRequestState,
    action: CutRequestAction,
    correlationId: string,
    at: Date,
    before: CutRequestState | null,
    reason: string | null,
  ): AuditEventInput {
    return {
      id: this.dependencies.newId(),
      organizationId: actor.organizationId,
      actorId: actor.actorId,
      entityType: "CUT_REQUEST",
      entityId: request.id,
      action,
      occurredAt: at.toISOString(),
      before,
      after: request,
      reason,
      correlationId,
    };
  }
}
