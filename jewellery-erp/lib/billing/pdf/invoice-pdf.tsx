import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";
import { toIndianWords } from "../indian-words";

interface AddressDetails {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface InvoicePdfProps {
  invoice: SerializedInvoice;
  customer?: {
    name: string;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    addressJson: unknown;
  } | null;
  tenantName: string;
  tenantGstin: string | null;
  tenantAddress: string | null;
  tenantPhone: string | null;
  templateId?: string | null;
}

function formatAddress(json: unknown): string {
  if (!json) return "N/A";
  if (typeof json === "string") return json;
  try {
    const addr = json as AddressDetails;
    const parts = [addr.street, addr.city, addr.state, addr.postalCode];
    return parts.filter(Boolean).join(", ");
  } catch {
    return "N/A";
  }
}

// ---------------------------------------------------------------------------
// Shared layout styles to align TypeScript shapes
// ---------------------------------------------------------------------------
const colStyles = {
  colDesc: { width: "20%" },
  colDescWide: { width: "30%" },
  colKarat: { width: "8%", textAlign: "center" as const },
  colWeight: { width: "14%", textAlign: "right" as const },
  colRate: { width: "10%", textAlign: "right" as const },
  colMaking: { width: "10%", textAlign: "right" as const },
  colStone: { width: "10%", textAlign: "right" as const },
  colDiscount: { width: "10%", textAlign: "right" as const },
  colTaxable: { width: "10%", textAlign: "right" as const },
  colGst: { width: "8%", textAlign: "right" as const },
};

const stylePlaceholders = {
  headerBanner: {},
  invoiceNo: {},
  tableRowAlternate: {},
  sectionHeader: {},
  doubleBorder: {},
};

// ---------------------------------------------------------------------------
// 1. Classic Layout Styles
// ---------------------------------------------------------------------------
const stylesClassic = StyleSheet.create({
  ...colStyles,
  ...stylePlaceholders,
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 9, color: "#333", lineHeight: 1.4 },
  titleContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, textTransform: "uppercase" },
  metaContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 15 },
  shopSection: { width: "48%" },
  invoiceSection: { width: "48%", textAlign: "right" },
  boldText: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 3 },
  regularText: { color: "#555", marginBottom: 2 },
  billingContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25, backgroundColor: "#fafafa", padding: 10, borderRadius: 4 },
  billingSection: { width: "48%" },
  table: { width: "100%", marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e293b", color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8, padding: 5, borderRadius: 2 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", padding: 5, alignItems: "center" },
  summaryContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  wordsSection: { width: "55%", fontSize: 8, color: "#555" },
  totalsSection: { width: "40%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, marginTop: 5, borderTopWidth: 1.5, borderTopColor: "#1e293b", borderBottomWidth: 1.5, borderBottomColor: "#1e293b", fontFamily: "Helvetica-Bold", fontSize: 11 },
  footer: { marginTop: 50, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 15, textAlign: "center", color: "#888", fontSize: 8 },
});

// ---------------------------------------------------------------------------
// 2. Modern Layout Styles
// ---------------------------------------------------------------------------
const stylesModern = StyleSheet.create({
  ...colStyles,
  ...stylePlaceholders,
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 9, color: "#1e293b", lineHeight: 1.4 },
  headerBanner: { height: 6, backgroundColor: "#4f46e5", marginBottom: 20 },
  titleContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#4f46e5" },
  invoiceNo: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#64748b" },
  metaContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 15 },
  shopSection: { width: "48%" },
  invoiceSection: { width: "48%", textAlign: "right" },
  boldText: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#1e293b", marginBottom: 3 },
  regularText: { color: "#475569", marginBottom: 2 },
  billingContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  billingSection: { width: "48%", padding: 10, borderLeftWidth: 3, borderLeftColor: "#4f46e5", backgroundColor: "#f8fafc" },
  table: { width: "100%", marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: "#4f46e5", color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8, padding: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", padding: 6, alignItems: "center" },
  tableRowAlternate: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", padding: 6, alignItems: "center", backgroundColor: "#f8fafc" },
  summaryContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  wordsSection: { width: "50%", fontSize: 8, color: "#475569" },
  totalsSection: { width: "45%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 6, borderTopWidth: 2, borderTopColor: "#4f46e5", fontFamily: "Helvetica-Bold", fontSize: 12, color: "#4f46e5" },
  footer: { marginTop: 40, borderTopWidth: 1, borderTopColor: "#cbd5e1", paddingTop: 10, textAlign: "center", color: "#94a3b8", fontSize: 8 },
});

