import { apiError } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getUnitOfMeasureService,
} from "@/lib/product-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const units = await getUnitOfMeasureService().list(actor);
    return Response.json({ units });
  } catch (error) {
    return apiError(error);
  }
}
