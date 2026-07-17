import type { CutRequestHistoryEntryDto } from "@anklo/contracts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CutRequestHistory } from "./cut-request-history";

const history: readonly CutRequestHistoryEntryDto[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    action: "CUT_REQUEST_CREATED",
    occurredAt: "2026-07-16T12:00:00.000Z",
    actorReference: "00000000-0000-4000-8000-000000000010",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    action: "CUT_REQUEST_CANCELLED",
    occurredAt: "2026-07-16T13:00:00.000Z",
    actorReference: "00000000-0000-4000-8000-000000000011",
    reason: "Motivo ficticio autorizado",
  },
];

const render = (state: Parameters<typeof CutRequestHistory>[0]["state"]) =>
  renderToStaticMarkup(createElement(CutRequestHistory, { state }));

describe("línea temporal de solicitudes de corte", () => {
  it("usa semántica accesible y presenta la referencia como técnica", () => {
    const html = render({ status: "ready", history });
    expect(html).toContain("<ol");
    expect(html).toContain("<time");
    expect(html).toContain("Referencia técnica del actor");
    expect(html).toContain("Motivo ficticio autorizado");
    expect(html).not.toContain("before");
    expect(html).not.toContain("after");
    expect(html).not.toContain("Estado");
  });

  it("solo muestra el motivo para una cancelación", () => {
    const html = render({ status: "ready", history });
    expect(html.match(/Motivo de cancelación/g)).toHaveLength(1);
  });

  it("cubre estados de carga, vacío y error", () => {
    expect(render({ status: "loading" })).toContain('role="status"');
    expect(render({ status: "ready", history: [] })).toContain(
      "No hay eventos visibles",
    );
    expect(render({ status: "error", message: "Fallo controlado" })).toContain(
      'role="alert"',
    );
  });
});
