import { cancelCutRequestSchema, cutRequestIdSchema } from "@anklo/contracts";
import { apiError, parseJson } from "@/lib/cut-request-http";
import {
  getActorContext,
  getCutRequestService,
} from "@/lib/cut-request-context";

interface RouteContext {
  readonly params: Promise<{ id: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const actor = getActorContext();
    const id = cutRequestIdSchema.parse((await context.params).id);
    const input = await parseJson(request, cancelCutRequestSchema);
    const result = await getCutRequestService().cancel(actor, id, input);
    return Response.json({ request: result });
  } catch (error) {
    return apiError(error);
  }
}
