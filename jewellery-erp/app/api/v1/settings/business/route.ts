import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const BusinessSettingUpdateSchema = z.object({
  // Tenant profile fields
  name: z.string().min(1).optional(),
  gstin: z.string().length(15).regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").optional().nullable(),
  pan: z.string().length(10).regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().min(10).optional().nullable(),
  addressJson: z.unknown().optional().nullable(),
  logoAssetId: z.string().optional().nullable(),

  // BusinessSetting fields
  baseCurrency: z.string().length(3).optional(),
  defaultGstRate: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  gstRegistered: z.boolean().optional(),
  makingChargeMode: z.string().optional(),
  defaultMakingCharge: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  invoicePrefix: z.string().min(1).optional(),
  invoiceNextSeq: z.number().or(z.string()).transform(v => BigInt(v)).optional(),
  financialYearStartMonth: z.number().int().min(1).max(12).optional(),
  defaultTemplateId: z.string().nullable().optional(),
});

export interface UnifiedBusinessSettings {
  name: string;
  gstin: string | null;
  pan: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressJson: unknown;
  logoAssetId: string | null;
  baseCurrency: string;
  defaultGstRate: string;
  gstRegistered: boolean;
  makingChargeMode: string;
  defaultMakingCharge: string;
  invoicePrefix: string;
  invoiceNextSeq: string;
  financialYearStartMonth: number;
  defaultTemplateId: string | null;
}

const getShortTemplateKey = (id: string | null): string => {
  if (!id) return "classic";
  const parts = id.split("_");
  return parts[parts.length - 1] || "classic";
};

const getFullTemplateId = (shortId: string | null | undefined, tenantId: string): string | null => {
  if (!shortId) return null;
  return `${tenantId}_${shortId}`;
};

