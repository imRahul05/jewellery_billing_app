import { SerializedInvoice } from "@/app/api/v1/invoices/route";

interface SendInvoiceEmailInput {
  recipientEmail: string;
  invoice: SerializedInvoice;
  pdfBuffer: Buffer;
  businessName: string;
}

interface ResendAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments: ResendAttachment[];
}

interface ResendErrorResponse {
  message: string;
  name?: string;
  statusCode?: number;
}

/**
 * Dispatches an email with the invoice PDF attached using the Resend API.
 * Uses process.env.RESEND_API_KEY for authorization.
 */
export async function sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("sendInvoiceEmail: RESEND_API_KEY is not configured in environment variables.");
    return { success: false, error: "Resend API key is missing." };
  }

  const { recipientEmail, invoice, pdfBuffer, businessName } = input;
  const safeFilename = `${invoice.invoiceNumber.replace(/\//g, "_")}.pdf`;

  // Construct a clean, modern HTML email body
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice Finalized</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
          }
          .content {
            padding: 32px;
          }
          .details-card {
            background-color: #f1f5f9;
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .label {
            color: #64748b;
            font-weight: 500;
          }
          .value {
            color: #0f172a;
            font-weight: 600;
            text-align: right;
          }
          .footer {
            text-align: center;
            padding: 24px;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Invoice Finalized</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>An invoice has been finalized and issued for a sale at <strong>${businessName}</strong>. Please find the details below and the PDF copy attached to this email.</p>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="label">Invoice Number</span>
                <span class="value">${invoice.invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date</span>
                <span class="value">${new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}</span>
              </div>
              <div class="detail-row">
                <span class="label">Grand Total</span>
                <span class="value">₹${parseFloat(invoice.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Paid</span>
                <span class="value">₹${parseFloat(invoice.amountPaid).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="detail-row">
                <span class="label">Balance Due</span>
                <span class="value">₹${parseFloat(invoice.balanceDue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <p>This copy is sent automatically to your configured business contact email for audit and bookkeeping purposes.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from your Jewellery ERP system.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const payload: ResendEmailPayload = {
    from: "Jewellery ERP <noreply@imrahul.me>",
    to: [recipientEmail],
    subject: `Invoice ${invoice.invoiceNumber} Finalized - ${businessName}`,
    html: htmlContent,
    attachments: [
      {
        filename: safeFilename,
        content: pdfBuffer.toString("base64"),
        contentType: "application/pdf",
      },
    ],
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorJson = (await response.json()) as ResendErrorResponse;
      console.error("Resend API error response:", errorJson);
      return { success: false, error: errorJson.message || "Failed to send email via Resend API" };
    }

    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown connection error";
    console.error("sendInvoiceEmail: connection error:", err);
    return { success: false, error: errMsg };
  }
}
