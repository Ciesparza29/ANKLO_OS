"use client";

import type {
  CutRequestDto,
  CutRequestHistoryResponse,
} from "@anklo/contracts";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CutRequestHistory,
  type CutRequestHistoryViewState,
} from "./cut-request-history";

type HistoryState = CutRequestHistoryViewState | { readonly status: "hidden" };

export function CutRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<CutRequestDto>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [historyState, setHistoryState] = useState<HistoryState>({
    status: "loading",
  });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/cut-requests/${id}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 404
              ? "Solicitud no encontrada"
              : "No fue posible cargar la solicitud",
          );
        return (await response.json()) as { request: CutRequestDto };
      })
      .then((body) => setRequest(body.request))
      .catch((reason: unknown) =>
        (reason as { name?: string }).name === "AbortError"
          ? undefined
          : setError(
              reason instanceof Error ? reason.message : "Error inesperado",
            ),
      );
    fetch(`/api/cut-requests/${id}/history`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 403) {
          setHistoryState({ status: "hidden" });
          return null;
        }
        if (!response.ok) {
          throw new Error("No fue posible cargar el historial");
        }
        return (await response.json()) as CutRequestHistoryResponse;
      })
      .then((body) => {
        if (body) setHistoryState({ status: "ready", history: body.history });
      })
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setHistoryState({
            status: "error",
            message:
              reason instanceof Error ? reason.message : "Error inesperado",
          });
        }
      });
    return () => controller.abort();
  }, [id]);

  async function transition(action: "submit" | "cancel", reason?: string) {
    if (!request) return;
    if (action === "cancel" && !reason?.trim()) {
      setError("La cancelación exige un motivo");
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch(`/api/cut-requests/${request.id}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientOperationId: crypto.randomUUID(),
        expectedVersion: request.version,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setError(body.message ?? "No fue posible completar la transición");
      setBusy(false);
      return;
    }
    setRequest(((await response.json()) as { request: CutRequestDto }).request);
    setBusy(false);
  }

  if (error && !request)
    return (
      <p role="alert" className="error">
        {error}
      </p>
    );
  if (!request) return <p role="status">Cargando detalle…</p>;
  return (
    <article>
      <p className="eyebrow">Solicitud manual</p>
      <h1>{request.reference ?? "Sin referencia"}</h1>
      <p>
        <span className={`status status-${request.status.toLowerCase()}`}>
          {request.status}
        </span>{" "}
        · Versión {request.version}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <dl className="detail-grid">
        <div>
          <dt>Unidad solicitante</dt>
          <dd>{request.requestingUnit}</dd>
        </div>
        <div>
          <dt>Solicitante</dt>
          <dd>{request.requester}</dd>
        </div>
        <div>
          <dt>Propietario</dt>
          <dd>{request.materialOwner ?? "Pendiente"}</dd>
        </div>
        <div>
          <dt>Custodio actual</dt>
          <dd>{request.currentCustodian}</dd>
        </div>
        <div>
          <dt>Modalidad</dt>
          <dd>{request.executionMode}</dd>
        </div>
        <div>
          <dt>Proveedor externo</dt>
          <dd>{request.externalProvider ?? "No aplica"}</dd>
        </div>
        <div>
          <dt>Prioridad</dt>
          <dd>{request.priority}</dd>
        </div>
        <div>
          <dt>Fecha requerida</dt>
          <dd>{new Date(request.requiredAt).toLocaleString("es-EC")}</dd>
        </div>
      </dl>
      <h2>Líneas</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto o especificación</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Longitud</th>
            </tr>
          </thead>
          <tbody>
            {request.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.position + 1}</td>
                <td>{line.productSpecification}</td>
                <td>{line.quantity}</td>
                <td>{line.unit}</td>
                <td>{line.requestedLength}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {historyState.status !== "hidden" && (
        <CutRequestHistory state={historyState} />
      )}
      {request.status === "DRAFT" ? (
        <>
          <div className="actions">
            <button disabled={busy} onClick={() => transition("submit")}>
              Enviar
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={() => setShowCancellation(true)}
            >
              Cancelar
            </button>
          </div>
          {showCancellation && (
            <section className="cancel-panel" aria-labelledby="cancel-title">
              <h2 id="cancel-title">Cancelar solicitud</h2>
              <label>
                Motivo de cancelación
                <textarea
                  required
                  maxLength={500}
                  value={cancellationReason}
                  onChange={(event) =>
                    setCancellationReason(event.target.value)
                  }
                />
              </label>
              <div className="actions">
                <button
                  className="danger"
                  disabled={busy || !cancellationReason.trim()}
                  onClick={() => transition("cancel", cancellationReason)}
                >
                  Confirmar cancelación
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setShowCancellation(false)}
                >
                  Volver
                </button>
              </div>
            </section>
          )}
        </>
      ) : (
        <aside>Esta solicitud es inmutable para edición ordinaria.</aside>
      )}
    </article>
  );
}
