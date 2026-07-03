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
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#333",
    lineHeight: 1.4,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 15,
  },
  shopSection: {
    width: "48%",
  },
  invoiceSection: {
    width: "48%",
    textAlign: "right",
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 3,
  },
  regularText: {
    color: "#555",
    marginBottom: 2,
  },
  billingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    backgroundColor: "#fafafa",
    padding: 10,
    borderRadius: 4,
  },
  billingSection: {
    width: "48%",
  },
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    padding: 5,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 5,
    alignItems: "center",
  },
  colDesc: { width: "25%" },
  colHsn: { width: "10%", textAlign: "center" },
  colWeight: { width: "15%", textAlign: "right" },
  colRate: { width: "12%", textAlign: "right" },
  colMaking: { width: "10%", textAlign: "right" },
  colTaxable: { width: "13%", textAlign: "right" },
  colGst: { width: "15%", textAlign: "right" },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  wordsSection: {
    width: "55%",
    fontSize: 8,
    color: "#555",
  },
  totalsSection: {
    width: "40%",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginTop: 5,
    borderTopWidth: 1.5,
    borderTopColor: "#1e293b",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e293b",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  footer: {
    marginTop: 50,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
    textAlign: "center",
    color: "#888",
    fontSize: 8,
  },
});

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

export const InvoicePdfDocument: React.FC<InvoicePdfProps> = ({
  invoice,
  customer,
  tenantName,
  tenantGstin,
  tenantAddress,
  tenantPhone,
}) => {
  const isPurchase = invoice.type === "purchase";
  const placeOfSupplyText = invoice.placeOfSupply ? `GST State Code: ${invoice.placeOfSupply}` : "N/A";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isPurchase ? "Purchase Voucher" : invoice.status === "draft" ? "Draft Estimate" : "Tax Invoice"}
          </Text>
        </View>

        {/* Header Metadata */}
        <View style={styles.metaContainer}>
          <View style={styles.shopSection}>
            <Text style={styles.boldText}>{tenantName}</Text>
            <Text style={styles.regularText}>{tenantAddress || "No address provided"}</Text>
            <Text style={styles.regularText}>Phone: {tenantPhone || "N/A"}</Text>
            <Text style={styles.boldText}>GSTIN: {tenantGstin || "N/A"}</Text>
          </View>
          <View style={styles.invoiceSection}>
            <Text style={styles.boldText}>Invoice No: {invoice.invoiceNumber}</Text>
            <Text style={styles.regularText}>Date: {invoice.invoiceDate}</Text>
            {invoice.dueDate && <Text style={styles.regularText}>Due Date: {invoice.dueDate}</Text>}
            <Text style={styles.regularText}>Place of Supply: {placeOfSupplyText}</Text>
            <Text style={styles.regularText}>Type: {invoice.type.toUpperCase()}</Text>
          </View>
        </View>

        {/* Billing Info */}
        <View style={styles.billingContainer}>
          <View style={styles.billingSection}>
            <Text style={styles.boldText}>{isPurchase ? "Supplier Details:" : "Bill To:"}</Text>
            {customer ? (
              <>
                <Text style={styles.boldText}>{customer.name}</Text>
                <Text style={styles.regularText}>Phone: {customer.phone || "N/A"}</Text>
                {customer.email && <Text style={styles.regularText}>Email: {customer.email}</Text>}
                <Text style={styles.regularText}>Address: {formatAddress(customer.addressJson)}</Text>
                {customer.gstin && <Text style={styles.boldText}>GSTIN: {customer.gstin}</Text>}
              </>
            ) : (
              <Text style={styles.regularText}>Walk-in Customer</Text>
            )}
          </View>
          <View style={styles.billingSection}>
            <Text style={styles.boldText}>Payment Status:</Text>
            <Text style={styles.regularText}>Status: {invoice.status.toUpperCase()}</Text>
            <Text style={styles.regularText}>Total Paid: INR {invoice.amountPaid}</Text>
            <Text style={styles.boldText}>Balance Due: INR {invoice.balanceDue}</Text>
          </View>
        </View>

        {/* Table of Line Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Item Description</Text>
            <Text style={styles.colHsn}>HSN</Text>
            <Text style={styles.colWeight}>Weight (Grs)</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colMaking}>Making</Text>
            <Text style={styles.colTaxable}>Taxable Val</Text>
            <Text style={styles.colGst}>GST</Text>
          </View>

          {invoice.lineItems?.map((line, index) => {
            const cgst = parseFloat(line.cgstAmount);
            const sgst = parseFloat(line.sgstAmount);
            const igst = parseFloat(line.igstAmount);
            const lineGst = igst > 0 ? `INR ${igst.toFixed(2)}` : `INR ${(cgst + sgst).toFixed(2)}`;

            return (
              <View style={styles.tableRow} key={line.id || index}>
                <Text style={styles.colDesc}>{line.description}</Text>
                <Text style={styles.colHsn}>{line.hsnCodeId || "7113"}</Text>
                <Text style={styles.colWeight}>
                  {parseFloat(line.grossWeight).toFixed(3)}g (Net: {parseFloat(line.netWeight).toFixed(3)}g)
                </Text>
                <Text style={styles.colRate}>INR {parseFloat(line.ratePerGram).toFixed(2)}</Text>
                <Text style={styles.colMaking}>INR {parseFloat(line.makingCharge).toFixed(2)}</Text>
                <Text style={styles.colTaxable}>INR {parseFloat(line.taxableValue).toFixed(2)}</Text>
                <Text style={styles.colGst}>{lineGst}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary & Totals */}
        <View style={styles.summaryContainer}>
          <View style={styles.wordsSection}>
            <Text style={styles.boldText}>Amount in Words:</Text>
            <Text style={{ fontFamily: "Helvetica-Oblique", fontSize: 9, color: "#1e293b", marginBottom: 15 }}>
              {toIndianWords(parseFloat(invoice.grandTotal))}
            </Text>
            
            <Text style={styles.boldText}>Terms & Conditions:</Text>
            <Text style={styles.regularText}>1. Goods once sold cannot be returned or exchanged.</Text>
            <Text style={styles.regularText}>2. Standard weight tolerances and purity apply.</Text>
            <Text style={styles.regularText}>3. Subject to local state jurisdiction.</Text>
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.regularText}>Taxable Subtotal:</Text>
              <Text style={styles.boldText}>INR {invoice.subtotal}</Text>
            </View>
            {parseFloat(invoice.cgstTotal) > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.regularText}>CGST (1.5%):</Text>
                  <Text style={styles.boldText}>INR {invoice.cgstTotal}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.regularText}>SGST (1.5%):</Text>
                  <Text style={styles.boldText}>INR {invoice.sgstTotal}</Text>
                </View>
              </>
            )}
            {parseFloat(invoice.igstTotal) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.regularText}>IGST (3.0%):</Text>
                <Text style={styles.boldText}>INR {invoice.igstTotal}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.regularText}>Round Off:</Text>
              <Text style={styles.boldText}>INR {invoice.roundOff}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Grand Total:</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>INR {invoice.grandTotal}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated GST invoice and does not require a physical signature.</Text>
          <Text>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  );
};
