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
      <label className="filter">
        Estado
        <select
          value={isActiveFilter}
          onChange={(event) => {
            setLoading(true);
            setError("");
            setIsActiveFilter(event.target.value);
          }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </label>
      {loading && <p role="status">Cargando productos…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!loading && !error && products.length === 0 && (
        <div className="empty">
          <h2>No hay productos</h2>
          <p>Aún no hay productos registrados en el catálogo.</p>
        </div>
      )}
      {!loading && !error && products.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <span
                      className={`status status-${product.isActive ? "submitted" : "draft"}`}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{product.name}</td>
                  <td>{product.description || "-"}</td>
                  <td>
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
