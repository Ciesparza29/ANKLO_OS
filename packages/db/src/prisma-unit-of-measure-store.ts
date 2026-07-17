import type { UnitOfMeasureDto } from "@anklo/contracts";
import {
  Prisma,
  type PrismaClient,
  type UnitOfMeasure,
} from "../generated/client/client";

function toDto(record: UnitOfMeasure): UnitOfMeasureDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    symbol: record.symbol,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaUnitOfMeasureStore {
  constructor(private readonly prisma: PrismaClient) {}

  async list(organizationId: string): Promise<readonly UnitOfMeasureDto[]> {
    const records = await this.prisma.unitOfMeasure.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ name: "asc" }],
      take: 200,
    });
    return records.map(toDto);
  }
}
