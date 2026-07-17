import { cutRequestIdSchema } from "@anklo/contracts";
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
    const result = await getCutRequestService().get(actor, id);
    return Response.json({ request: result });
  } catch (error) {
    return apiError(error);
  }
}
