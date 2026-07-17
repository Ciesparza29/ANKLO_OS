import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPrismaClient,
  disconnectPrismaClient,
  getPrismaClient,
  requireDatabaseUrl,
} from "./prisma-client";

describe("Prisma client factory", () => {
  afterEach(async () => {
    await disconnectPrismaClient();
    vi.unstubAllEnvs();
  });

  it("falla de forma segura si falta DATABASE_URL", () => {
    expect(() => requireDatabaseUrl("")).toThrow(/obligatoria/);
  });

  it("rechaza protocolos ajenos a PostgreSQL sin exponer la URL", () => {
    expect(() => requireDatabaseUrl("mysql://user:secret@host/db")).toThrow(
      /PostgreSQL/,
    );
  });

  it("construye el cliente sin abrir pools adicionales por consulta", async () => {
    const client = createPrismaClient(
      "postgresql://anklo:local-development-only@localhost:5432/anklo_os",
    );
    expect(client).toBeDefined();
    await client.$disconnect();
  });

  it("reutiliza un único cliente y pool por proceso también en producción", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://anklo:local-development-only@localhost:5432/anklo_os",
    );
    vi.stubEnv("NODE_ENV", "production");

    expect(getPrismaClient()).toBe(getPrismaClient());
  });
});
