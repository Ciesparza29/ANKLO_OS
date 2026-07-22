import type {
  ProductCapability,
  ProductListQuery,
  CreateProductInput,
  ProductTemplateDto,
} from "@anklo/contracts";
import { describe, expect, it } from "vitest";
import { type ProductState } from "./product";
import {
  ProductAuthorizationError,
  ProductNotFoundError,
  ProductService,
  type ProductActorContext,
  type ProductDetailResult,
  type ProductStore,
} from "./product-service";

class MemoryStore implements ProductStore {
  readonly products = new Map<string, ProductState>();

  key(organizationId: string, id: string) {
    return `${organizationId}:${id}`;
  }

  async create(state: ProductState) {
    this.products.set(
      this.key(state.organizationId, state.id),
      structuredClone(state),
    );
    return structuredClone(state);
  }

  async list(organizationId: string, query: ProductListQuery) {
    return [...this.products.values()]
      .filter(
        (product) =>
          product.organizationId === organizationId &&
          (query.isActive === undefined || product.isActive === query.isActive),
      )
      .map((product) => structuredClone(product));
  }

  templates = new Map<string, ProductTemplateDto>();

  async findById(
    organizationId: string,
    id: string,
  ): Promise<ProductDetailResult | null> {
    const product = this.products.get(this.key(organizationId, id));
    if (!product) return null;
    const template = product.templateId
      ? (this.templates.get(product.templateId) ?? null)
      : null;
    return {
      product: structuredClone(product),
      template: template ? structuredClone(template) : null,
    };
  }
}

const orgA = "00000000-0000-4000-8000-000000000001";
let sequence = 20;
const newId = () =>
  `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const capabilities = new Set<ProductCapability>([
  "product:create",
  "product:read",
]);
const actor = (organizationId = orgA): ProductActorContext => ({
  actorId: "00000000-0000-4000-8000-000000000003",
  organizationId,
  capabilities,
});
const input = (): CreateProductInput => ({
  name: "Producto Ficticio",
  description: "Descripción ficticia",
});

function setup() {
  const store = new MemoryStore();
  const service = new ProductService({
    store,
    now: () => new Date("2026-07-16T12:00:00.000Z"),
    newId,
  });
  return { store, service };
}

describe("ProductService", () => {
  it("permite crear con product:create", async () => {
    const { service } = setup();
    const ctx = {
      ...actor(),
      capabilities: new Set<ProductCapability>(["product:create"]),
    };
    const created = await service.create(ctx, input());
    expect(created.name).toBe("Producto Ficticio");
    expect(created.templateId).toBeDefined();
    expect(created.templateId).toMatch(/^00000000-0000-4000-8000-\d{12}$/);
  });

  it("rechaza crear sin product:create", async () => {
    const { service } = setup();
    const ctx = {
      ...actor(),
      capabilities: new Set<ProductCapability>(["product:read"]),
    };
    await expect(service.create(ctx, input())).rejects.toBeInstanceOf(
      ProductAuthorizationError,
    );
  });

  it("permite listar con product:read y preserva templateId cuando existe", async () => {
    const { service, store } = setup();
    await store.create({
      name: "Producto Ficticio",
      description: "Descripción ficticia",
      id: newId(),
      templateId: "template-123",
      organizationId: orgA,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actor().actorId,
    });
    const ctx = {
      ...actor(),
      capabilities: new Set<ProductCapability>(["product:read"]),
    };
    const results = await service.list(ctx, {});
    expect(results).toHaveLength(1);
    expect(results[0]?.templateId).toBe("template-123");
  });

  it("lista preservando templateId nulo o ausente (legacy)", async () => {
    const { service, store } = setup();
    await store.create({
      name: "Producto Ficticio Legacy",
      id: newId(),
      organizationId: orgA,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actor().actorId,
    });
    const ctx = {
      ...actor(),
      capabilities: new Set<ProductCapability>(["product:read"]),
    };
    const results = await service.list(ctx, {});
    expect(results).toHaveLength(1);
    expect(results[0]?.templateId).toBeUndefined();
  });

  it("rechaza listar sin product:read", async () => {
    const { service } = setup();
    const ctx = {
      ...actor(),
      capabilities: new Set<ProductCapability>(["product:create"]),
    };
    await expect(service.list(ctx, {})).rejects.toBeInstanceOf(
      ProductAuthorizationError,
    );
  });

  it("getDetail devuelve compuesto con plantilla cuando existe", async () => {
    const { service, store } = setup();
    const productId = newId();
    const templateId = "00000000-0000-4000-8000-000000000099";
    await store.create({
      name: "Producto con Plantilla",
      id: productId,
      templateId,
      organizationId: orgA,
      isActive: true,
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z",
      createdBy: actor().actorId,
    });
    store.templates.set(templateId, {
      id: templateId,
      organizationId: orgA,
      name: "Plantilla Matriz",
      description: null,
      categoryId: null,
      baseUnitId: null,
      isActive: true,
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z",
      createdBy: actor().actorId,
    });
    const result = await service.getDetail(actor(), productId);
    expect(result.product.id).toBe(productId);
    expect(result.template).not.toBeNull();
    expect(result.template!.id).toBe(templateId);
    expect(result.template!.name).toBe("Plantilla Matriz");
  });

  it("getDetail devuelve template null para producto legacy", async () => {
    const { service, store } = setup();
    const productId = newId();
    await store.create({
      name: "Producto Legacy",
      id: productId,
      organizationId: orgA,
      isActive: true,
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z",
      createdBy: actor().actorId,
    });
    const result = await service.getDetail(actor(), productId);
    expect(result.product.id).toBe(productId);
    expect(result.template).toBeNull();
  });

  it("getDetail lanza ProductNotFoundError para ID inexistente", async () => {
    const { service } = setup();
    await expect(
      service.getDetail(actor(), "00000000-0000-4000-8000-000000000000"),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
