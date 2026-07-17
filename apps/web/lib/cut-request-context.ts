import {
  cutRequestCapabilitySchema,
  cutRequestIdSchema,
  unitCodeSchema,
  type CutRequestCapability,
} from "@anklo/contracts";
import { getPrismaClient, PrismaCutRequestStore } from "@anklo/db";
import { CutRequestService, type ActorContext } from "@anklo/domain";

function csv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getActorContext(): ActorContext {
  if (process.env.NODE_ENV === "production") {
    throw new Error("La identidad productiva aún no está configurada");
  }
  const identity = {
    actorId: cutRequestIdSchema.parse(process.env.ANKLO_DEV_ACTOR_ID),
    organizationId: cutRequestIdSchema.parse(
      process.env.ANKLO_DEV_ORGANIZATION_ID,
    ),
  };
  const capabilities = new Set<CutRequestCapability>(
    csv(process.env.ANKLO_DEV_CUT_REQUEST_CAPABILITIES).map((capability) =>
      cutRequestCapabilitySchema.parse(capability),
    ),
  );
  return { ...identity, capabilities };
}

export function getRecognizedUnits(): ReadonlySet<string> {
  const units = csv(process.env.ANKLO_CUT_REQUEST_UNITS).map((unit) =>
    unitCodeSchema.parse(unit),
  );
  if (units.length === 0) {
    throw new Error("No hay unidades de corte reconocidas configuradas");
  }
  return new Set(units);
}

export function getCutRequestService(): CutRequestService {
  return new CutRequestService({
    store: new PrismaCutRequestStore(getPrismaClient()),
    recognizedUnits: getRecognizedUnits(),
    allowTolerance: false,
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
  });
}
