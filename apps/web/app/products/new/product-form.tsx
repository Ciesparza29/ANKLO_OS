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
    <form onSubmit={submit} className="form-stack">
      <fieldset disabled={busy}>
        <legend>Datos básicos</legend>
        <div className="form-grid">
          <label>
            Nombre del producto
            <input name="name" required maxLength={200} />
          </label>
        </div>
        <label>
          Descripción
          <textarea name="description" maxLength={1000} />
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="actions">
        <button type="submit" disabled={busy}>
          Crear producto
        </button>
      </div>
    </form>
  );
}
