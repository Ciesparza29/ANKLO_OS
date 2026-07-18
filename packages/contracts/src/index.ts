import { z } from "zod";

export { ZodError } from "zod";
export type { ZodType } from "zod";

export const healthResponseSchema = z
  .object({
    status: z.literal("ok"),
    service: z.string().min(1),
    timestamp: z.iso.datetime(),
    version: z.string().min(1),
  })
  .strict();

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const CUT_REQUEST_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "CANCELLED",
] as const;
export const CUT_EXECUTION_MODES = ["INTERNAL", "EXTERNAL"] as const;
export const CUT_REQUEST_CAPABILITIES = [
  "cut_request:create",
  "cut_request:read",
  "cut_request:read_history",
  "cut_request:submit",
  "cut_request:cancel",
] as const;

export const PRODUCT_CAPABILITIES = ["product:create", "product:read"] as const;

export const CUT_REQUEST_HISTORY_ACTIONS = [
  "CUT_REQUEST_CREATED",
  "CUT_REQUEST_SUBMITTED",
  "CUT_REQUEST_CANCELLED",
] as const;

export const cutRequestStatusSchema = z.enum(CUT_REQUEST_STATUSES);
export const cutExecutionModeSchema = z.enum(CUT_EXECUTION_MODES);
export const cutRequestCapabilitySchema = z.enum(CUT_REQUEST_CAPABILITIES);
export const productCapabilitySchema = z.enum(PRODUCT_CAPABILITIES);
export const cutRequestHistoryActionSchema = z.enum(
  CUT_REQUEST_HISTORY_ACTIONS,
);

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const positiveDecimalSchema = z
  .string()
  .trim()
  .max(80)
  .regex(/^\d+(?:\.\d+)?$/, "Debe ser un número decimal positivo")
  .refine((value) => /[1-9]/.test(value), "Debe ser mayor que cero");

export const unitCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[A-Z0-9][A-Z0-9._-]*$/, "Código de unidad inválido");

export const cutRequestLineInputSchema = z
  .object({
    productSpecification: requiredText(500),
    quantity: positiveDecimalSchema,
    unit: unitCodeSchema,
    requestedLength: positiveDecimalSchema,
    tolerance: optionalText(120),
    observation: optionalText(1000),
  })
  .strict();

export const createCutRequestSchema = z
  .object({
    clientOperationId: z.uuid(),
    requestingUnit: requiredText(200),
    requester: requiredText(200),
    materialOwner: optionalText(200),
    currentCustodian: requiredText(200),
    executionMode: cutExecutionModeSchema,
    expectedExecutor: optionalText(200),
    externalProvider: optionalText(200),
    reference: optionalText(120),
    priority: requiredText(80),
    requiredAt: z.iso.datetime({ offset: true }),
    observations: optionalText(2000),
    lines: z.array(cutRequestLineInputSchema).min(1).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.executionMode === "EXTERNAL" && !value.externalProvider) {
      context.addIssue({
        code: "custom",
        path: ["externalProvider"],
        message: "La modalidad externa exige un proveedor identificable",
      });
    }
    if (value.executionMode === "INTERNAL" && value.externalProvider) {
      context.addIssue({
        code: "custom",
        path: ["externalProvider"],
        message: "La modalidad interna no admite proveedor externo",
      });
    }
  });

export const cutRequestListQuerySchema = z
  .object({ status: cutRequestStatusSchema.optional() })
  .strict();

