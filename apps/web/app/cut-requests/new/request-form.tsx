"use client";

import { createCutRequestSchema } from "@anklo/contracts";
import { useState } from "react";

interface DraftLine {
  readonly key: string;
  productSpecification: string;
  quantity: string;
  unit: string;
  requestedLength: string;
  observation: string;
}

function line(unit: string): DraftLine {
  return {
    key: crypto.randomUUID(),
    productSpecification: "",
    quantity: "",
    unit,
    requestedLength: "",
    observation: "",
  };
}

export function CutRequestForm({
  units,
}: Readonly<{ units: readonly string[] }>) {
  const [lines, setLines] = useState<DraftLine[]>([line(units[0] ?? "")]);
  const [mode, setMode] = useState("INTERNAL");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function updateLine(index: number, field: keyof DraftLine, value: string) {
    setLines((current) =>
      current.map((item, position) =>
        position === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "value",
    );
    setError("");
    const requiredAtValue = String(form.get("requiredAt"));
    const requiredAtDate = new Date(requiredAtValue);
    const parsed = createCutRequestSchema.safeParse({
      clientOperationId: crypto.randomUUID(),
      requestingUnit: form.get("requestingUnit"),
      requester: form.get("requester"),
      materialOwner: form.get("materialOwner"),
      currentCustodian: form.get("currentCustodian"),
      executionMode: mode,
      expectedExecutor: form.get("expectedExecutor"),
      externalProvider:
        mode === "EXTERNAL" ? form.get("externalProvider") : undefined,
      reference: form.get("reference"),
      priority: form.get("priority"),
      requiredAt: Number.isNaN(requiredAtDate.getTime())
        ? requiredAtValue
        : requiredAtDate.toISOString(),
      observations: form.get("observations"),
      lines: lines.map((item) => ({
        productSpecification: item.productSpecification,
        quantity: item.quantity,
        unit: item.unit,
        requestedLength: item.requestedLength,
        observation: item.observation,
      })),
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(" · "));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/cut-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json()) as {
        request?: { id: string; version: number };
        message?: string;
      };
      if (!response.ok || !body.request)
        throw new Error(body.message ?? "No fue posible guardar el borrador");
      if (intent === "submit") {
        const sent = await fetch(
          `/api/cut-requests/${body.request.id}/submit`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              clientOperationId: crypto.randomUUID(),
              expectedVersion: body.request.version,
            }),
          },
        );
        if (!sent.ok) {
          window.location.assign(`/cut-requests/${body.request.id}`);
          return;
        }
      }
      window.location.assign(`/cut-requests/${body.request.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error inesperado");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="form-stack">
      <fieldset disabled={busy}>
        <legend>Cabecera</legend>
        <div className="form-grid">
          <label>
            Empresa o unidad solicitante
            <input name="requestingUnit" required maxLength={200} />
          </label>
          <label>
            Solicitante
            <input name="requester" required maxLength={200} />
          </label>
          <label>
            Propietario del material
            <input
              name="materialOwner"
              required
              maxLength={200}
              aria-describedby="owner-help"
            />
            <small id="owner-help">Obligatorio antes de enviar.</small>
          </label>
          <label>
            Custodio actual
            <input name="currentCustodian" required maxLength={200} />
          </label>
          <label>
            Modalidad
            <select
              name="executionMode"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
            >
              <option value="INTERNAL">Interna</option>
              <option value="EXTERNAL">Externa / subcontratada</option>
            </select>
          </label>
          <label>
            Ejecutor previsto
            <input name="expectedExecutor" maxLength={200} />
          </label>
          {mode === "EXTERNAL" && (
            <label>
              Proveedor externo
              <input name="externalProvider" required maxLength={200} />
            </label>
          )}
          <label>
            Referencia opcional
            <input name="reference" maxLength={120} />
          </label>
          <label>
            Prioridad
            <input name="priority" required maxLength={80} />
          </label>
          <label>
            Fecha requerida
            <input name="requiredAt" type="datetime-local" required />
          </label>
        </div>
        <label>
          Observaciones
          <textarea name="observations" maxLength={2000} />
        </label>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Líneas</legend>
        {lines.map((item, index) => (
          <div className="line-card" key={item.key}>
            <label>
              Producto o especificación
              <input
                required
                maxLength={500}
                value={item.productSpecification}
                onChange={(event) =>
                  updateLine(index, "productSpecification", event.target.value)
                }
              />
            </label>
            <label>
              Cantidad
              <input
                required
                inputMode="decimal"
                value={item.quantity}
                onChange={(event) =>
                  updateLine(index, "quantity", event.target.value)
                }
              />
            </label>
            <label>
              Unidad
              <select
                required
                value={item.unit}
                onChange={(event) =>
                  updateLine(index, "unit", event.target.value)
                }
              >
                {units.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </label>
            <label>
              Longitud solicitada
              <input
                required
                inputMode="decimal"
                value={item.requestedLength}
                onChange={(event) =>
                  updateLine(index, "requestedLength", event.target.value)
                }
              />
            </label>
            <label>
              Observación
              <input
                maxLength={1000}
                value={item.observation}
                onChange={(event) =>
                  updateLine(index, "observation", event.target.value)
                }
              />
            </label>
            <button
              type="button"
              className="secondary"
              disabled={lines.length === 1}
              onClick={() =>
                setLines((current) =>
                  current.filter((_, position) => position !== index),
                )
              }
            >
              Quitar línea
            </button>
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            setLines((current) => [...current, line(units[0] ?? "")])
          }
        >
          Agregar línea
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="actions">
        <button name="intent" value="draft" disabled={busy}>
          Guardar borrador
        </button>
        <button name="intent" value="submit" disabled={busy}>
          Guardar y enviar
        </button>
      </div>
    </form>
  );
}
