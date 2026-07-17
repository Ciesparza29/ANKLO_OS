export default function Home() {
  return (
    <main>
      <p className="eyebrow">Operación controlada</p>
      <h1>ANKLO-OS</h1>
      <p>Incremento 1A de manufactura y corte.</p>
      <p>
        <a className="button" href="/cut-requests">
          Abrir solicitudes de corte
        </a>
        <a
          className="button secondary"
          href="/products"
          style={{ marginLeft: "1rem" }}
        >
          Catálogo de Productos
        </a>
      </p>
      <aside>
        Esta entrega registra solicitudes. No planifica, reserva ni mueve
        inventario.
      </aside>
    </main>
  );
}
