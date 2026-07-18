import type { UnitOfMeasureDto } from "@anklo/contracts";

export interface UnitOfMeasureActorContext {
  readonly actorId: string;
  readonly organizationId: string;
  readonly capabilities: ReadonlySet<string>;
}

export interface UnitOfMeasureStore {
  list(
    organizationId: string,
    isActive?: boolean,
  ): Promise<readonly UnitOfMeasureDto[]>;
  findByNameOrSymbol(
    organizationId: string,
    name: string,
    symbol: string,
  ): Promise<UnitOfMeasureDto | null>;
  create(
    organizationId: string,
    name: string,
    symbol: string,
  ): Promise<UnitOfMeasureDto>;
  updateState(
    id: string,
    organizationId: string,
    isActive: boolean,
  ): Promise<UnitOfMeasureDto>;
}

export class UnitOfMeasureError extends Error {
  readonly code = "BAD_REQUEST";
}

export class UnitOfMeasureAuthorizationError extends Error {
  readonly code = "FORBIDDEN";
}

export interface UnitOfMeasureServiceDependencies {
  readonly store: UnitOfMeasureStore;
}

function requireCapability(
  actor: UnitOfMeasureActorContext,
  capability: string,
): void {
  if (!actor.capabilities.has(capability)) {
    throw new UnitOfMeasureAuthorizationError("Operación no autorizada");
  }
}

export class UnitOfMeasureService {
  constructor(
    private readonly dependencies: UnitOfMeasureServiceDependencies,
  ) {}

  async list(
    actor: UnitOfMeasureActorContext,
    isActive?: boolean,
  ): Promise<readonly UnitOfMeasureDto[]> {
    requireCapability(actor, "product:read");
    return this.dependencies.store.list(actor.organizationId, isActive);
  }

  async create(
    actor: UnitOfMeasureActorContext,
    input: { readonly name: string; readonly symbol: string },
  ): Promise<UnitOfMeasureDto> {
    requireCapability(actor, "product:create");

    const existing = await this.dependencies.store.findByNameOrSymbol(
      actor.organizationId,
      input.name,
      input.symbol,
    );

    if (existing) {
      throw new UnitOfMeasureError(
        "Ya existe una unidad de medida con este nombre o símbolo",
      );
    }

    return this.dependencies.store.create(
      actor.organizationId,
      input.name,
      input.symbol,
    );
  }

  async updateState(
    actor: UnitOfMeasureActorContext,
    id: string,
    isActive: boolean,
  ): Promise<UnitOfMeasureDto> {
    requireCapability(actor, "product:create");
    return this.dependencies.store.updateState(
      id,
      actor.organizationId,
      isActive,
    );
  }
}
