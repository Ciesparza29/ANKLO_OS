import { getRecognizedUnits } from "@/lib/cut-request-context";
import { CutRequestForm } from "./request-form";

export const dynamic = "force-dynamic";

export default function NewCutRequestPage() {
  return (
    <main className="wide">
      <p>
        <a href="/cut-requests">← Volver al listado</a>
      </p>
      <p className="eyebrow">Solicitud manual</p>
      <h1>Nueva solicitud de corte</h1>
      <CutRequestForm units={[...getRecognizedUnits()]} />
    </main>
  );
}
