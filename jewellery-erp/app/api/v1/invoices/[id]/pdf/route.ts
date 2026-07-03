import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { isR2Configured, getSignedUrl } from "@/lib/storage/r2";
import { renderInvoicePdfToBuffer, generateAndStoreInvoicePdf } from "@/lib/billing/pdf/renderer";
import { serializeInvoice } from "../../route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse | Response> {
  try {
    const session = await authorize("invoice:read");
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceStream = searchParams.get("stream") === "true";

    return await runWithTenant(session, async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          lineItems: true,
          customer: true,
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
      }

      // If R2 is configured and we do not force streaming, generate/return signed URL
      if (isR2Configured() && !forceStream) {
        const asset = await prisma.fileAsset.findFirst({
          where: {
            tenantId: session.tenantId,
            purpose: "invoice_pdf",
            r2Key: `${session.tenantId}/invoices/${id}.pdf`,
          },
        });
        let r2Key = asset?.r2Key;

        // If not already rendered & uploaded to R2, do it now
        if (!r2Key) {
          const asset = await generateAndStoreInvoicePdf(id, session.tenantId);
          if (asset) {
            r2Key = asset.r2Key;
          }
        }

        if (r2Key) {
          const signedUrl = await getSignedUrl(r2Key, 3600); // 1-hour expiry
          return NextResponse.json({ data: { url: signedUrl } });
        }
      }

      // Fallback/Graceful Degradation (D4): Stream PDF binary directly in HTTP response
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found." }, { status: 400 });
      }

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

      const pdfBuffer = await renderInvoicePdfToBuffer(serialized, customerDetail, tenant);

      const safeFilename = `${invoice.invoiceNumber.replace(/\//g, "_")}.pdf`;

      return new Response(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${safeFilename}"`,
        },
      });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/invoices/[id]/pdf error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
