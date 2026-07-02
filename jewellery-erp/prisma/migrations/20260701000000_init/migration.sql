-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_session_jwt";

-- CreateEnum
CREATE TYPE "invoice_type" AS ENUM ('sales', 'purchase', 'quotation', 'estimate', 'return', 'exchange', 'repair');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'void');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'store_credit', 'gold_exchange');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "metal_type" AS ENUM ('gold', 'silver', 'platinum', 'diamond', 'other');

-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM ('purchase_in', 'sale_out', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out', 'return_in', 'return_out');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('in_app', 'email', 'sms', 'whatsapp');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('pending', 'sent', 'read', 'failed');

-- CreateEnum
CREATE TYPE "gst_tax_kind" AS ENUM ('cgst', 'sgst', 'igst', 'cess', 'exempt');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('create', 'update', 'delete', 'soft_delete', 'restore', 'login', 'logout', 'export');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_monthly" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "price_yearly" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "max_users" INTEGER,
    "max_invoices_monthly" INTEGER,
    "features" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tenant_id" TEXT,
    "rollout_json" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "gstin" VARCHAR(15),
    "pan" VARCHAR(10),
    "contact_email" TEXT,
    "contact_phone" VARCHAR(20),
    "address_json" JSONB,
    "logo_asset_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "onboarded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "base_currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "default_gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    "gst_registered" BOOLEAN NOT NULL DEFAULT true,
    "making_charge_mode" TEXT NOT NULL DEFAULT 'per_gram',
    "default_making_charge" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "invoice_prefix" TEXT NOT NULL DEFAULT 'INV',
    "invoice_next_seq" BIGINT NOT NULL DEFAULT 1,
    "financial_year_start_month" SMALLINT NOT NULL DEFAULT 4,
    "default_template_id" TEXT,
    "settings_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'trialing',
    "billing_cycle" TEXT NOT NULL DEFAULT 'monthly',
    "current_period_start" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_end" TIMESTAMPTZ NOT NULL,
    "trial_ends_at" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "external_ref" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" VARCHAR(20),
    "avatar_asset_id" TEXT,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tenant_memberships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invited_at" TIMESTAMPTZ,
    "joined_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_tenant_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "membership_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("membership_id","role_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "email" TEXT,
    "gstin" VARCHAR(15),
    "address_json" JSONB,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "opening_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "email" TEXT,
    "gstin" VARCHAR(15),
    "address_json" JSONB,
    "opening_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "metal_type" "metal_type",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "hsn_code_id" TEXT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metal_type" "metal_type" NOT NULL DEFAULT 'gold',
    "default_purity_fineness" DECIMAL(6,3),
    "default_karat" SMALLINT,
    "making_charge_mode" TEXT,
    "making_charge_value" DECIMAL(14,4),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "tag_number" TEXT,
    "gross_weight" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "net_weight" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "stone_weight" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "wastage_percent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "purity_fineness" DECIMAL(6,3) NOT NULL,
    "karat" SMALLINT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "cost_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_stock',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "type" "stock_movement_type" NOT NULL,
    "weight" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "adjustment_id" TEXT,
    "transfer_id" TEXT,
    "balance_after_weight" DECIMAL(12,3),
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "adjusted_by" TEXT,
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'posted',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_location" TEXT NOT NULL,
    "to_location" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_transit',
    "dispatched_by" TEXT,
    "received_by" TEXT,
    "dispatched_at" TIMESTAMPTZ,
    "received_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metal_type" "metal_type" NOT NULL,
    "purity_fineness" DECIMAL(6,3),
    "rate_date" DATE NOT NULL,
    "rate_per_gram" DECIMAL(14,4) NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "metal_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hsn_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "description" TEXT,
    "default_gst_percent" DECIMAL(5,2) NOT NULL DEFAULT 3.00,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "hsn_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "hsn_code_id" TEXT,
    "name" TEXT NOT NULL,
    "kind" "gst_tax_kind" NOT NULL,
    "rate_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "type" "invoice_type" NOT NULL DEFAULT 'sales',
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "customer_id" TEXT,
    "supplier_id" TEXT,
    "template_id" TEXT,
    "related_invoice_id" TEXT,
    "invoice_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE,
    "place_of_supply" VARCHAR(2),
    "is_igst" BOOLEAN NOT NULL DEFAULT false,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "making_charges_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cgst_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sgst_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "igst_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "round_off" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_due" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "issued_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "product_id" TEXT,
    "inventory_item_id" TEXT,
    "hsn_code_id" TEXT,
    "metal_rate_id" TEXT,
    "tax_rate_id" TEXT,
    "description" TEXT NOT NULL,
    "metal_type" "metal_type",
    "purity_fineness" DECIMAL(6,3),
    "karat" SMALLINT,
    "gross_weight" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "net_weight" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rate_per_gram" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "metal_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "making_charge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "stone_charge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxable_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sgst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "igst_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "customer_id" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" "payment_method" NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'completed',
    "reference_no" TEXT,
    "exchange_metal_weight" DECIMAL(12,3),
    "exchange_metal_value" DECIMAL(14,2),
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "invoice_type",
    "layout" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "invoice_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" "notification_channel" NOT NULL DEFAULT 'in_app',
    "status" "notification_status" NOT NULL DEFAULT 'pending',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "read_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "actor_user_id" TEXT,
    "action" "audit_action" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "request_id" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "r2_bucket" TEXT NOT NULL,
    "r2_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" BIGINT,
    "checksum" TEXT,
    "uploaded_by" TEXT,
    "purpose" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "feature_flags_tenant_id_idx" ON "feature_flags"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_tenant_id_key" ON "feature_flags"("key", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_is_active_idx" ON "tenants"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "business_settings_tenant_id_key" ON "business_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_status_idx" ON "subscriptions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_current_period_end_idx" ON "subscriptions"("current_period_end");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_tenant_memberships_user_id_idx" ON "user_tenant_memberships"("user_id");

-- CreateIndex
CREATE INDEX "user_tenant_memberships_tenant_id_is_active_idx" ON "user_tenant_memberships"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_tenant_memberships_tenant_id_user_id_key" ON "user_tenant_memberships"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_name_key" ON "roles"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_name_idx" ON "customers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "customers_tenant_id_deleted_at_idx" ON "customers"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_name_idx" ON "suppliers"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "product_categories_tenant_id_idx" ON "product_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_tenant_id_parent_id_name_key" ON "product_categories"("tenant_id", "parent_id", "name");

-- CreateIndex
CREATE INDEX "products_tenant_id_category_id_idx" ON "products"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_metal_type_idx" ON "products"("tenant_id", "metal_type");

-- CreateIndex
CREATE INDEX "products_tenant_id_is_active_deleted_at_idx" ON "products"("tenant_id", "is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_sku_key" ON "products"("tenant_id", "sku");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_product_id_idx" ON "inventory_items"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_status_idx" ON "inventory_items"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_location_idx" ON "inventory_items"("tenant_id", "location");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_deleted_at_idx" ON "inventory_items"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_tenant_id_tag_number_key" ON "inventory_items"("tenant_id", "tag_number");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_inventory_item_id_occurred_at_idx" ON "stock_movements"("tenant_id", "inventory_item_id", "occurred_at");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_type_occurred_at_idx" ON "stock_movements"("tenant_id", "type", "occurred_at");

-- CreateIndex
CREATE INDEX "stock_movements_reference_type_reference_id_idx" ON "stock_movements"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "stock_adjustments_tenant_id_created_at_idx" ON "stock_adjustments"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_transfers_tenant_id_status_idx" ON "stock_transfers"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "metal_rates_tenant_id_metal_type_rate_date_idx" ON "metal_rates"("tenant_id", "metal_type", "rate_date");

-- CreateIndex
CREATE UNIQUE INDEX "metal_rates_tenant_id_metal_type_purity_fineness_rate_date_key" ON "metal_rates"("tenant_id", "metal_type", "purity_fineness", "rate_date");

-- CreateIndex
CREATE UNIQUE INDEX "hsn_codes_code_key" ON "hsn_codes"("code");

-- CreateIndex
CREATE INDEX "tax_rates_tenant_id_hsn_code_id_effective_from_idx" ON "tax_rates"("tenant_id", "hsn_code_id", "effective_from");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_invoice_date_idx" ON "invoices"("tenant_id", "invoice_date");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_type_status_idx" ON "invoices"("tenant_id", "type", "status");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_customer_id_idx" ON "invoices"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_due_date_idx" ON "invoices"("tenant_id", "status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_line_items_tenant_id_invoice_id_idx" ON "invoice_line_items"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "invoice_line_items_tenant_id_product_id_idx" ON "invoice_line_items"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_invoice_id_idx" ON "payments"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_paid_at_idx" ON "payments"("tenant_id", "paid_at");

-- CreateIndex
CREATE INDEX "payments_tenant_id_method_idx" ON "payments"("tenant_id", "method");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_templates_tenant_id_name_key" ON "invoice_templates"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_status_idx" ON "notifications"("tenant_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_created_at_idx" ON "notifications"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_occurred_at_idx" ON "audit_logs"("tenant_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_entity_id_idx" ON "audit_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_occurred_at_idx" ON "audit_logs"("actor_user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "file_assets_tenant_id_purpose_idx" ON "file_assets"("tenant_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_r2_bucket_r2_key_key" ON "file_assets"("r2_bucket", "r2_key");

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_logo_asset_id_fkey" FOREIGN KEY ("logo_asset_id") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_default_template_id_fkey" FOREIGN KEY ("default_template_id") REFERENCES "invoice_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenant_memberships" ADD CONSTRAINT "user_tenant_memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenant_memberships" ADD CONSTRAINT "user_tenant_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "user_tenant_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_hsn_code_id_fkey" FOREIGN KEY ("hsn_code_id") REFERENCES "hsn_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "stock_adjustments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "stock_transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_dispatched_by_fkey" FOREIGN KEY ("dispatched_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_rates" ADD CONSTRAINT "metal_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_hsn_code_id_fkey" FOREIGN KEY ("hsn_code_id") REFERENCES "hsn_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "invoice_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_related_invoice_id_fkey" FOREIGN KEY ("related_invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_hsn_code_id_fkey" FOREIGN KEY ("hsn_code_id") REFERENCES "hsn_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_metal_rate_id_fkey" FOREIGN KEY ("metal_rate_id") REFERENCES "metal_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_tax_rate_id_fkey" FOREIGN KEY ("tax_rate_id") REFERENCES "tax_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ===========================================================================
-- Hand-edited additions (doc 03 §9.3, §10, §11) — not expressible in Prisma DSL
-- ===========================================================================

-- Extensions -----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Check constraints (§9.3) ---------------------------------------------------
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_gross_weight_check"  CHECK ("gross_weight"  >= 0),
  ADD CONSTRAINT "inventory_items_net_weight_check"    CHECK ("net_weight"    >= 0),
  ADD CONSTRAINT "inventory_items_stone_weight_check"  CHECK ("stone_weight"  >= 0),
  ADD CONSTRAINT "inventory_items_net_le_gross_check"  CHECK ("net_weight"    <= "gross_weight"),
  ADD CONSTRAINT "inventory_items_quantity_check"      CHECK ("quantity"      >= 0),
  ADD CONSTRAINT "inventory_items_karat_check"         CHECK ("karat" IS NULL OR ("karat" BETWEEN 1 AND 24));

ALTER TABLE "invoice_line_items"
  ADD CONSTRAINT "invoice_line_items_gross_weight_check" CHECK ("gross_weight" >= 0),
  ADD CONSTRAINT "invoice_line_items_net_weight_check"   CHECK ("net_weight"   >= 0),
  ADD CONSTRAINT "invoice_line_items_net_le_gross_check" CHECK ("net_weight"   <= "gross_weight"),
  ADD CONSTRAINT "invoice_line_items_quantity_check"     CHECK ("quantity"     > 0),
  ADD CONSTRAINT "invoice_line_items_line_total_check"   CHECK ("line_total"   >= 0),
  ADD CONSTRAINT "invoice_line_items_karat_check"        CHECK ("karat" IS NULL OR ("karat" BETWEEN 1 AND 24));

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_grand_total_check" CHECK ("grand_total" >= 0),
  ADD CONSTRAINT "invoices_amount_paid_check" CHECK ("amount_paid" >= 0),
  ADD CONSTRAINT "invoices_subtotal_check"    CHECK ("subtotal"    >= 0),
  ADD CONSTRAINT "invoices_balance_due_check" CHECK ("balance_due" >= 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_check" CHECK ("amount" > 0);

ALTER TABLE "metal_rates"
  ADD CONSTRAINT "metal_rates_rate_per_gram_check" CHECK ("rate_per_gram" > 0);

ALTER TABLE "tax_rates"
  ADD CONSTRAINT "tax_rates_rate_percent_check" CHECK ("rate_percent" >= 0);

ALTER TABLE "products"
  ADD CONSTRAINT "products_default_purity_check" CHECK ("default_purity_fineness" IS NULL OR "default_purity_fineness" > 0),
  ADD CONSTRAINT "products_default_karat_check"  CHECK ("default_karat" IS NULL OR ("default_karat" BETWEEN 1 AND 24));

-- Partial unique indexes with soft-delete (§9.2 + §11) -----------------------
-- Replace full uniques on soft-deletable natural keys so a key can be reused
-- after the old row is soft-deleted.
DROP INDEX "products_tenant_id_sku_key";
CREATE UNIQUE INDEX "products_tenant_id_sku_key"
  ON "products" ("tenant_id", "sku")
  WHERE "deleted_at" IS NULL;

DROP INDEX "inventory_items_tenant_id_tag_number_key";
CREATE UNIQUE INDEX "inventory_items_tenant_id_tag_number_key"
  ON "inventory_items" ("tenant_id", "tag_number")
  WHERE "tag_number" IS NOT NULL AND "deleted_at" IS NULL;

-- Partial uniques Prisma cannot express (kept out of the Prisma schema) -------
CREATE UNIQUE INDEX "customers_tenant_id_phone_key"
  ON "customers" ("tenant_id", "phone")
  WHERE "phone" IS NOT NULL AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "tenants_gstin_key"
  ON "tenants" ("gstin")
  WHERE "gstin" IS NOT NULL AND "deleted_at" IS NULL;

-- At most one live subscription per tenant (§7.3)
CREATE UNIQUE INDEX "subscriptions_tenant_live_key"
  ON "subscriptions" ("tenant_id")
  WHERE "status" IN ('trialing', 'active', 'past_due');

-- Trigram GIN indexes for ILIKE search (§10.2) ------------------------------
CREATE INDEX "customers_name_trgm_idx" ON "customers" USING gin ("name" gin_trgm_ops);
CREATE INDEX "suppliers_name_trgm_idx" ON "suppliers" USING gin ("name" gin_trgm_ops);
CREATE INDEX "products_name_trgm_idx"  ON "products"  USING gin ("name" gin_trgm_ops);
