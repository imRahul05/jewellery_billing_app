import { pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { isR2Configured, uploadFile } from "@/lib/storage/r2";
import { InvoicePdfDocument } from "./invoice-pdf";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";
import { FileAsset, Prisma, Tenant } from "@prisma/client";
import { formatAddress } from "@/lib/api/business.api";

interface CustomerDetails {
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  addressJson: Prisma.JsonValue | string | null;
}

function getTenantAddressString(addressJson: Prisma.JsonValue | string | null): string | null {
  return formatAddress(addressJson);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else if (chunk instanceof Uint8Array) {
      chunks.push(chunk);
    } else {
      chunks.push(Buffer.from(chunk));
    }
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
  const docElement = InvoicePdfDocument({
    invoice,
    customer,
    tenantName: tenant.name,
    tenantGstin: tenant.gstin,
    tenantAddress: getTenantAddressString(tenant.addressJson),
    tenantPhone: tenant.contactPhone || null,
    templateId,
  });

  const stream = await pdf(docElement).toBuffer();
  return await streamToBuffer(stream);
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
