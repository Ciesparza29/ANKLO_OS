import { afterEach, describe, expect, it, vi } from "vitest";
import { getActorContext, getRecognizedUnits } from "./cut-request-context";

describe("contexto temporal de solicitudes de corte", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("falla cerrado en producción aunque existan variables ficticias", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANKLO_DEV_ACTOR_ID", crypto.randomUUID());
    vi.stubEnv("ANKLO_DEV_ORGANIZATION_ID", crypto.randomUUID());
    vi.stubEnv(
      "ANKLO_DEV_CUT_REQUEST_CAPABILITIES",
      "cut_request:read,cut_request:read_history",
    );
    expect(() => getActorContext()).toThrow(
      "La identidad productiva aún no está configurada",
    );
  });

  it("acepta la capacidad de historial solo en el contexto ficticio", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ANKLO_DEV_ACTOR_ID", crypto.randomUUID());
    vi.stubEnv("ANKLO_DEV_ORGANIZATION_ID", crypto.randomUUID());
    vi.stubEnv(
      "ANKLO_DEV_CUT_REQUEST_CAPABILITIES",
      "cut_request:read,cut_request:read_history",
    );
    expect(getActorContext().capabilities).toEqual(
      new Set(["cut_request:read", "cut_request:read_history"]),
    );
  });

  it("mantiene MM como configuración explícita, no como catálogo implícito", () => {
    vi.stubEnv("ANKLO_CUT_REQUEST_UNITS", "MM");
    expect(getRecognizedUnits()).toEqual(new Set(["MM"]));
    vi.stubEnv("ANKLO_CUT_REQUEST_UNITS", "");
    expect(() => getRecognizedUnits()).toThrow(
      "No hay unidades de corte reconocidas configuradas",
    );
  });
});
