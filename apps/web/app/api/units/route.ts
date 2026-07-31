import { apiError } from "@/lib/cut-request-http";
import {
  getProductActorContext,
  getUnitOfMeasureService,
} from "@/lib/product-context";

import { createUnitOfMeasureSchema } from "@anklo/contracts";

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

    const units = await getUnitOfMeasureService().list(actor, isActive);
    return Response.json({ units });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = getProductActorContext();
    const body = await request.json();
    const input = createUnitOfMeasureSchema.parse(body);

    const unit = await getUnitOfMeasureService().create(actor, input);
    return Response.json(unit, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
