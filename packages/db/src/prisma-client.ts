import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client/client";

const globalPrisma = globalThis as typeof globalThis & {
  ankloPrisma?: PrismaClient;
};

export function requireDatabaseUrl(value = process.env.DATABASE_URL): string {
  if (!value) {
    throw new Error("DATABASE_URL es obligatoria para usar persistencia");
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DATABASE_URL no tiene un formato válido");
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("DATABASE_URL debe usar PostgreSQL");
  }
  return value;
}

export function createPrismaClient(
  databaseUrl = requireDatabaseUrl(),
): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: requireDatabaseUrl(databaseUrl),
  });
  return new PrismaClient({ adapter, errorFormat: "minimal" });
}

export function getPrismaClient(): PrismaClient {
  globalPrisma.ankloPrisma ??= createPrismaClient();
  return globalPrisma.ankloPrisma;
}

export async function disconnectPrismaClient(): Promise<void> {
  if (globalPrisma.ankloPrisma) {
    await globalPrisma.ankloPrisma.$disconnect();
    delete globalPrisma.ankloPrisma;
  }
}