// ---------------------------------------------------------------------------
// 3. Minimalist Layout Styles
// ---------------------------------------------------------------------------
const stylesMinimal = StyleSheet.create({
  ...colStyles,
  ...stylePlaceholders,
  page: { padding: 45, fontFamily: "Helvetica", fontSize: 8.5, color: "#444", lineHeight: 1.5 },
  titleContainer: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 10 },
  title: { fontSize: 15, letterSpacing: 2, color: "#000", textTransform: "uppercase" },
  metaContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  shopSection: { width: "50%" },
  invoiceSection: { width: "50%", textAlign: "right" },
  boldText: { fontSize: 9, color: "#111", marginBottom: 3 },
  regularText: { color: "#666", marginBottom: 2 },
  billingContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  billingSection: { width: "48%" },
  table: { width: "100%", marginBottom: 20 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: "#111", fontSize: 8, paddingBottom: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 6, alignItems: "center" },
  summaryContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  wordsSection: { width: "55%", fontSize: 8, color: "#777" },
  totalsSection: { width: "40%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, marginTop: 5, borderTopWidth: 1.5, borderTopColor: "#111", fontSize: 10 },
  footer: { marginTop: 60, textAlign: "center", color: "#aaa", fontSize: 7.5 },
});

// ---------------------------------------------------------------------------
// 4. Compact Layout Styles
// ---------------------------------------------------------------------------
const stylesCompact = StyleSheet.create({
  ...colStyles,
  ...stylePlaceholders,
  page: { padding: 25, fontFamily: "Helvetica", fontSize: 8, color: "#333", lineHeight: 1.3 },
  titleContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  metaContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 8 },
  shopSection: { width: "50%" },
  invoiceSection: { width: "50%", textAlign: "right" },
  boldText: { fontFamily: "Helvetica-Bold", fontSize: 8.5, marginBottom: 2 },
  regularText: { color: "#555", marginBottom: 1 },
  billingContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, backgroundColor: "#f9f9f9", padding: 6, borderRadius: 2 },
  billingSection: { width: "48%" },
  table: { width: "100%", marginBottom: 10 },
  tableHeader: { flexDirection: "row", backgroundColor: "#334155", color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 7.5, padding: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", padding: 4, alignItems: "center" },
  summaryContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  wordsSection: { width: "50%", fontSize: 7.5, color: "#666" },
  totalsSection: { width: "48%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, marginTop: 4, borderTopWidth: 1, borderTopColor: "#333", borderBottomWidth: 1, borderBottomColor: "#333", fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  footer: { marginTop: 25, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 8, textAlign: "center", color: "#999", fontSize: 7.5 },
});

