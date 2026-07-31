import { ProductDetail } from "./product-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

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
            Detalle
          </li>
        </ol>
      </nav>
      <ProductDetail id={id} />
    </main>
  );
}
