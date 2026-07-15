import React from "react";
import { pdf, DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { isR2Configured, uploadFile } from "@/lib/storage/r2";
import { InvoicePdfDocument } from "./invoice-pdf";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";
import { FileAsset, Tenant } from "@prisma/client";
import { Readable } from "stream";

interface CustomerDetails {
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  addressJson: unknown;
}

interface AddressDetails {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

function getTenantAddressString(addressJson: unknown): string | null {
  if (!addressJson) return null;
  if (typeof addressJson === "string") return addressJson;
  try {
    const addr = addressJson as AddressDetails;
    return [addr.street, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array);
  }
  return Buffer.concat(chunks);
}

/**
 * Render React-PDF document to a Node Buffer.
 */
export async function renderInvoicePdfToBuffer(
  invoice: SerializedInvoice,
  customer: CustomerDetails | null,
  tenant: Tenant,
  templateId?: string | null
): Promise<Buffer> {
  const element = React.createElement(InvoicePdfDocument, {
    invoice,
    customer,
    tenantName: tenant.name,
    tenantGstin: tenant.gstin,
    tenantAddress: getTenantAddressString(tenant.addressJson),
    tenantPhone: tenant.contactPhone || null,
    templateId,
  });

  const docElement = element as unknown as React.ReactElement<DocumentProps>;
  const stream = await pdf(docElement).toBuffer();
  return await streamToBuffer(stream as unknown as Readable);
}

/**
 * Renders the PDF and uploads it to Cloudflare R2 if configured, storing the record in FileAsset.
 * If R2 is not configured, it runs without uploading and returns null.
 */
export async function generateAndStoreInvoicePdf(
  invoiceId: string,
  tenantId: string
): Promise<FileAsset | null> {
  // Fetch invoice details
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: true,
      customer: true,
      payments: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  // Fetch tenant info
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });

  if (!tenant) {
    throw new Error("Tenant not found.");
  }

  // Import serialization helper to pass formatted values to the PDF template
  const { serializeInvoice } = await import("@/app/api/v1/invoices/route");
  const serialized = serializeInvoice(invoice);

  const customerDetail = invoice.customer
    ? {
        name: invoice.customer.name,
        phone: invoice.customer.phone,
        email: invoice.customer.email,
        gstin: invoice.customer.gstin,
        addressJson: invoice.customer.addressJson,
      }
    : null;

  // Render to Buffer
  const templateId = invoice.templateId || tenant.settings?.defaultTemplateId;
  const buffer = await renderInvoicePdfToBuffer(serialized, customerDetail, tenant, templateId);

  // If R2 is not configured, degrade gracefully (D4)
  if (!isR2Configured()) {
    console.warn("Cloudflare R2 is not configured. PDF generated but not uploaded.");
    return null;
  }

  const key = `${tenantId}/invoices/${invoiceId}.pdf`;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET || "jewellery-erp-assets";

  // Upload to Cloudflare R2
  await uploadFile(key, buffer, "application/pdf");

  // Save FileAsset record
  const asset = await prisma.fileAsset.create({
    data: {
      tenantId,
      purpose: "invoice_pdf",
      r2Bucket: bucketName,
      r2Key: key,
      contentType: "application/pdf",
      sizeBytes: BigInt(buffer.length),
      uploadedBy: invoice.issuedBy || null,
    },
  });

  return asset;
}
