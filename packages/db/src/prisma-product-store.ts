import type { ProductListQuery, ProductTemplateDto } from "@anklo/contracts";
import type {
  ProductState,
  ProductStore,
  ProductDetailResult,
} from "@anklo/domain";
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
    ...(record.categoryId ? { categoryId: record.categoryId } : {}),
    ...(record.baseUnitId ? { baseUnitId: record.baseUnitId } : {}),
    ...(record.category ? { category: record.category } : {}),
    ...(record.manufacturer ? { manufacturer: record.manufacturer } : {}),
    ...(record.baseUnit ? { baseUnit: record.baseUnit } : {}),
    ...(record.templateId ? { templateId: record.templateId } : {}),
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
      if (state.templateId) {
        await transaction.productTemplate.create({
          data: {
            id: state.templateId,
            organizationId: state.organizationId,
            name: state.name,
            description: state.description ?? null,
            categoryId: state.categoryId ?? null,
            baseUnitId: state.baseUnitId ?? null,
            isActive: state.isActive,
            createdAt: new Date(state.createdAt),
            updatedAt: new Date(state.updatedAt),
            createdBy: state.createdBy,
          },
        });
      }

      const created = await transaction.product.create({
        data: {
          id: state.id,
          templateId: state.templateId ?? null,
          organizationId: state.organizationId,
          name: state.name,
          description: state.description ?? null,
          sku: state.sku ?? null,
          externalCode: state.externalCode ?? null,
          categoryId: state.categoryId ?? null,
          baseUnitId: state.baseUnitId ?? null,
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

  async findById(
    organizationId: string,
    id: string,
  ): Promise<ProductDetailResult | null> {
    return this.withTenant(organizationId, async (transaction) => {
      const record = await transaction.product.findUnique({
        where: { organizationId_id: { organizationId, id } },
        include: { template: true },
      });
      if (!record) return null;
      const template: ProductTemplateDto | null = record.template
        ? {
            id: record.template.id,
            organizationId: record.template.organizationId,
            name: record.template.name,
            description: record.template.description,
            categoryId: record.template.categoryId,
            baseUnitId: record.template.baseUnitId,
            isActive: record.template.isActive,
            createdAt: record.template.createdAt.toISOString(),
            updatedAt: record.template.updatedAt.toISOString(),
            createdBy: record.template.createdBy,
          }
        : null;
      return { product: toState(record), template };
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
