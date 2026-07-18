-- AlterTable
ALTER TABLE "products" ADD COLUMN     "template_id" UUID;

-- CreateTable
CREATE TABLE "product_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "category_id" UUID,
    "base_unit_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "product_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_templates_org_is_active_idx" ON "product_templates"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_templates_organization_id_id_key" ON "product_templates"("organization_id", "id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_template_fkey" FOREIGN KEY ("organization_id", "template_id") REFERENCES "product_templates"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_category_fkey" FOREIGN KEY ("organization_id", "category_id") REFERENCES "product_categories"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_base_unit_fkey" FOREIGN KEY ("organization_id", "base_unit_id") REFERENCES "units_of_measure"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
