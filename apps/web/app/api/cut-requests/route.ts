import {
  createCutRequestSchema,
  cutRequestListQuerySchema,
} from "@anklo/contracts";
import { apiError, parseJson } from "@/lib/cut-request-http";
import {
  getActorContext,
  getCutRequestService,
} from "@/lib/cut-request-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = getActorContext();
    const url = new URL(request.url);
    const query = cutRequestListQuerySchema.parse({
      status: url.searchParams.get("status") ?? undefined,
    });
    const requests = await getCutRequestService().list(actor, query);
    return Response.json({ requests });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = getActorContext();
    const input = await parseJson(request, createCutRequestSchema);
    const created = await getCutRequestService().create(actor, input);
    return Response.json({ request: created }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
