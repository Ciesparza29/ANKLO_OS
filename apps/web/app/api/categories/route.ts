import { apiError } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getProductCategoryService,
} from "@/lib/product-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const categories = await getProductCategoryService().list(actor);
    return Response.json({ categories });
  } catch (error) {
    return apiError(error);
  }
}
