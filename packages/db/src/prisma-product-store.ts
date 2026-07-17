import type { ProductListQuery } from "@anklo/contracts";
import type { ProductState, ProductStore } from "@anklo/domain";
import {
  Prisma,
  type PrismaClient,
  type Product,
} from "../generated/client/client";

type TransactionClient = Prisma.TransactionClient;

function toState(record: Product): ProductState {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    ...(record.description ? { description: record.description } : {}),
    ...(record.sku ? { sku: record.sku } : {}),
    ...(record.externalCode ? { externalCode: record.externalCode } : {}),
    ...(record.category ? { category: record.category } : {}),
    ...(record.manufacturer ? { manufacturer: record.manufacturer } : {}),
    ...(record.baseUnit ? { baseUnit: record.baseUnit } : {}),
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdBy: record.createdBy,
  };
}

async function setTenant(
  transaction: TransactionClient,
  organizationId: string,
): Promise<void> {
  await transaction.$executeRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
}

export class PrismaProductStore implements ProductStore {
  constructor(private readonly prisma: PrismaClient) {}

  async create(state: ProductState): Promise<ProductState> {
    return await this.withTenant(state.organizationId, async (transaction) => {
      const created = await transaction.product.create({
        data: {
          id: state.id,
          organizationId: state.organizationId,
          name: state.name,
          description: state.description ?? null,
          sku: state.sku ?? null,
          externalCode: state.externalCode ?? null,
          category: state.category ?? null,
          manufacturer: state.manufacturer ?? null,
          baseUnit: state.baseUnit ?? null,
          isActive: state.isActive,
          createdAt: new Date(state.createdAt),
          updatedAt: new Date(state.updatedAt),
          createdBy: state.createdBy,
        },
      });
      return toState(created);
    });
  }

  async list(
    organizationId: string,
    query: ProductListQuery,
  ): Promise<readonly ProductState[]> {
    return this.withTenant(organizationId, async (transaction) => {
      const records = await transaction.product.findMany({
        where: {
          organizationId,
          ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
        },
        orderBy: [{ name: "asc" }],
        take: 200,
      });
      return records.map(toState);
    });
  }

  private withTenant<T>(
    organizationId: string,
    work: (transaction: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      await setTenant(transaction, organizationId);
      return work(transaction);
    });
  }
}
