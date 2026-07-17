import { ProductList } from "./product-list";

export default function ProductsPage() {
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
          <li
            aria-current="page"
            style={{ color: "#0f172a", fontWeight: "500" }}
          >
            Catálogo de Productos
          </li>
        </ol>
      </nav>

      <header
        className="page-header"
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
          <h1 style={{ margin: "0 0 0.5rem 0" }}>
            Catálogo Maestro de Productos
          </h1>
          <p style={{ margin: 0, color: "#64748b" }}>
            Directorio centralizado de productos, herramientas y consumibles
            aprobados para uso en la organización.
          </p>
        </div>
        <a
          className="button"
          href="/products/new"
          style={{ fontWeight: "bold" }}
        >
          + Nuevo producto
        </a>
      </header>

      <ProductList />
    </main>
  );
}
