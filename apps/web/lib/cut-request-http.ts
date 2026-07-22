import { ZodError, type ZodType } from "@anklo/contracts";
import { CutRequestDomainError } from "@anklo/domain";
import {
  CutRequestAuthorizationError,
  CutRequestNotFoundError,
  ProductAuthorizationError,
  ProductDomainError,
  ProductNotFoundError,
} from "@anklo/domain";

export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ZodError([
      { code: "custom", path: [], message: "El cuerpo JSON es inválido" },
    ]);
  }
  return schema.parse(body);
}

export function apiError(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      { error: "VALIDATION_ERROR", issues: error.issues },
      { status: 400 },
    );
  }
  if (error instanceof CutRequestAuthorizationError) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (error instanceof CutRequestNotFoundError) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (error instanceof CutRequestDomainError) {
    const status =
      error.code === "VERSION_CONFLICT" || error.code === "INVALID_STATE"
        ? 409
        : 422;
    return Response.json(
      { error: error.code, message: error.message },
      { status },
    );
  }
  if (error instanceof ProductAuthorizationError) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (error instanceof ProductNotFoundError) {
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (error instanceof ProductDomainError) {
    return Response.json(
      { error: error.code, message: error.message },
      { status: 422 },
    );
  }
  return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
}
