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

    // NOTA DE DISEÑO (TRANSITORIA):
    // Actualmente estamos creando el ProductTemplate en relación 1:1 de forma atómica para no romper
    // la compatibilidad con el flujo simple `/products/new`.
    // Por diseño temporal, estamos omitiendo la validación estricta de nombre duplicado del
    // ProductTemplate en este flujo simple. Esto NO es una política final del catálogo,
    // sino una medida de compatibilidad en esta iteración.
    const templateId = this.dependencies.newId();

    const product = Product.create({
      ...input,
      id: this.dependencies.newId(),
      templateId,
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
