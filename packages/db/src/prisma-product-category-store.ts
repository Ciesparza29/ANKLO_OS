import type { ProductCategoryDto } from "@anklo/contracts";
import {
  Prisma,
  type PrismaClient,
  type ProductCategory,
} from "../generated/client/client";

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

  async list(organizationId: string): Promise<readonly ProductCategoryDto[]> {
    const records = await this.prisma.productCategory.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ name: "asc" }],
      take: 200,
    });
    return records.map(toDto);
  }
}
