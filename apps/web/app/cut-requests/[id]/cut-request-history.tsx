import type { CutRequestHistoryEntryDto } from "@anklo/contracts";

export type CutRequestHistoryViewState =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ready";
      readonly history: readonly CutRequestHistoryEntryDto[];
    };

const actionLabels = {
  CUT_REQUEST_CREATED: "Solicitud creada",
  CUT_REQUEST_SUBMITTED: "Solicitud enviada",
  CUT_REQUEST_CANCELLED: "Solicitud cancelada",
} as const;

export function CutRequestHistory({
  state,
}: {
  readonly state: CutRequestHistoryViewState;
}) {
  if (state.status === "loading") {
    return (
      <section aria-labelledby="history-title" aria-busy="true">
        <h2 id="history-title">Historial</h2>
        <p role="status">Cargando historial…</p>
      </section>
    );
  }
  if (state.status === "error") {
    return (
      <section aria-labelledby="history-title">
        <h2 id="history-title">Historial</h2>
        <p role="alert" className="error">
          {state.message}
        </p>
      </section>
    );
  }
  if (state.history.length === 0) {
    return (
      <section aria-labelledby="history-title">
        <h2 id="history-title">Historial</h2>
        <p role="status" className="empty">
          No hay eventos visibles.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="history-title">
      <h2 id="history-title">Historial</h2>
      <ol className="timeline">
        {state.history.map((event) => (
          <li key={event.id}>
            <h3>{actionLabels[event.action]}</h3>
            <dl>
              <div>
                <dt>Fecha y hora</dt>
                <dd>
                  <time dateTime={event.occurredAt}>
                    {new Date(event.occurredAt).toLocaleString("es-EC")}
                  </time>
                </dd>
              </div>
              <div>
                <dt>Referencia técnica del actor</dt>
                <dd>
                  <code>{event.actorReference}</code>
                </dd>
              </div>
              {event.action === "CUT_REQUEST_CANCELLED" && (
                <div>
                  <dt>Motivo de cancelación</dt>
                  <dd>{event.reason}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}
