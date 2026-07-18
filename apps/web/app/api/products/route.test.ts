import type { ProductDto } from "@anklo/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testContext = vi.hoisted(() => {
  const service = {
    create: vi.fn(),
    list: vi.fn(),
  };
  return {
    actorError: null as Error | null,
    service,
    getService: vi.fn(() => service),
  };
});

const mocks = testContext.service;

vi.mock("@/lib/product-context", () => ({
  getProductActorContext: () => {
    if (testContext.actorError) throw testContext.actorError;
    return {
      actorId: "00000000-0000-4000-8000-000000000001",
      organizationId: "00000000-0000-4000-8000-000000000002",
      capabilities: new Set(),
    };
  },
  getProductService: testContext.getService,
}));

import { GET as list } from "./route";

const dtoWithTemplate: ProductDto = {
  id: "00000000-0000-4000-8000-000000000010",
  organizationId: "00000000-0000-4000-8000-000000000002",
  name: "Product with Template",
  isActive: true,
  templateId: "00000000-0000-4000-8000-000000000111",
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000001",
};

const dtoLegacy: ProductDto = {
  id: "00000000-0000-4000-8000-000000000020",
  organizationId: "00000000-0000-4000-8000-000000000002",
  name: "Legacy Product",
  isActive: true,
  templateId: null,
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000001",
};

describe("API products (Incremento C)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testContext.actorError = null;
  });

  it("GET /api/products devuelve templateId en el JSON cuando existe", async () => {
    mocks.list.mockResolvedValue([dtoWithTemplate]);
    const response = await list(new Request("http://localhost/api/products"));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.products).toHaveLength(1);
    expect(json.products[0].templateId).toBe("00000000-0000-4000-8000-000000000111");
  });

  it("GET /api/products devuelve templateId nulo en caso legacy", async () => {
    mocks.list.mockResolvedValue([dtoLegacy]);
    const response = await list(new Request("http://localhost/api/products"));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.products).toHaveLength(1);
    expect(json.products[0].templateId).toBeNull();
  });
});
