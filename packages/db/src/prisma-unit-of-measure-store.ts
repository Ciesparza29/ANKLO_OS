import type { UnitOfMeasureDto } from "@anklo/contracts";
import type { PrismaClient, UnitOfMeasure } from "../generated/client/client";

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

  async list(
    organizationId: string,
    isActive?: boolean,
  ): Promise<readonly UnitOfMeasureDto[]> {
    const records = await this.prisma.unitOfMeasure.findMany({
      where: {
        organizationId,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: [{ name: "asc" }],
      take: 200,
    });
    return records.map(toDto);
  }

  async findByNameOrSymbol(
    organizationId: string,
    name: string,
    symbol: string,
  ): Promise<UnitOfMeasureDto | null> {
    const record = await this.prisma.unitOfMeasure.findFirst({
      where: {
        organizationId,
        OR: [
          { name: { equals: name, mode: "insensitive" as const } },
          { symbol: { equals: symbol, mode: "insensitive" as const } },
        ],
      },
    });
    return record ? toDto(record) : null;
  }

  async create(
    organizationId: string,
    name: string,
    symbol: string,
  ): Promise<UnitOfMeasureDto> {
    const record = await this.prisma.unitOfMeasure.create({
      data: {
        organizationId,
        name,
        symbol,
        isActive: true,
      },
    });
    return toDto(record);
  }

  async updateState(
    id: string,
    organizationId: string,
    isActive: boolean,
  ): Promise<UnitOfMeasureDto> {
    await this.prisma.unitOfMeasure.updateMany({
      where: { id, organizationId },
      data: { isActive },
    });
    const record = await this.prisma.unitOfMeasure.findUnique({
      where: { id },
    });
    if (!record) throw new Error("Not found");
    return toDto(record);
  }
}
