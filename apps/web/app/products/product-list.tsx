"use client";

import type { ProductDto } from "@anklo/contracts";
import { useEffect, useState } from "react";

export function ProductList() {
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [products, setProducts] = useState<readonly ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = isActiveFilter === "" ? "" : `?isActive=${isActiveFilter}`;
    fetch(`/api/products${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("No fue posible consultar los productos");
        return (await response.json()) as { products: ProductDto[] };
      })
      .then((body) => setProducts(body.products))
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setError(
            reason instanceof Error ? reason.message : "Error inesperado",
          );
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [isActiveFilter]);

  return (
    <section aria-busy={loading}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "1.5rem",
        }}
      >
        <label
          className="filter"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            fontSize: "0.9rem",
            fontWeight: "500",
          }}
        >
          Filtrar por estado
          <select
            value={isActiveFilter}
            onChange={(event) => {
              setLoading(true);
              setError("");
              setIsActiveFilter(event.target.value);
            }}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="">Todos los productos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </label>

        <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
          {loading
            ? "Actualizando catálogo..."
            : `Mostrando ${products.length} producto(s)`}
        </div>
      </div>

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
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div
          className="empty"
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            border: "1px dashed #cbd5e1",
            borderRadius: "8px",
            backgroundColor: "#f8fafc",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              color: "#334155",
              marginBottom: "0.5rem",
            }}
          >
            Catálogo vacío
          </h2>
          <p
            style={{
              color: "#64748b",
              maxWidth: "400px",
              margin: "0 auto 1.5rem auto",
            }}
          >
            No se encontraron productos registrados en el sistema que coincidan
            con los criterios de búsqueda.
          </p>
          <a
            href="/products/new"
            className="button"
            style={{ fontWeight: "bold" }}
          >
            Crear el primer producto
          </a>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div
          className="table-wrap"
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead
              style={{
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Estado
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Nombre Base
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  SKU
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Categoría
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Descripción Técnica
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: "600",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Fecha Registro
                </th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "0.95rem" }}>
              {products.map((product) => (
                <tr
                  key={product.id}
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <td style={{ padding: "1rem" }}>
                    <span
                      className={`status status-${product.isActive ? "submitted" : "draft"}`}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        backgroundColor: product.isActive
                          ? "#dcfce7"
                          : "#f1f5f9",
                        color: product.isActive ? "#166534" : "#64748b",
                      }}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "500",
                      color: "#0f172a",
                    }}
                  >
                    {product.name}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#475569",
                    }}
                  >
                    {product.sku || "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#475569",
                    }}
                  >
                    {product.category || "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#475569",
                      maxWidth: "300px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {product.description || (
                      <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>
                        Sin descripción
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    {new Date(product.createdAt).toLocaleDateString("es-EC")}
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
