"use client";

import type { CutRequestDto, CutRequestStatus } from "@anklo/contracts";
import { useEffect, useState } from "react";

const labels: Record<CutRequestStatus, string> = {
  DRAFT: "Borrador",
  SUBMITTED: "Enviada",
  CANCELLED: "Cancelada",
};

export function CutRequestList() {
  const [status, setStatus] = useState("");
  const [requests, setRequests] = useState<readonly CutRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const suffix = status ? `?status=${status}` : "";
    fetch(`/api/cut-requests${suffix}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("No fue posible consultar las solicitudes");
        return (await response.json()) as { requests: CutRequestDto[] };
      })
      .then((body) => setRequests(body.requests))
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setError(
            reason instanceof Error ? reason.message : "Error inesperado",
          );
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [status]);

  return (
    <section aria-busy={loading}>
      <label className="filter">
        Estado
        <select
          value={status}
          onChange={(event) => {
            setLoading(true);
            setError("");
            setStatus(event.target.value);
          }}
        >
          <option value="">Todos</option>
          <option value="DRAFT">Borrador</option>
          <option value="SUBMITTED">Enviada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </label>
      {loading && <p role="status">Cargando solicitudes…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!loading && !error && requests.length === 0 && (
        <div className="empty">
          <h2>No hay solicitudes</h2>
          <p>Crea un borrador para iniciar el registro manual.</p>
        </div>
      )}
      {!loading && !error && requests.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Referencia</th>
                <th>Solicitante</th>
                <th>Propietario</th>
                <th>Custodio</th>
                <th>Prioridad</th>
                <th>Fecha requerida</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <span
                      className={`status status-${request.status.toLowerCase()}`}
                    >
                      {labels[request.status]}
                    </span>
                  </td>
                  <td>
                    <a href={`/cut-requests/${request.id}`}>
                      {request.reference ?? "Sin referencia"}
                    </a>
                  </td>
                  <td>{request.requester}</td>
                  <td>{request.materialOwner ?? "Pendiente"}</td>
                  <td>{request.currentCustodian}</td>
                  <td>{request.priority}</td>
                  <td>
                    {new Date(request.requiredAt).toLocaleDateString("es-EC")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
