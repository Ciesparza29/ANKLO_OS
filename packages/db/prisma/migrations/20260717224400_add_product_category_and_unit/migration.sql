-- AlterTable
ALTER TABLE "products" ADD COLUMN     "base_unit_id" UUID,
ADD COLUMN     "category_id" UUID;

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_categories_org_is_active_idx" ON "product_categories"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_organization_id_id_key" ON "product_categories"("organization_id", "id");

-- CreateIndex
CREATE INDEX "units_of_measure_org_is_active_idx" ON "units_of_measure"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_organization_id_id_key" ON "units_of_measure"("organization_id", "id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_fkey" FOREIGN KEY ("organization_id", "category_id") REFERENCES "product_categories"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_base_unit_fkey" FOREIGN KEY ("organization_id", "base_unit_id") REFERENCES "units_of_measure"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
