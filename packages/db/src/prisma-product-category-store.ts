import type { ProductCategoryDto } from "@anklo/contracts";
import type { PrismaClient, ProductCategory } from "../generated/client/client";

function toDto(record: ProductCategory): ProductCategoryDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    code: record.code ?? undefined,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaProductCategoryStore {
  constructor(private readonly prisma: PrismaClient) {}

  async list(
    organizationId: string,
    isActive?: boolean,
  ): Promise<readonly ProductCategoryDto[]> {
    const records = await this.prisma.productCategory.findMany({
      where: {
        organizationId,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: [{ name: "asc" }],
      take: 200,
    });
    return records.map(toDto);
  }

  async findByNameOrCode(
    organizationId: string,
    name: string,
    code?: string,
  ): Promise<ProductCategoryDto | null> {
    const record = await this.prisma.productCategory.findFirst({
      where: {
        organizationId,
        OR: [
          { name: { equals: name, mode: "insensitive" as const } },
          ...(code
            ? [{ code: { equals: code, mode: "insensitive" as const } }]
            : []),
        ],
      },
    });
    return record ? toDto(record) : null;
  }

  async create(
    organizationId: string,
    name: string,
    code?: string,
  ): Promise<ProductCategoryDto> {
    const record = await this.prisma.productCategory.create({
      data: {
        organizationId,
        name,
        code: code ?? null,
        isActive: true,
      },
    });
    return toDto(record);
  }

  async updateState(
    id: string,
    organizationId: string,
    isActive: boolean,
  ): Promise<ProductCategoryDto> {
    await this.prisma.productCategory.updateMany({
      where: { id, organizationId },
      data: { isActive },
    });
    const record = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!record) throw new Error("Not found");
    return toDto(record);
  }
}