async function ensureInvoiceTemplatesExist(tenantId: string): Promise<void> {
  const templates = [
    { id: "classic", name: "Classic Traditional" },
    { id: "modern", name: "Modern Slate" },
    { id: "minimal", name: "Minimalist Elegant" },
    { id: "compact", name: "Compact Ticket" },
    { id: "elegant", name: "Elegant Navy & Gold" },
  ];

  for (const t of templates) {
    const fullId = `${tenantId}_${t.id}`;
    await prisma.invoiceTemplate.upsert({
      where: { tenantId_name: { tenantId, name: t.name } },
      create: {
        id: fullId,
        tenantId,
        name: t.name,
        isDefault: t.id === "classic",
      },
      update: {},
    });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await authorize("settings:read");
    
    return await runWithTenant(session, async () => {
      // Ensure default templates exist for the tenant
      await ensureInvoiceTemplatesExist(session.tenantId);

      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        include: { settings: true },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      // If no settings exist yet, create them inline
      let settings = tenant.settings;
      if (!settings) {
        settings = await prisma.businessSetting.create({
          data: {
            tenantId: session.tenantId,
            baseCurrency: "INR",
            defaultGstRate: new Prisma.Decimal(3.0),
            gstRegistered: true,
            makingChargeMode: "per_gram",
            defaultMakingCharge: new Prisma.Decimal(0.0),
            invoicePrefix: "INV",
            invoiceNextSeq: BigInt(1),
            financialYearStartMonth: 4,
          },
        });
      }

      const responseData: UnifiedBusinessSettings = {
        name: tenant.name,
        gstin: tenant.gstin,
        pan: tenant.pan,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        addressJson: tenant.addressJson,
        logoAssetId: tenant.logoAssetId,
        baseCurrency: settings.baseCurrency,
        defaultGstRate: settings.defaultGstRate.toString(),
        gstRegistered: settings.gstRegistered,
        makingChargeMode: settings.makingChargeMode,
        defaultMakingCharge: settings.defaultMakingCharge.toString(),
        invoicePrefix: settings.invoicePrefix,
        invoiceNextSeq: settings.invoiceNextSeq.toString(),
        financialYearStartMonth: settings.financialYearStartMonth,
        defaultTemplateId: getShortTemplateKey(settings.defaultTemplateId),
      };

      return NextResponse.json({ data: responseData });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/settings/business error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("settings:write");
    const jsonBody = await request.json();
    const updateInput = BusinessSettingUpdateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      // Ensure templates exist before reference is set
      await ensureInvoiceTemplatesExist(session.tenantId);

      const result = await prisma.$transaction(async (tx) => {
        const updatedTenant = await tx.tenant.update({
          where: { id: session.tenantId },
          data: {
            name: updateInput.name,
            gstin: updateInput.gstin !== undefined ? updateInput.gstin : undefined,
            pan: updateInput.pan !== undefined ? updateInput.pan : undefined,
            contactEmail: updateInput.contactEmail !== undefined ? updateInput.contactEmail : undefined,
            contactPhone: updateInput.contactPhone !== undefined ? updateInput.contactPhone : undefined,
            addressJson: updateInput.addressJson !== undefined ? (updateInput.addressJson as Prisma.InputJsonValue) : undefined,
            logoAssetId: updateInput.logoAssetId !== undefined ? updateInput.logoAssetId : undefined,
          },
        });

        // Ensure settings row exists
        await tx.businessSetting.upsert({
          where: { tenantId: session.tenantId },
          create: {
            tenantId: session.tenantId,
            baseCurrency: updateInput.baseCurrency ?? "INR",
            defaultGstRate: updateInput.defaultGstRate ?? new Prisma.Decimal(3.0),
            gstRegistered: updateInput.gstRegistered ?? true,
            makingChargeMode: updateInput.makingChargeMode ?? "per_gram",
            defaultMakingCharge: updateInput.defaultMakingCharge ?? new Prisma.Decimal(0.0),
            invoicePrefix: updateInput.invoicePrefix ?? "INV",
            invoiceNextSeq: updateInput.invoiceNextSeq ?? BigInt(1),
            financialYearStartMonth: updateInput.financialYearStartMonth ?? 4,
            defaultTemplateId: getFullTemplateId(updateInput.defaultTemplateId, session.tenantId),
          },
          update: {
            baseCurrency: updateInput.baseCurrency,
            defaultGstRate: updateInput.defaultGstRate,
            gstRegistered: updateInput.gstRegistered,
            makingChargeMode: updateInput.makingChargeMode,
            defaultMakingCharge: updateInput.defaultMakingCharge,
            invoicePrefix: updateInput.invoicePrefix,
            invoiceNextSeq: updateInput.invoiceNextSeq,
            financialYearStartMonth: updateInput.financialYearStartMonth,
            defaultTemplateId: getFullTemplateId(updateInput.defaultTemplateId, session.tenantId),
          },
        });

        const finalSettings = await tx.businessSetting.findUniqueOrThrow({
          where: { tenantId: session.tenantId },
        });

        return { tenant: updatedTenant, settings: finalSettings };
      });

      const responseData: UnifiedBusinessSettings = {
        name: result.tenant.name,
        gstin: result.tenant.gstin,
        pan: result.tenant.pan,
        contactEmail: result.tenant.contactEmail,
        contactPhone: result.tenant.contactPhone,
        addressJson: result.tenant.addressJson,
        logoAssetId: result.tenant.logoAssetId,
        baseCurrency: result.settings.baseCurrency,
        defaultGstRate: result.settings.defaultGstRate.toString(),
        gstRegistered: result.settings.gstRegistered,
        makingChargeMode: result.settings.makingChargeMode,
        defaultMakingCharge: result.settings.defaultMakingCharge.toString(),
        invoicePrefix: result.settings.invoicePrefix,
        invoiceNextSeq: result.settings.invoiceNextSeq.toString(),
        financialYearStartMonth: result.settings.financialYearStartMonth,
        defaultTemplateId: getShortTemplateKey(result.settings.defaultTemplateId),
      };

      return NextResponse.json({ data: responseData });
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/settings/business error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
