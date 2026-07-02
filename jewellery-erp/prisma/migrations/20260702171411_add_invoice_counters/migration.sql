-- DropIndex
DROP INDEX "customers_name_trgm_idx";

-- DropIndex
DROP INDEX "products_name_trgm_idx";

-- DropIndex
DROP INDEX "suppliers_name_trgm_idx";

-- CreateTable
CREATE TABLE "invoice_counters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "series" VARCHAR(10) NOT NULL,
    "fy" VARCHAR(7) NOT NULL,
    "next_seq" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_counters_tenant_id_idx" ON "invoice_counters"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_counters_tenant_id_series_fy_key" ON "invoice_counters"("tenant_id", "series", "fy");

-- AddForeignKey
ALTER TABLE "invoice_counters" ADD CONSTRAINT "invoice_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
