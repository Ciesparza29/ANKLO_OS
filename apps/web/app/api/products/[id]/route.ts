import { cutRequestIdSchema } from "@anklo/contracts";
import { apiError } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getProductService,
} from "@/lib/product-context";

interface RouteContext {
  readonly params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const id = cutRequestIdSchema.parse((await context.params).id);
    const result = await getProductService().getDetail(actor, id);
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
