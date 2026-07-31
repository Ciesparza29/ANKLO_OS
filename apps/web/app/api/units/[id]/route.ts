import { apiError } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getUnitOfMeasureService,
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

    const unit = await getUnitOfMeasureService().updateState(
      actor,
      id,
      isActive,
    );
    return Response.json(unit);
  } catch (error) {
    return apiError(error);
  }
}
