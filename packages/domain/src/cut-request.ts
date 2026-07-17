import type {
  CreateCutRequestInput,
  CutExecutionMode,
  CutRequestDto,
  CutRequestLineDto,
  CutRequestStatus,
} from "@anklo/contracts";

export type CutRequestErrorCode =
  | "INVALID_STATE"
  | "MATERIAL_OWNER_REQUIRED"
  | "LINES_REQUIRED"
  | "INVALID_MAGNITUDE"
  | "UNIT_NOT_RECOGNIZED"
  | "EXTERNAL_PROVIDER_REQUIRED"
  | "EXTERNAL_PROVIDER_NOT_ALLOWED"
  | "CANCELLATION_REASON_REQUIRED"
  | "HISTORY_IMMUTABLE"
  | "VERSION_CONFLICT";

export class CutRequestDomainError extends Error {
  constructor(
    readonly code: CutRequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CutRequestDomainError";
  }
}

export type CutRequestLineState = CutRequestLineDto;

export interface CutRequestState extends Omit<CutRequestDto, "lines"> {
  readonly lines: readonly CutRequestLineState[];
}

export interface CreateCutRequestDomainInput extends Omit<
  CreateCutRequestInput,
  "clientOperationId"
> {
  readonly id: string;
  readonly organizationId: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly lineIds: readonly string[];
}

function assertPositiveDecimal(value: string): void {
  if (!/^\d+(?:\.\d+)?$/.test(value) || !/[1-9]/.test(value)) {
    throw new CutRequestDomainError(
      "INVALID_MAGNITUDE",
      "Cantidad y longitud deben ser mayores que cero",
    );
  }
}

function assertMode(mode: CutExecutionMode, provider?: string): void {
  if (mode === "EXTERNAL" && !provider?.trim()) {
    throw new CutRequestDomainError(
      "EXTERNAL_PROVIDER_REQUIRED",
      "La modalidad externa exige proveedor",
    );
  }
  if (mode === "INTERNAL" && provider) {
    throw new CutRequestDomainError(
      "EXTERNAL_PROVIDER_NOT_ALLOWED",
      "La modalidad interna no admite proveedor externo",
    );
  }
}

export class CutRequest {
  private constructor(private state: CutRequestState) {}

  static create(
    input: CreateCutRequestDomainInput,
    recognizedUnits: ReadonlySet<string>,
  ): CutRequest {
    if (input.lines.length === 0) {
      throw new CutRequestDomainError(
        "LINES_REQUIRED",
        "La solicitud requiere al menos una línea",
      );
    }
    assertMode(input.executionMode, input.externalProvider);
    const lines = input.lines.map((line, position) => {
      assertPositiveDecimal(line.quantity);
      assertPositiveDecimal(line.requestedLength);
      if (!recognizedUnits.has(line.unit)) {
        throw new CutRequestDomainError(
          "UNIT_NOT_RECOGNIZED",
          `La unidad ${line.unit} no está reconocida`,
        );
      }
      const lineId = input.lineIds[position];
      if (!lineId) {
        throw new CutRequestDomainError(
          "LINES_REQUIRED",
          "Cada línea requiere un identificador",
        );
      }
      return {
        id: lineId,
        productSpecification: line.productSpecification,
        quantity: line.quantity,
        unit: line.unit,
        requestedLength: line.requestedLength,
        ...(line.tolerance ? { tolerance: line.tolerance } : {}),
        ...(line.observation ? { observation: line.observation } : {}),
        position,
      };
    });
    const timestamp = input.createdAt.toISOString();
    return new CutRequest({
      id: input.id,
      organizationId: input.organizationId,
      requestingUnit: input.requestingUnit,
      requester: input.requester,
      ...(input.materialOwner ? { materialOwner: input.materialOwner } : {}),
      currentCustodian: input.currentCustodian,
      executionMode: input.executionMode,
      ...(input.expectedExecutor
        ? { expectedExecutor: input.expectedExecutor }
        : {}),
      ...(input.externalProvider
        ? { externalProvider: input.externalProvider }
        : {}),
      ...(input.reference ? { reference: input.reference } : {}),
      priority: input.priority,
      requiredAt: input.requiredAt,
      ...(input.observations ? { observations: input.observations } : {}),
      status: "DRAFT",
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: input.createdBy,
      lines,
    });
  }

  static restore(state: CutRequestState): CutRequest {
    return new CutRequest(state);
  }

  snapshot(): CutRequestState {
    return structuredClone(this.state);
  }

  submit(actor: string, at: Date, expectedVersion: number): void {
    this.assertDraft(expectedVersion);
    if (!this.state.materialOwner?.trim()) {
      throw new CutRequestDomainError(
        "MATERIAL_OWNER_REQUIRED",
        "Debe identificar al propietario del material antes de enviar",
      );
    }
    assertMode(this.state.executionMode, this.state.externalProvider);
    this.state = this.transition("SUBMITTED", actor, at);
  }

  cancel(
    actor: string,
    at: Date,
    expectedVersion: number,
    reason: string,
  ): void {
    this.assertDraft(expectedVersion);
    if (!reason.trim()) {
      throw new CutRequestDomainError(
        "CANCELLATION_REASON_REQUIRED",
        "La cancelación exige un motivo",
      );
    }
    this.state = this.transition("CANCELLED", actor, at);
  }

  replaceDraft(next: CutRequestState, expectedVersion: number): void {
    this.assertDraft(expectedVersion);
    this.state = {
      ...next,
      id: this.state.id,
      organizationId: this.state.organizationId,
      createdAt: this.state.createdAt,
      createdBy: this.state.createdBy,
      status: "DRAFT",
      version: this.state.version + 1,
      updatedAt: next.updatedAt,
    };
  }

  remove(): never {
    throw new CutRequestDomainError(
      "HISTORY_IMMUTABLE",
      "La historia de solicitudes no se elimina",
    );
  }

  private assertDraft(expectedVersion: number): void {
    if (this.state.version !== expectedVersion) {
      throw new CutRequestDomainError(
        "VERSION_CONFLICT",
        "La solicitud fue modificada por otra operación",
      );
    }
    if (this.state.status !== "DRAFT") {
      throw new CutRequestDomainError(
        "INVALID_STATE",
        "Solo una solicitud en borrador puede cambiar de estado",
      );
    }
  }

  private transition(
    status: CutRequestStatus,
    _actor: string,
    at: Date,
  ): CutRequestState {
    return {
      ...this.state,
      status,
      version: this.state.version + 1,
      updatedAt: at.toISOString(),
    };
  }
}