// ---------------------------------------------------------------------------
// 5. Elegant Layout Styles
// ---------------------------------------------------------------------------
const stylesElegant = StyleSheet.create({
  ...colStyles,
  ...stylePlaceholders,
  page: { padding: 40, fontFamily: "Times-Roman", fontSize: 9.5, color: "#2d3748", lineHeight: 1.4 },
  titleContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 25, borderBottomWidth: 2, borderBottomColor: "#b45309", paddingBottom: 8 },
  title: { fontSize: 18, fontFamily: "Times-Bold", color: "#1e3a8a", letterSpacing: 2, textTransform: "uppercase" },
  metaContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingBottom: 15 },
  shopSection: { width: "48%" },
  invoiceSection: { width: "48%", textAlign: "right" },
  boldText: { fontFamily: "Times-Bold", fontSize: 11, color: "#1e3a8a", marginBottom: 3 },
  regularText: { color: "#4a5568", marginBottom: 2 },
  billingContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25, borderLeftWidth: 4, borderLeftColor: "#b45309", backgroundColor: "#fffbeb", padding: 10 },
  billingSection: { width: "48%" },
  table: { width: "100%", marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e3a8a", color: "#fff", fontFamily: "Times-Bold", fontSize: 8.5, padding: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: 6, alignItems: "center" },
  summaryContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  wordsSection: { width: "55%", fontSize: 8.5, color: "#4a5568" },
  totalsSection: { width: "40%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#edf2f7" },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, marginTop: 6, borderTopWidth: 2, borderTopColor: "#1e3a8a", borderBottomWidth: 2, borderBottomColor: "#1e3a8a", fontFamily: "Times-Bold", fontSize: 12, color: "#1e3a8a" },
  footer: { marginTop: 45, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12, textAlign: "center", color: "#718096", fontSize: 8.5 },
});

