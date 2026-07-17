import {
  productCapabilitySchema,
  cutRequestIdSchema,
  type ProductCapability,
} from "@anklo/contracts";
import { getPrismaClient, PrismaProductStore } from "@anklo/db";
import { ProductService, type ProductActorContext } from "@anklo/domain";

function csv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getProductActorContext(): ProductActorContext {
  if (process.env.NODE_ENV === "production") {
    throw new Error("La identidad productiva aún no está configurada");
  }
  const identity = {
    actorId: cutRequestIdSchema.parse(process.env.ANKLO_DEV_ACTOR_ID),
    organizationId: cutRequestIdSchema.parse(
      process.env.ANKLO_DEV_ORGANIZATION_ID,
    ),
  };

  const capabilities = new Set<ProductCapability>(
    csv(process.env.ANKLO_DEV_PRODUCT_CAPABILITIES).map((capability) =>
      productCapabilitySchema.parse(capability),
    ),
  );
  return { ...identity, capabilities };
}

export function getProductService(): ProductService {
  return new ProductService({
    store: new PrismaProductStore(getPrismaClient()),
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
  });
}
