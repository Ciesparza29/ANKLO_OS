import type { ProductTemplateDto } from "@anklo/contracts";

export interface ProductTemplateActorContext {
  readonly actorId: string;
  readonly organizationId: string;
  readonly capabilities: ReadonlySet<string>;
}

export interface ProductTemplateStore {
  list(
    organizationId: string,
    isActive?: boolean,
  ): Promise<readonly ProductTemplateDto[]>;
  findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductTemplateDto | null>;
  create(
    organizationId: string,
    name: string,
    description: string | null,
    categoryId: string | null,
    baseUnitId: string | null,
    createdBy: string,
  ): Promise<ProductTemplateDto>;
}

export class ProductTemplateError extends Error {
  readonly code = "BAD_REQUEST";
}

export class ProductTemplateAuthorizationError extends Error {
  readonly code = "FORBIDDEN";
}

export interface ProductTemplateServiceDependencies {
  readonly store: ProductTemplateStore;
}

function requireCapability(
  actor: ProductTemplateActorContext,
  capability: string,
): void {
  if (!actor.capabilities.has(capability)) {
    throw new ProductTemplateAuthorizationError("Operación no autorizada");
  }
}

export class ProductTemplateService {
  constructor(
    private readonly dependencies: ProductTemplateServiceDependencies,
  ) {}

  async list(
    actor: ProductTemplateActorContext,
    isActive?: boolean,
  ): Promise<readonly ProductTemplateDto[]> {
    requireCapability(actor, "product:read");
    return this.dependencies.store.list(actor.organizationId, isActive);
  }

  async create(
    actor: ProductTemplateActorContext,
    input: {
      readonly name: string;
      readonly description?: string | null;
      readonly categoryId?: string | null;
      readonly baseUnitId?: string | null;
    },
  ): Promise<ProductTemplateDto> {
    requireCapability(actor, "product:create");

    const existing = await this.dependencies.store.findByName(
      actor.organizationId,
      input.name,
    );

    if (existing) {
      throw new ProductTemplateError(
        "Ya existe una plantilla de producto con este nombre",
      );
    }

    return this.dependencies.store.create(
      actor.organizationId,
      input.name,
      input.description ?? null,
      input.categoryId ?? null,
      input.baseUnitId ?? null,
      actor.actorId,
    );
  }
}