export const InvoicePdfDocument: React.FC<InvoicePdfProps> = ({
  invoice,
  customer,
  tenantName,
  tenantGstin,
  tenantAddress,
  tenantPhone,
  templateId,
}) => {
  const isPurchase = invoice.type === "purchase";
  const placeOfSupplyText = invoice.placeOfSupply ? `GST State Code: ${invoice.placeOfSupply}` : "N/A";
  
  // Extract style key (e.g. from tenantId_modern)
  const templateStyle = templateId ? templateId.split("_").pop() : "classic";

  let activeStyles: Parameters<typeof StyleSheet.create>[0] = stylesClassic;
  let isModern = false;
  let isElegant = false;
  let isMinimal = false;
  
  if (templateStyle === "modern") {
    activeStyles = stylesModern;
    isModern = true;
  } else if (templateStyle === "minimal") {
    activeStyles = stylesMinimal;
    isMinimal = true;
  } else if (templateStyle === "compact") {
    activeStyles = stylesCompact;
  } else if (templateStyle === "elegant") {
    activeStyles = stylesElegant;
    isElegant = true;
  }

  const boldFont = isElegant ? "Times-Bold" : "Helvetica-Bold";

  return (
    <Document>
      <Page size="A4" style={activeStyles.page}>
        {/* Banner for Modern style */}
        {isModern && <View style={stylesModern.headerBanner} />}

        {/* Title */}
        <View style={activeStyles.titleContainer}>
          <Text style={activeStyles.title}>
            {isPurchase ? "Purchase Voucher" : invoice.status === "draft" ? "Draft Estimate" : "Tax Invoice"}
          </Text>
          {isModern && <Text style={stylesModern.invoiceNo}>No: {invoice.invoiceNumber}</Text>}
        </View>

        {/* Header Metadata */}
        <View style={activeStyles.metaContainer}>
          <View style={activeStyles.shopSection}>
            <Text style={activeStyles.boldText}>{tenantName}</Text>
            <Text style={activeStyles.regularText}>{tenantAddress || "No address provided"}</Text>
            <Text style={activeStyles.regularText}>Phone: {tenantPhone || "N/A"}</Text>
            <Text style={activeStyles.boldText}>GSTIN: {tenantGstin || "N/A"}</Text>
          </View>
          <View style={activeStyles.invoiceSection}>
            {!isModern && <Text style={activeStyles.boldText}>Invoice No: {invoice.invoiceNumber}</Text>}
            <Text style={activeStyles.regularText}>Date: {invoice.invoiceDate}</Text>
            {invoice.dueDate && <Text style={activeStyles.regularText}>Due Date: {invoice.dueDate}</Text>}
            <Text style={activeStyles.regularText}>Place of Supply: {placeOfSupplyText}</Text>
            <Text style={activeStyles.regularText}>Type: {invoice.type.toUpperCase()}</Text>
          </View>
        </View>

        {/* Billing Info */}
        <View style={activeStyles.billingContainer}>
          <View style={activeStyles.billingSection}>
            <Text style={activeStyles.boldText}>{isPurchase ? "Supplier Details:" : "Bill To:"}</Text>
            {customer ? (
              <>
                <Text style={activeStyles.boldText}>{customer.name}</Text>
                <Text style={activeStyles.regularText}>Phone: {customer.phone || "N/A"}</Text>
                {customer.email && <Text style={activeStyles.regularText}>Email: {customer.email}</Text>}
                <Text style={activeStyles.regularText}>Address: {formatAddress(customer.addressJson)}</Text>
                {customer.gstin && <Text style={activeStyles.boldText}>GSTIN: {customer.gstin}</Text>}
              </>
            ) : (
              <Text style={activeStyles.regularText}>Walk-in Customer</Text>
            )}
          </View>
          <View style={activeStyles.billingSection}>
            <Text style={activeStyles.boldText}>Payment Status:</Text>
            <Text style={activeStyles.regularText}>Status: {invoice.status.toUpperCase()}</Text>
            <Text style={activeStyles.regularText}>Total Paid: INR {invoice.amountPaid}</Text>
            <Text style={activeStyles.boldText}>Balance Due: INR {invoice.balanceDue}</Text>
          </View>
        </View>

        {/* Table of Line Items */}
        {(() => {
          const hasDiscount = invoice.lineItems?.some((line) => parseFloat(line.discount) > 0) ?? false;
          const colDescStyle = !hasDiscount ? { ...activeStyles.colDescWide } : activeStyles.colDesc;

          const goldExchangePayments = invoice.payments?.filter((p) => p.method === "gold_exchange") || [];
          const hasGoldExchange = goldExchangePayments.length > 0;
          const grossInvoiceValue = parseFloat(invoice.subtotal) + parseFloat(invoice.cgstTotal) + parseFloat(invoice.sgstTotal) + parseFloat(invoice.igstTotal);

          return (
            <>
              <View style={activeStyles.table}>
                <View style={activeStyles.tableHeader}>
                  <Text style={colDescStyle}>Item Description</Text>
                  <Text style={activeStyles.colKarat}>Karat</Text>
                  <Text style={activeStyles.colWeight}>Weight (Grs)</Text>
                  <Text style={activeStyles.colRate}>Rate</Text>
                  <Text style={activeStyles.colMaking}>Making</Text>
                  <Text style={activeStyles.colStone}>Stone</Text>
                  {hasDiscount && <Text style={activeStyles.colDiscount}>Discount</Text>}
                  <Text style={activeStyles.colTaxable}>Taxable</Text>
                  <Text style={activeStyles.colGst}>GST</Text>
                </View>

                {invoice.lineItems?.map((line, index) => {
                  const cgst = parseFloat(line.cgstAmount);
                  const sgst = parseFloat(line.sgstAmount);
                  const igst = parseFloat(line.igstAmount);
                  const lineGst = igst > 0 ? `${igst.toFixed(2)}` : `${(cgst + sgst).toFixed(2)}`;
                  const lineDiscountVal = parseFloat(line.discount);

                  const isRowAlternate = isModern && index % 2 === 1;
                  const rowStyle = isRowAlternate ? stylesModern.tableRowAlternate : activeStyles.tableRow;

                  return (
                    <View style={rowStyle} key={line.id || index}>
                      <Text style={colDescStyle}>{line.description}</Text>
                      <Text style={activeStyles.colKarat}>
                        {line.karat ? `${line.karat}K` : line.purityFineness ? `${parseFloat(line.purityFineness)}` : "-"}
                      </Text>
                      <Text style={activeStyles.colWeight}>
                        G: {parseFloat(line.grossWeight).toFixed(3)}g{"\n"}N: {parseFloat(line.netWeight).toFixed(3)}g
                      </Text>
                      <Text style={activeStyles.colRate}>{parseFloat(line.ratePerGram).toFixed(2)}</Text>
                      <Text style={activeStyles.colMaking}>{parseFloat(line.makingCharge).toFixed(2)}</Text>
                      <Text style={activeStyles.colStone}>{parseFloat(line.stoneCharge).toFixed(2)}</Text>
                      {hasDiscount && (
                        <Text style={activeStyles.colDiscount}>
                          {lineDiscountVal > 0 ? `-${lineDiscountVal.toFixed(2)}` : "-"}
                        </Text>
                      )}
                      <Text style={activeStyles.colTaxable}>{parseFloat(line.taxableValue).toFixed(2)}</Text>
                      <Text style={activeStyles.colGst}>{lineGst}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Summary & Totals */}
              <View style={activeStyles.summaryContainer}>
                <View style={activeStyles.wordsSection}>
                  <Text style={activeStyles.boldText}>Amount in Words:</Text>
                  <Text style={{ fontFamily: isElegant ? "Times-Italic" : "Helvetica-Oblique", fontSize: isMinimal ? 8 : 9, color: "#1e293b", marginBottom: 15 }}>
                    {toIndianWords(parseFloat(invoice.grandTotal))}
                  </Text>
                  
                  <Text style={activeStyles.boldText}>Terms & Conditions:</Text>
                  <Text style={activeStyles.regularText}>1. Goods once sold cannot be returned or exchanged.</Text>
                  <Text style={activeStyles.regularText}>2. Standard weight tolerances and purity apply.</Text>
                  <Text style={activeStyles.regularText}>3. Subject to local state jurisdiction.</Text>
                </View>

                <View style={activeStyles.totalsSection}>
                  <View style={activeStyles.totalRow}>
                    <Text style={activeStyles.regularText}>Taxable Subtotal:</Text>
                    <Text style={activeStyles.boldText}>INR {invoice.subtotal}</Text>
                  </View>
                  {parseFloat(invoice.cgstTotal) > 0 && (
                    <>
                      <View style={activeStyles.totalRow}>
                        <Text style={activeStyles.regularText}>CGST (1.5%):</Text>
                        <Text style={activeStyles.boldText}>INR {invoice.cgstTotal}</Text>
                      </View>
                      <View style={activeStyles.totalRow}>
                        <Text style={activeStyles.regularText}>SGST (1.5%):</Text>
                        <Text style={activeStyles.boldText}>INR {invoice.sgstTotal}</Text>
                      </View>
                    </>
                  )}
                  {parseFloat(invoice.igstTotal) > 0 && (
                    <View style={activeStyles.totalRow}>
                      <Text style={activeStyles.regularText}>IGST (3.0%):</Text>
                      <Text style={activeStyles.boldText}>INR {invoice.igstTotal}</Text>
                    </View>
                  )}

                  {hasGoldExchange && (
                    <>
                      <View style={activeStyles.totalRow}>
                        <Text style={activeStyles.regularText}>Total Invoice Value:</Text>
                        <Text style={activeStyles.boldText}>INR {grossInvoiceValue.toFixed(2)}</Text>
                      </View>
                      {goldExchangePayments.map((p, idx) => (
                        <View style={activeStyles.totalRow} key={p.id || idx}>
                          <Text style={activeStyles.regularText}>
                            Old Gold Deduction ({p.exchangeMetalWeight ? parseFloat(p.exchangeMetalWeight).toFixed(3) : "0.000"}g):
                          </Text>
                          <Text style={activeStyles.boldText}>-INR {parseFloat(p.exchangeMetalValue || p.amount).toFixed(2)}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  <View style={activeStyles.totalRow}>
                    <Text style={activeStyles.regularText}>Round Off:</Text>
                    <Text style={activeStyles.boldText}>INR {invoice.roundOff}</Text>
                  </View>
                  
                  <View style={activeStyles.grandTotalRow}>
                    <Text style={{ fontFamily: boldFont }}>{hasGoldExchange ? "Net Payable:" : "Grand Total:"}</Text>
                    <Text style={{ fontFamily: boldFont }}>INR {invoice.grandTotal}</Text>
                  </View>
                </View>
              </View>
            </>
          );
        })()}

        {/* Footer */}
        <View style={activeStyles.footer}>
          <Text>This is a computer-generated GST invoice and does not require a physical signature.</Text>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};
