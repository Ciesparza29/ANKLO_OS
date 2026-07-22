import type { ProductCategoryDto } from "@anklo/contracts";

export interface ProductCategoryActorContext {
  readonly actorId: string;
  readonly organizationId: string;
  readonly capabilities: ReadonlySet<string>;
}

export interface ProductCategoryStore {
  list(
    organizationId: string,
    isActive?: boolean,
  ): Promise<readonly ProductCategoryDto[]>;
  findByNameOrCode(
    organizationId: string,
    name: string,
    code?: string,
  ): Promise<ProductCategoryDto | null>;
  create(
    organizationId: string,
    name: string,
    code?: string,
  ): Promise<ProductCategoryDto>;
  updateState(
    id: string,
    organizationId: string,
    isActive: boolean,
  ): Promise<ProductCategoryDto>;
}

export class ProductCategoryError extends Error {
  readonly code = "BAD_REQUEST";
}

export class ProductCategoryAuthorizationError extends Error {
  readonly code = "FORBIDDEN";
}

export interface ProductCategoryServiceDependencies {
  readonly store: ProductCategoryStore;
}

function requireCapability(
  actor: ProductCategoryActorContext,
  capability: string,
): void {
  if (!actor.capabilities.has(capability)) {
    throw new ProductCategoryAuthorizationError("Operación no autorizada");
  }
}

export class ProductCategoryService {
  constructor(
    private readonly dependencies: ProductCategoryServiceDependencies,
  ) {}

  async list(
    actor: ProductCategoryActorContext,
    isActive?: boolean,
  ): Promise<readonly ProductCategoryDto[]> {
    requireCapability(actor, "product:read");
    return this.dependencies.store.list(actor.organizationId, isActive);
  }

  async create(
    actor: ProductCategoryActorContext,
    input: { readonly name: string; readonly code?: string | undefined },
  ): Promise<ProductCategoryDto> {
    requireCapability(actor, "product:create");

    const existing = await this.dependencies.store.findByNameOrCode(
      actor.organizationId,
      input.name,
      input.code,
    );

    if (existing) {
      throw new ProductCategoryError(
        "Ya existe una categoría con este nombre o código",
      );
    }

    return this.dependencies.store.create(
      actor.organizationId,
      input.name,
      input.code,
    );
  }

  async updateState(
    actor: ProductCategoryActorContext,
    id: string,
    isActive: boolean,
  ): Promise<ProductCategoryDto> {
    requireCapability(actor, "product:create");
    return this.dependencies.store.updateState(
      id,
      actor.organizationId,
      isActive,
    );
  }
}
