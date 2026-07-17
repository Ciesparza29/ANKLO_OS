CREATE TYPE "CutRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CANCELLED');
CREATE TYPE "CutExecutionMode" AS ENUM ('INTERNAL', 'EXTERNAL');
CREATE TYPE "CutRequestOperationAction" AS ENUM (
  'CUT_REQUEST_CREATED',
  'CUT_REQUEST_SUBMITTED',
  'CUT_REQUEST_CANCELLED'
);

CREATE TABLE "cut_requests" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "requesting_unit" VARCHAR(200) NOT NULL,
  "requester" VARCHAR(200) NOT NULL,
  "material_owner" VARCHAR(200),
  "current_custodian" VARCHAR(200) NOT NULL,
  "execution_mode" "CutExecutionMode" NOT NULL,
  "expected_executor" VARCHAR(200),
  "external_provider" VARCHAR(200),
  "reference" VARCHAR(120),
  "priority" VARCHAR(80) NOT NULL,
  "required_at" TIMESTAMPTZ(6) NOT NULL,
  "observations" TEXT,
  "status" "CutRequestStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "created_by" UUID NOT NULL,
  CONSTRAINT "cut_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cut_requests_mode_provider_check" CHECK (
    ("execution_mode" = 'EXTERNAL' AND "external_provider" IS NOT NULL)
    OR ("execution_mode" = 'INTERNAL' AND "external_provider" IS NULL)
  ),
  CONSTRAINT "cut_requests_version_check" CHECK ("version" > 0)
);

CREATE TABLE "cut_request_lines" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "cut_request_id" UUID NOT NULL,
  "product_specification" VARCHAR(500) NOT NULL,
  "quantity" DECIMAL NOT NULL,
  "unit" VARCHAR(32) NOT NULL,
  "requested_length" DECIMAL NOT NULL,
  "tolerance" VARCHAR(120),
  "observation" TEXT,
  "position" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cut_request_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cut_request_lines_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "cut_request_lines_length_check" CHECK ("requested_length" > 0),
  CONSTRAINT "cut_request_lines_position_check" CHECK ("position" >= 0)
);

CREATE TABLE "cut_request_operations" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "client_operation_id" UUID NOT NULL,
  "cut_request_id" UUID NOT NULL,
  "action" "CutRequestOperationAction" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cut_request_operations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "actor_id" UUID NOT NULL,
  "entity_type" VARCHAR(80) NOT NULL,
  "entity_id" UUID NOT NULL,
  "action" "CutRequestOperationAction" NOT NULL,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL,
  "before" JSONB,
  "after" JSONB NOT NULL,
  "reason" TEXT,
  "correlation_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cut_requests_organization_id_id_key" ON "cut_requests"("organization_id", "id");
CREATE INDEX "cut_requests_org_status_required_idx" ON "cut_requests"("organization_id", "status", "required_at");
CREATE INDEX "cut_requests_org_created_idx" ON "cut_requests"("organization_id", "created_at");
CREATE UNIQUE INDEX "cut_request_lines_org_request_position_key" ON "cut_request_lines"("organization_id", "cut_request_id", "position");
CREATE INDEX "cut_request_lines_org_request_idx" ON "cut_request_lines"("organization_id", "cut_request_id");
CREATE UNIQUE INDEX "cut_request_operations_org_client_key" ON "cut_request_operations"("organization_id", "client_operation_id");
CREATE INDEX "cut_request_operations_org_request_idx" ON "cut_request_operations"("organization_id", "cut_request_id");
CREATE INDEX "audit_events_org_entity_occurred_idx" ON "audit_events"("organization_id", "entity_type", "entity_id", "occurred_at");
CREATE INDEX "audit_events_org_correlation_idx" ON "audit_events"("organization_id", "correlation_id");

ALTER TABLE "cut_request_lines" ADD CONSTRAINT "cut_request_lines_request_fkey"
  FOREIGN KEY ("organization_id", "cut_request_id")
  REFERENCES "cut_requests"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cut_request_operations" ADD CONSTRAINT "cut_request_operations_request_fkey"
  FOREIGN KEY ("organization_id", "cut_request_id")
  REFERENCES "cut_requests"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cut_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cut_request_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cut_request_operations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "cut_requests" FORCE ROW LEVEL SECURITY;
ALTER TABLE "cut_request_lines" FORCE ROW LEVEL SECURITY;
ALTER TABLE "cut_request_operations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" FORCE ROW LEVEL SECURITY;

CREATE POLICY "cut_requests_tenant_policy" ON "cut_requests"
  USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID);
CREATE POLICY "cut_request_lines_tenant_policy" ON "cut_request_lines"
  USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID);
CREATE POLICY "cut_request_operations_tenant_policy" ON "cut_request_operations"
  USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID);
CREATE POLICY "audit_events_tenant_policy" ON "audit_events"
  USING ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID)
  WITH CHECK ("organization_id" = NULLIF(current_setting('app.organization_id', true), '')::UUID);

CREATE RULE "audit_events_no_update" AS ON UPDATE TO "audit_events" DO INSTEAD NOTHING;
CREATE RULE "audit_events_no_delete" AS ON DELETE TO "audit_events" DO INSTEAD NOTHING;
