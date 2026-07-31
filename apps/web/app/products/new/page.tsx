import { ProductForm } from "./product-form";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <main className="wide">
      <nav
        aria-label="Breadcrumb"
        style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "#64748b" }}
      >
        <ol
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            gap: "0.5rem",
          }}
        >
          <li>
            <a href="/" style={{ color: "#3b82f6", textDecoration: "none" }}>
              Inicio
            </a>
          </li>
          <li>/</li>
          <li>
            <a
              href="/products"
              style={{ color: "#3b82f6", textDecoration: "none" }}
            >
              Catálogo de Productos
            </a>
          </li>
          <li>/</li>
          <li
            aria-current="page"
            style={{ color: "#0f172a", fontWeight: "500" }}
          >
            Nuevo producto base
          </li>
        </ol>
      </nav>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0" }}>Crear plantilla de producto</h1>
        <p style={{ margin: 0, color: "#64748b" }}>
          Define la información maestra de un nuevo producto. Las
          especificaciones técnicas (variantes) se configurarán en una etapa
          posterior.
        </p>
      </div>

      <ProductForm />
    </main>
  );
}
