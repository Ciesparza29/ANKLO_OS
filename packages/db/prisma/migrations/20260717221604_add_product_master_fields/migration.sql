-- AlterTable
ALTER TABLE "products" ADD COLUMN     "base_unit" VARCHAR(32),
ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "external_code" VARCHAR(120),
ADD COLUMN     "manufacturer" VARCHAR(100),
ADD COLUMN     "sku" VARCHAR(120);
