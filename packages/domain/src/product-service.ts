import type {
  ProductCapability,
  ProductDto,
  ProductListQuery,
  CreateProductInput,
} from "@anklo/contracts";
import { Product, type ProductState } from "./product";

export interface ProductActorContext {
  readonly actorId: string;
  readonly organizationId: string;
  readonly capabilities: ReadonlySet<ProductCapability | string>;
}

export interface ProductStore {
  create(state: ProductState): Promise<ProductState>;
  list(
    organizationId: string,
    query: ProductListQuery,
  ): Promise<readonly ProductState[]>;
}

export class ProductAuthorizationError extends Error {
  readonly code = "FORBIDDEN";
}

export interface ProductServiceDependencies {
  readonly store: ProductStore;
  readonly now: () => Date;
  readonly newId: () => string;
}

function requireCapability(
  actor: ProductActorContext,
  capability: ProductCapability,
): void {
  if (!actor.capabilities.has(capability)) {
    throw new ProductAuthorizationError("Operación no autorizada");
  }
}

export class ProductService {
  constructor(private readonly dependencies: ProductServiceDependencies) {}

  async create(
    actor: ProductActorContext,
    input: CreateProductInput,
  ): Promise<ProductDto> {
    requireCapability(actor, "product:create");
    const at = this.dependencies.now();
    const product = Product.create({
      ...input,
      id: this.dependencies.newId(),
      organizationId: actor.organizationId,
      createdBy: actor.actorId,
      createdAt: at,
    }).snapshot();
    return this.dependencies.store.create(product);
  }

  async list(
    actor: ProductActorContext,
    query: ProductListQuery,
  ): Promise<readonly ProductDto[]> {
    requireCapability(actor, "product:read");
    return this.dependencies.store.list(actor.organizationId, query);
  }
}
