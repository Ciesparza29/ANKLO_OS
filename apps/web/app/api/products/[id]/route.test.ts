import type { ProductDto, ProductTemplateDto } from "@anklo/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductNotFoundError } from "@anklo/domain";

const testContext = vi.hoisted(() => {
  const service = {
    create: vi.fn(),
    list: vi.fn(),
    getDetail: vi.fn(),
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

import { GET } from "./route";

const product: ProductDto = {
  id: "00000000-0000-4000-8000-000000000010",
  organizationId: "00000000-0000-4000-8000-000000000002",
  name: "Producto con Plantilla",
  isActive: true,
  templateId: "00000000-0000-4000-8000-000000000111",
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000001",
};

const template: ProductTemplateDto = {
  id: "00000000-0000-4000-8000-000000000111",
  organizationId: "00000000-0000-4000-8000-000000000002",
  name: "Plantilla Matriz",
  description: null,
  categoryId: null,
  baseUnitId: null,
  isActive: true,
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000001",
};

const legacyProduct: ProductDto = {
  id: "00000000-0000-4000-8000-000000000020",
  organizationId: "00000000-0000-4000-8000-000000000002",
  name: "Producto Legacy",
  isActive: true,
  templateId: null,
  createdAt: "2026-07-16T12:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
  createdBy: "00000000-0000-4000-8000-000000000001",
};

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("API GET /api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testContext.actorError = null;
  });

  it("200 con producto y plantilla", async () => {
    mocks.getDetail.mockResolvedValue({ product, template });
    const response = await GET(
      new Request(
        "http://localhost/api/products/00000000-0000-4000-8000-000000000010",
      ),
      makeContext("00000000-0000-4000-8000-000000000010"),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.product.id).toBe(product.id);
    expect(json.template.id).toBe(template.id);
    expect(json.template.name).toBe("Plantilla Matriz");
  });

  it("200 con template null para producto legacy", async () => {
    mocks.getDetail.mockResolvedValue({
      product: legacyProduct,
      template: null,
    });
    const response = await GET(
      new Request(
        "http://localhost/api/products/00000000-0000-4000-8000-000000000020",
      ),
      makeContext("00000000-0000-4000-8000-000000000020"),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.product.id).toBe(legacyProduct.id);
    expect(json.template).toBeNull();
  });

  it("404 para UUID inexistente", async () => {
    mocks.getDetail.mockRejectedValue(
      new ProductNotFoundError("Producto no encontrado"),
    );
    const response = await GET(
      new Request(
        "http://localhost/api/products/00000000-0000-4000-8000-000000000099",
      ),
      makeContext("00000000-0000-4000-8000-000000000099"),
    );

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("NOT_FOUND");
  });

  it("400 para ID con formato inválido", async () => {
    const response = await GET(
      new Request("http://localhost/api/products/not-a-uuid"),
      makeContext("not-a-uuid"),
    );

    expect(response.status).toBe(400);
  });
});
