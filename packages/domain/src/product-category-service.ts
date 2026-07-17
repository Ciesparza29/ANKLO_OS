import type { ProductCategoryDto } from "@anklo/contracts";

export interface ProductCategoryActorContext {
  readonly actorId: string;
  readonly organizationId: string;
}

export interface ProductCategoryStore {
  list(organizationId: string): Promise<readonly ProductCategoryDto[]>;
}

export interface ProductCategoryServiceDependencies {
  readonly store: ProductCategoryStore;
}

export class ProductCategoryService {
  constructor(
    private readonly dependencies: ProductCategoryServiceDependencies,
  ) {}

  async list(
    actor: ProductCategoryActorContext,
  ): Promise<readonly ProductCategoryDto[]> {
    return this.dependencies.store.list(actor.organizationId);
  }
}
