import { CutRequestDetail } from "./request-detail";

export default function CutRequestDetailPage() {
  return (
    <main className="wide">
      <p>
        <a href="/cut-requests">← Volver al listado</a>
      </p>
      <CutRequestDetail />
    </main>
  );
}
