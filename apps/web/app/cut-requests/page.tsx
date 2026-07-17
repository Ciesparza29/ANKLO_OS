import { CutRequestList } from "./request-list";

export default function CutRequestsPage() {
  return (
    <main className="wide">
      <header className="page-header">
        <div>
          <p className="eyebrow">Manufactura y corte · Incremento 1A</p>
          <h1>Solicitudes de corte</h1>
        </div>
        <a className="button" href="/cut-requests/new">
          Nueva solicitud
        </a>
      </header>
      <CutRequestList />
    </main>
  );
}
