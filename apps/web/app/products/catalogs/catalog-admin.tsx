"use client";

import {
  type ProductCategoryDto,
  type UnitOfMeasureDto,
} from "@anklo/contracts";
import { useState, useEffect } from "react";
import Link from "next/link";

export function CatalogAdmin() {
  const [categories, setCategories] = useState<ProductCategoryDto[]>([]);
  const [units, setUnits] = useState<UnitOfMeasureDto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCatalogs() {
    try {
      const [catRes, unitRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/units"),
      ]);
      if (catRes.ok) {
        const { categories } = await catRes.json();
        setCategories(categories);
      }
      if (unitRes.ok) {
        const { units } = await unitRes.json();
        setUnits(units);
      }
    } catch (err) {
      console.error("Failed to load catalogs", err);
      setError("Error de red al cargar catálogos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalogs();
  }, []);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name")?.toString().trim();
    const code = form.get("code")?.toString().trim();

    if (!name) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Error al crear categoría");
      } else {
        setError("");
        (event.target as HTMLFormElement).reset();
        await loadCatalogs();
      }
    } catch {
      setError("Error de red");
    }
  }

  async function createUnit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name")?.toString().trim();
    const symbol = form.get("symbol")?.toString().trim();

    if (!name || !symbol) return;

    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbol }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Error al crear unidad");
      } else {
        setError("");
        (event.target as HTMLFormElement).reset();
        await loadCatalogs();
      }
    } catch {
      setError("Error de red");
    }
  }

  async function toggleCategoryState(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        await loadCatalogs();
      } else {
        const data = await res.json();
        setError(data.error?.message || "Error al actualizar estado");
      }
    } catch {
      setError("Error de red");
    }
  }

  async function toggleUnitState(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        await loadCatalogs();
      } else {
        const data = await res.json();
        setError(data.error?.message || "Error al actualizar estado");
      }
    } catch {
      setError("Error de red");
    }
  }

  if (loading) {
    return <div className="p-4">Cargando catálogos...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Administración de Catálogos</h1>
        <Link href="/products/new" className="text-blue-600 hover:underline">
          Volver a Nuevo Producto
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Categorías</h2>

          <form onSubmit={createCategory} className="flex gap-2 mb-6">
            <input
              type="text"
              name="name"
              placeholder="Nombre (ej. Fijaciones)"
              required
              className="flex-1 border border-slate-300 rounded px-3 py-1.5"
            />
            <input
              type="text"
              name="code"
              placeholder="Código (opcional)"
              className="w-24 border border-slate-300 rounded px-3 py-1.5"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700"
            >
              Crear
            </button>
          </form>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-sm">
                <th className="pb-2 font-medium">Nombre</th>
                <th className="pb-2 font-medium">Código</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2">{c.name}</td>
                  <td className="py-2 text-slate-500">{c.code || "-"}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        c.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => toggleCategoryState(c.id, c.isActive)}
                      className={`text-sm ${
                        c.isActive
                          ? "text-red-600 hover:text-red-700"
                          : "text-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      {c.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No hay categorías
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Unidades de Medida</h2>

          <form onSubmit={createUnit} className="flex gap-2 mb-6">
            <input
              type="text"
              name="name"
              placeholder="Nombre (ej. Kilogramo)"
              required
              className="flex-1 border border-slate-300 rounded px-3 py-1.5"
            />
            <input
              type="text"
              name="symbol"
              placeholder="Símbolo (ej. KG)"
              required
              className="w-24 border border-slate-300 rounded px-3 py-1.5"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700"
            >
              Crear
            </button>
          </form>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-sm">
                <th className="pb-2 font-medium">Nombre</th>
                <th className="pb-2 font-medium">Símbolo</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2">{u.name}</td>
                  <td className="py-2 font-mono text-slate-500 text-sm">
                    {u.symbol}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        u.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => toggleUnitState(u.id, u.isActive)}
                      className={`text-sm ${
                        u.isActive
                          ? "text-red-600 hover:text-red-700"
                          : "text-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      {u.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">
                    No hay unidades
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
