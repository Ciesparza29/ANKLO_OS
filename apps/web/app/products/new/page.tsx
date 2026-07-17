import { ProductForm } from "./product-form";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <main className="wide">
      <p>
        <a href="/products">← Volver al listado</a>
      </p>
      <p className="eyebrow">Catálogo</p>
      <h1>Nuevo producto</h1>
      <ProductForm />
    </main>
  );
}
