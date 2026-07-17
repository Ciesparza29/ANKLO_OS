import { createProductSchema, productListQuerySchema } from "@anklo/contracts";
import { apiError, parseJson } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getProductService,
} from "@/lib/product-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const url = new URL(request.url);
    const query = productListQuerySchema.parse({
      isActive: url.searchParams.has("isActive")
        ? url.searchParams.get("isActive") === "true"
        : undefined,
    });
    const products = await getProductService().list(actor, query);
    return Response.json({ products });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const input = await parseJson(request, createProductSchema);
    const created = await getProductService().create(actor, input);
    return Response.json({ product: created }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