export const submitCutRequestSchema = z
  .object({
    clientOperationId: z.uuid(),
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export const cancelCutRequestSchema = z
  .object({
    clientOperationId: z.uuid(),
    expectedVersion: z.number().int().positive(),
    reason: requiredText(500),
  })
  .strict();

export const cutRequestIdSchema = z.uuid();

const cutRequestHistoryBase = {
  id: z.uuid(),
  occurredAt: z.iso.datetime(),
  actorReference: z.uuid(),
};

export const cutRequestHistoryEntrySchema = z.discriminatedUnion("action", [
  z
    .object({
      ...cutRequestHistoryBase,
      action: z.literal("CUT_REQUEST_CREATED"),
    })
    .strict(),
  z
    .object({
      ...cutRequestHistoryBase,
      action: z.literal("CUT_REQUEST_SUBMITTED"),
    })
    .strict(),
  z
    .object({
      ...cutRequestHistoryBase,
      action: z.literal("CUT_REQUEST_CANCELLED"),
      reason: requiredText(500),
    })
    .strict(),
]);

export const cutRequestHistoryResponseSchema = z
  .object({ history: z.array(cutRequestHistoryEntrySchema) })
  .strict();

export const createProductSchema = z
  .object({
    name: requiredText(200),
    description: optionalText(1000),
    sku: optionalText(120),
    externalCode: optionalText(120),
    categoryId: z.string().uuid().optional(),
    baseUnitId: z.string().uuid().optional(),
    category: optionalText(100),
    manufacturer: optionalText(100),
    baseUnit: optionalText(32),
  })
  .strict();

export const productListQuerySchema = z
  .object({ isActive: z.boolean().optional() })
  .strict();

export type CutRequestStatus = z.infer<typeof cutRequestStatusSchema>;
export type CutExecutionMode = z.infer<typeof cutExecutionModeSchema>;
export type CutRequestCapability = z.infer<typeof cutRequestCapabilitySchema>;
export type ProductCapability = z.infer<typeof productCapabilitySchema>;
export type CutRequestHistoryAction = z.infer<
  typeof cutRequestHistoryActionSchema
>;
export type CutRequestHistoryEntryDto = z.infer<
  typeof cutRequestHistoryEntrySchema
>;
export type CutRequestHistoryResponse = z.infer<
  typeof cutRequestHistoryResponseSchema
>;
export type CutRequestLineInput = z.infer<typeof cutRequestLineInputSchema>;
export type CreateCutRequestInput = z.infer<typeof createCutRequestSchema>;
export type CutRequestListQuery = z.infer<typeof cutRequestListQuerySchema>;
export type SubmitCutRequestInput = z.infer<typeof submitCutRequestSchema>;
export type CancelCutRequestInput = z.infer<typeof cancelCutRequestSchema>;

export interface CutRequestLineDto {
  readonly id: string;
  readonly productSpecification: string;
  readonly quantity: string;
  readonly unit: string;
  readonly requestedLength: string;
  readonly tolerance?: string;
  readonly observation?: string;
  readonly position: number;
}

export interface CutRequestDto {
  readonly id: string;
  readonly organizationId: string;
  readonly requestingUnit: string;
  readonly requester: string;
  readonly materialOwner?: string;
  readonly currentCustodian: string;
  readonly executionMode: CutExecutionMode;
  readonly expectedExecutor?: string;
  readonly externalProvider?: string;
  readonly reference?: string;
  readonly priority: string;
  readonly requiredAt: string;
  readonly observations?: string;
  readonly status: CutRequestStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly lines: readonly CutRequestLineDto[];
}

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export interface ProductDto {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly description?: string;
  readonly sku?: string;
  readonly externalCode?: string;
  readonly categoryId?: string;
  readonly baseUnitId?: string;
  readonly category?: string;
  readonly manufacturer?: string;
  readonly baseUnit?: string;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
}

export const productCategoryDtoSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProductCategoryDto = z.infer<typeof productCategoryDtoSchema>;

export const unitOfMeasureDtoSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  symbol: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UnitOfMeasureDto = z.infer<typeof unitOfMeasureDtoSchema>;

export const productTemplateSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  categoryId: z.string().uuid().nullable(),
  baseUnitId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
});

export type ProductTemplateDto = z.infer<typeof productTemplateSchema>;

export const createProductTemplateSchema = z
  .object({
    name: requiredText(200),
    description: optionalText(1000),
    categoryId: z.string().uuid().optional(),
    baseUnitId: z.string().uuid().optional(),
  })
  .strict();

export const createProductCategorySchema = z
  .object({
    name: requiredText(100),
    code: optionalText(32),
  })
  .strict();

export type CreateProductCategoryInput = z.infer<
  typeof createProductCategorySchema
>;

export const createUnitOfMeasureSchema = z
  .object({
    name: requiredText(100),
    symbol: requiredText(32),
  })
  .strict();

export type CreateUnitOfMeasureInput = z.infer<
  typeof createUnitOfMeasureSchema
>;

export const updateCatalogStateSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type UpdateCatalogStateInput = z.infer<typeof updateCatalogStateSchema>;
