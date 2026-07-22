import type { ProductTemplateDto } from "@anklo/contracts";
import type { PrismaClient, ProductTemplate } from "../generated/client/client";

function toDto(record: ProductTemplate): ProductTemplateDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    description: record.description,
    categoryId: record.categoryId,
    baseUnitId: record.baseUnitId,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy,
  };
}

export class PrismaProductTemplateStore {
  constructor(private readonly prisma: PrismaClient) {}

  async list(
    organizationId: string,
    isActive?: boolean,
  ): Promise<readonly ProductTemplateDto[]> {
    const records = await this.prisma.productTemplate.findMany({
      where: {
        organizationId,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: [{ name: "asc" }],
      take: 200,
    });
    return records.map(toDto);
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductTemplateDto | null> {
    const record = await this.prisma.productTemplate.findFirst({
      where: {
        organizationId,
        name: { equals: name, mode: "insensitive" as const },
      },
    });
    return record ? toDto(record) : null;
  }

  async create(
    organizationId: string,
    name: string,
    description: string | null,
    categoryId: string | null,
    baseUnitId: string | null,
    createdBy: string,
  ): Promise<ProductTemplateDto> {
    const record = await this.prisma.productTemplate.create({
      data: {
        organizationId,
        name,
        description,
        categoryId,
        baseUnitId,
        isActive: true,
        createdBy,
      },
    });
    return toDto(record);
  }
}
