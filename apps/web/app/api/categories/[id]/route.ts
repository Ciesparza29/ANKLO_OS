import { apiError } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getProductCategoryService,
} from "@/lib/product-context";
import { updateCatalogStateSchema } from "@anklo/contracts";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const body = await request.json();
    const { id } = await params;
    const { isActive } = updateCatalogStateSchema.parse(body);

    const category = await getProductCategoryService().updateState(
      actor,
      id,
      isActive,
    );
    return Response.json(category);
  } catch (error) {
    return apiError(error);
  }
}
