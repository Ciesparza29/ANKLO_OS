import type { ProductDto, CreateProductInput } from "@anklo/contracts";

export type ProductErrorCode = "NAME_REQUIRED";

export class ProductDomainError extends Error {
  constructor(
    readonly code: ProductErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProductDomainError";
  }
}

export type ProductState = ProductDto;

export interface CreateProductDomainInput extends CreateProductInput {
  readonly id: string;
  readonly templateId?: string;
  readonly organizationId: string;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export class Product {
  private constructor(private state: ProductState) {}

  static create(input: CreateProductDomainInput): Product {
    if (!input.name.trim()) {
      throw new ProductDomainError(
        "NAME_REQUIRED",
        "El producto debe tener un nombre",
      );
    }
    const timestamp = input.createdAt.toISOString();
    return new Product({
      id: input.id,
      organizationId: input.organizationId,
      name: input.name,
      ...(input.description ? { description: input.description } : {}),
      ...(input.sku ? { sku: input.sku } : {}),
      ...(input.externalCode ? { externalCode: input.externalCode } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.baseUnitId ? { baseUnitId: input.baseUnitId } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.manufacturer ? { manufacturer: input.manufacturer } : {}),
      ...(input.baseUnit ? { baseUnit: input.baseUnit } : {}),
      ...(input.templateId ? { templateId: input.templateId } : {}),
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: input.createdBy,
    });
  }

  static restore(state: ProductState): Product {
    return new Product(state);
  }

  snapshot(): ProductState {
    return structuredClone(this.state);
  }
}
