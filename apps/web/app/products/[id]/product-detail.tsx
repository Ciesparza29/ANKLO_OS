"use client";

import type { ProductDto, ProductTemplateDto } from "@anklo/contracts";
import { useEffect, useState } from "react";

interface ProductDetailProps {
  readonly id: string;
}

interface DetailPayload {
  readonly product: ProductDto;
  readonly template: ProductTemplateDto | null;
}

export function ProductDetail({ id }: ProductDetailProps) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/products/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404) {
          throw new Error("Producto no encontrado");
        }
        if (!response.ok) {
          throw new Error("No fue posible consultar el producto");
        }
        return (await response.json()) as DetailPayload;
      })
      .then((body) => setData(body))
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setError(
            reason instanceof Error ? reason.message : "Error inesperado",
          );
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
          color: "#64748b",
        }}
      >
        Cargando detalle del producto…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          padding: "1rem",
          backgroundColor: "#fef2f2",
          border: "1px solid #f87171",
          borderRadius: "6px",
          color: "#991b1b",
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { product, template } = data;

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 0.5rem 0" }}>{product.name}</h1>
          <span
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: "600",
              backgroundColor: product.isActive ? "#dcfce7" : "#f1f5f9",
              color: product.isActive ? "#166534" : "#64748b",
            }}
          >
            {product.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
      </header>

      {/* Datos básicos del producto */}
      <section
        style={{
          marginBottom: "2rem",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Datos del Producto
          </h2>
        </div>
        <div style={{ padding: "1rem" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem 2rem",
              margin: 0,
            }}
          >
            <Field label="SKU" value={product.sku} />
            <Field label="Código externo" value={product.externalCode} />
            <Field label="Categoría" value={product.category} />
            <Field label="Fabricante" value={product.manufacturer} />
            <Field label="Unidad base" value={product.baseUnit} />
            <Field
              label="Fecha de registro"
              value={new Date(product.createdAt).toLocaleDateString("es-EC", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <Field label="Descripción" value={product.description} fullWidth />
          </dl>
        </div>
      </section>

      {/* Bloque de plantilla */}
      <section
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            Plantilla Matriz
          </h2>
        </div>
        {template ? (
          <div style={{ padding: "1rem" }}>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem 2rem",
                margin: 0,
              }}
            >
              <Field label="Nombre" value={template.name} />
              <Field
                label="Estado"
                value={template.isActive ? "Activa" : "Inactiva"}
              />
              <Field
                label="Descripción"
                value={template.description ?? undefined}
                fullWidth
              />
              <Field
                label="Creada"
                value={new Date(template.createdAt).toLocaleDateString(
                  "es-EC",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              />
              <Field
                label="Actualizada"
                value={new Date(template.updatedAt).toLocaleDateString(
                  "es-EC",
                  { year: "numeric", month: "long", day: "numeric" },
                )}
              />
            </dl>
          </div>
        ) : (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "#94a3b8",
              fontStyle: "italic",
            }}
          >
            Sin plantilla asociada (Legacy)
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value?: string | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div style={fullWidth ? { gridColumn: "1 / -1" } : undefined}>
      <dt
        style={{
          fontSize: "0.8rem",
          fontWeight: "600",
          color: "#64748b",
          textTransform: "uppercase",
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: 0, color: value ? "#0f172a" : "#cbd5e1" }}>
        {value || "—"}
      </dd>
    </div>
  );
}
