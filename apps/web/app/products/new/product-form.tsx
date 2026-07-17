"use client";

import { createProductSchema } from "@anklo/contracts";
import { useState } from "react";

export function ProductForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");

    const parsed = createProductSchema.safeParse({
      name: form.get("name"),
      description: form.get("description") || undefined,
      sku: form.get("sku") || undefined,
      externalCode: form.get("externalCode") || undefined,
      category: form.get("category") || undefined,
      manufacturer: form.get("manufacturer") || undefined,
      baseUnit: form.get("baseUnit") || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(" · "));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = (await response.json()) as {
        product?: { id: string };
        message?: string;
      };

      if (!response.ok || !body.product) {
        throw new Error(body.message ?? "No fue posible crear el producto");
      }

      window.location.assign("/products");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error inesperado");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="form-stack"
      style={{ maxWidth: "800px" }}
    >
      <fieldset
        disabled={busy}
        style={{
          padding: "1.5rem",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          marginBottom: "1.5rem",
        }}
      >
        <legend
          style={{ fontWeight: "bold", padding: "0 8px", color: "#0f172a" }}
        >
          Información General
        </legend>
        <p
          style={{
            color: "#64748b",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          Datos básicos para identificar la plantilla del producto dentro del
          catálogo.
        </p>

        <div className="form-grid" style={{ marginBottom: "1rem" }}>
          <label>
            Nombre del producto <span style={{ color: "#ef4444" }}>*</span>
            <input
              name="name"
              required
              maxLength={200}
              placeholder="Ej. Adhesivo Epóxico RE 500 V3"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
        </div>

        <label>
          Descripción técnica
          <textarea
            name="description"
            maxLength={1000}
            placeholder="Detalles, usos recomendados o especificaciones base..."
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
          />
        </label>
      </fieldset>

      <fieldset
        disabled={busy}
        style={{
          padding: "1.5rem",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <legend
          style={{ fontWeight: "bold", padding: "0 8px", color: "#0f172a" }}
        >
          Datos de Referencia y Clasificación
        </legend>
        <p
          style={{
            color: "#64748b",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          Campos opcionales para la clasificación y trazabilidad del producto.
        </p>

        <div
          className="form-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            Código Interno / SKU
            <input
              name="sku"
              type="text"
              placeholder="Ej. ADH-500"
              maxLength={120}
              style={{
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            Código Externo / Fabricante
            <input
              name="externalCode"
              type="text"
              placeholder="Ej. REF-X99"
              maxLength={120}
              style={{
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
          {/* TODO: Estos campos son texto libre temporalmente. En el futuro evolucionarán a un catálogo relacional propio */}
          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            Categoría / Familia
            <input
              name="category"
              type="text"
              placeholder="Ej. Adhesivos"
              maxLength={100}
              style={{
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            Fabricante o Marca
            <input
              name="manufacturer"
              type="text"
              placeholder="Ej. Hilti"
              maxLength={100}
              style={{
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
          <label
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            Unidad de Medida Base
            <input
              name="baseUnit"
              type="text"
              placeholder="Ej. Pieza"
              maxLength={32}
              style={{
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </label>
        </div>
      </fieldset>

      {error && (
        <div
          role="alert"
          className="error"
          style={{
            padding: "1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #f87171",
            borderRadius: "6px",
            color: "#991b1b",
            marginBottom: "1.5rem",
          }}
        >
          <strong>Error: </strong> {error}
        </div>
      )}

      <div
        className="actions"
        style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
      >
        <a
          href="/products"
          style={{
            padding: "0.5rem 1rem",
            textDecoration: "none",
            color: "#475569",
            fontWeight: "500",
          }}
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={busy}
          style={{ padding: "0.5rem 1.5rem", fontWeight: "bold" }}
        >
          {busy ? "Guardando..." : "Guardar Producto Base"}
        </button>
      </div>
    </form>
  );
}
