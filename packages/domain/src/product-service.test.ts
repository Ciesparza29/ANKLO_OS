import type {
  ProductCapability,
  ProductListQuery,
  CreateProductInput,
} from "@anklo/contracts";
import { describe, expect, it } from "vitest";
import { type ProductState } from "./product";
import {
  ProductAuthorizationError,
  ProductService,
  type ProductActorContext,
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

  it("permite listar con product:read", async () => {
    const { service, store } = setup();
    await store.create({
      name: "Producto Ficticio",
      description: "Descripción ficticia",
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
    await expect(service.list(ctx, {})).resolves.toHaveLength(1);
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
});
