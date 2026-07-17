import { ProductList } from "./product-list";

export default function ProductsPage() {
  return (
    <main className="wide">
      <header className="page-header">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Productos</h1>
        </div>
        <a className="button" href="/products/new">
          Nuevo producto
        </a>
      </header>
      <ProductList />
    </main>
  );
}
