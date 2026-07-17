import {
  cutRequestHistoryResponseSchema,
  cutRequestIdSchema,
} from "@anklo/contracts";
import { apiError } from "@/lib/cut-request-http";
import {
  getActorContext,
  getCutRequestService,
} from "@/lib/cut-request-context";

interface RouteContext {
  readonly params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const actor = getActorContext();
    const id = cutRequestIdSchema.parse((await context.params).id);
    const history = await getCutRequestService().getHistory(actor, id);
    const result = cutRequestHistoryResponseSchema.safeParse({ history });
    if (!result.success) {
      throw new Error("La proyección pública del historial es inválida");
    }
    return Response.json(result.data);
  } catch (error) {
    return apiError(error);
  }
}
