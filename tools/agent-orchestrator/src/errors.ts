export type ErrorDetails = Readonly<Record<string, unknown>>;

export class OrchestratorError extends Error {
  readonly code: string;
  readonly exitCode: number;
  readonly details: ErrorDetails;

  constructor(
    code: string,
    message: string,
    options: {
      exitCode?: number;
      details?: ErrorDetails;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "OrchestratorError";
    this.code = code;
    this.exitCode = options.exitCode ?? 2;
    this.details = options.details ?? {};
  }
}

export function normalizeError(error: unknown): OrchestratorError {
  if (error instanceof OrchestratorError) return error;
  if (error instanceof Error) {
    return new OrchestratorError("UNEXPECTED_ERROR", error.message, {
      exitCode: 1,
      cause: error,
    });
  }
  return new OrchestratorError("UNEXPECTED_ERROR", "Unknown failure", {
    exitCode: 1,
    details: { received: String(error) },
  });
}
