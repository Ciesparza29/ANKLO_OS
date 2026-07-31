import { apiError } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getProductCategoryService,
} from "@/lib/product-context";

import { createProductCategorySchema } from "@anklo/contracts";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam === "true"
        ? true
        : isActiveParam === "false"
          ? false
          : undefined;

    const categories = await getProductCategoryService().list(actor, isActive);
    return Response.json({ categories });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const body = await request.json();
    const input = createProductCategorySchema.parse(body);

    const category = await getProductCategoryService().create(actor, input);
    return Response.json(category, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
