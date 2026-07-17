import type { UnitOfMeasureDto } from "@anklo/contracts";

export interface UnitOfMeasureActorContext {
  readonly actorId: string;
  readonly organizationId: string;
}

export interface UnitOfMeasureStore {
  list(organizationId: string): Promise<readonly UnitOfMeasureDto[]>;
}

export interface UnitOfMeasureServiceDependencies {
  readonly store: UnitOfMeasureStore;
}

export class UnitOfMeasureService {
  constructor(
    private readonly dependencies: UnitOfMeasureServiceDependencies,
  ) {}

  async list(
    actor: UnitOfMeasureActorContext,
  ): Promise<readonly UnitOfMeasureDto[]> {
    return this.dependencies.store.list(actor.organizationId);
  }
}
