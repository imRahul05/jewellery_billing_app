import { prisma } from "@/lib/db";
import { TEMPLATES } from "@/constants/templates";

const LEGACY_TEMPLATE_MAP: Record<string, string> = {
  classic: "gold-classic-jewellers",
  modern: "gold-modern-boutique",
  minimal: "gold-minimal-karat",
  compact: "gold-compact-counter",
  elegant: "gold-royal-zari",
};

/**
 * Extracts the canonical template identifier, stripping any tenant prefix
 * and converting legacy template names to their gold equivalents.
 */
export function getCleanTemplateId(templateId?: string | null): string {
  if (!templateId) return "gold-classic-jewellers";
  const firstUnderscoreIndex = templateId.indexOf("_");
  let candidate = templateId;
  if (firstUnderscoreIndex !== -1) {
    candidate = templateId.substring(firstUnderscoreIndex + 1);
  }
  return LEGACY_TEMPLATE_MAP[candidate] || candidate;
}

/**
 * Returns the tenant-scoped template identifier used as primary key in invoice_templates.
 */
export function getFullTemplateId(shortId: string | null | undefined, tenantId: string): string | null {
  if (!shortId) return null;
  const clean = getCleanTemplateId(shortId);
  return `${tenantId}_${clean}`;
}

/**
 * Ensures all standard gold templates exist in the database for the given tenant.
 */
export async function ensureInvoiceTemplatesExist(tenantId: string): Promise<void> {
  const existingCount = await prisma.invoiceTemplate.count({
    where: { tenantId },
  });
  if (existingCount >= TEMPLATES.length) {
    return;
  }

  const legacyTemplates = [
    { id: "classic", name: "Classic Traditional" },
    { id: "modern", name: "Modern Slate" },
    { id: "minimal", name: "Minimalist Elegant" },
    { id: "compact", name: "Compact Ticket" },
    { id: "elegant", name: "Elegant Navy & Gold" },
  ];

  const allTemplates = [
    ...legacyTemplates,
    ...TEMPLATES.map((t) => ({ id: t.id, name: t.name })),
  ];

  await prisma.invoiceTemplate.createMany({
    data: allTemplates.map((t) => ({
      id: `${tenantId}_${t.id}`,
      tenantId,
      name: t.name,
      isDefault: t.id === "gold-classic-jewellers",
    })),
    skipDuplicates: true,
  });
}

/**
 * Resolves a raw or short template ID to an existing foreign-key reference in invoice_templates.
 */
export async function resolveTemplateIdForTenant(
  rawTemplateId: string | null | undefined,
  tenantId: string
): Promise<string | null> {
  if (!rawTemplateId) return null;

  const fullId = getFullTemplateId(rawTemplateId, tenantId);
  if (!fullId) return null;

  const existing = await prisma.invoiceTemplate.findUnique({
    where: { id: fullId },
  });
  if (existing) return existing.id;

  // Auto-seed if missing
  await ensureInvoiceTemplatesExist(tenantId);
  const found = await prisma.invoiceTemplate.findUnique({
    where: { id: fullId },
  });
  return found?.id || null;
}
