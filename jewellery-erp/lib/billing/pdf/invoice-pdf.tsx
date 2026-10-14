import React from "react";
import { Document, Page, Text, View, StyleSheet, DocumentProps } from "@react-pdf/renderer";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";
import { Prisma } from "@prisma/client";
import { toIndianWords } from "../indian-words";
import { getCleanTemplateId } from "../templates-db";

export interface InvoicePdfProps {
  invoice: SerializedInvoice;
  customer?: {
    name: string;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    addressJson: Prisma.JsonValue | string | null;
  } | null;
  tenantName: string;
  tenantGstin: string | null;
  tenantAddress: string | null;
  tenantPhone: string | null;
  templateId?: string | null;
}

export function formatCustomerAddress(json: Prisma.JsonValue | string | null | undefined): string {
  if (!json) return "N/A";
  if (typeof json === "string") return json;
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    const record = json as Record<string, Prisma.JsonValue>;
    const street = typeof record.street === "string" ? record.street : undefined;
    const city = typeof record.city === "string" ? record.city : undefined;
    const state = typeof record.state === "string" ? record.state : undefined;
    const postalCode = typeof record.postalCode === "string" ? record.postalCode : undefined;
    const parts = [street, city, state, postalCode].filter((p): p is string => Boolean(p && p.trim().length > 0));
    return parts.length > 0 ? parts.join(", ") : "N/A";
  }
  return "N/A";
}

// ---------------------------------------------------------------------------
// Template Theme Configurations for 40 Gold Templates
// ---------------------------------------------------------------------------
interface TemplateTheme {
  primaryColor: string;
  headerBg: string;
  headerText: string;
  accentBg: string;
  accentBorder: string;
  fontFamily: "Helvetica" | "Times-Roman";
  fontBold: "Helvetica-Bold" | "Times-Bold";
  fontItalic: "Helvetica-Oblique" | "Times-Italic";
  paperSize: "A4" | "A5" | "Thermal-80mm" | "Thermal-58mm";
  isThermal: boolean;
  orientation?: "portrait" | "landscape";
  badge?: string;
  hasBanner?: boolean;
}

const DEFAULT_THEME: TemplateTheme = {
  primaryColor: "#78350f",
  headerBg: "#78350f",
  headerText: "#ffffff",
  accentBg: "#fffbeb",
  accentBorder: "#fde68a",
  fontFamily: "Times-Roman",
  fontBold: "Times-Bold",
  fontItalic: "Times-Italic",
  paperSize: "A4",
  isThermal: false,
  badge: "AUTHENTIC GOLD JEWELLERY",
};

const THEME_MAP: Record<string, Partial<TemplateTheme>> = {
  // Thermal receipts
  "gold-thermal-receipt-80mm": {
    paperSize: "Thermal-80mm",
    isThermal: true,
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "80MM POS RECEIPT",
  },
  "gold-thermal-receipt-58mm": {
    paperSize: "Thermal-58mm",
    isThermal: true,
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "58MM COMPACT RECEIPT",
  },

  // A5 Formats
  "gold-a5-voucher": {
    paperSize: "A5",
    orientation: "landscape",
    primaryColor: "#92400e",
    headerBg: "#78350f",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "LUXURY GIFT VOUCHER BILL",
  },
  "gold-compact-counter": {
    paperSize: "A5",
    orientation: "portrait",
    primaryColor: "#1e293b",
    headerBg: "#334155",
    accentBg: "#f8fafc",
    accentBorder: "#e2e8f0",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "RETAIL COUNTER RECEIPT",
  },

  // Regal Crimson / Bridal / Kundan / Polki
  "gold-royal-zari": {
    primaryColor: "#881337",
    headerBg: "#881337",
    accentBg: "#fff1f2",
    accentBorder: "#fecdd3",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "ROYAL ZARI LUXURY",
  },
  "gold-bridal-collection": {
    primaryColor: "#9f1239",
    headerBg: "#9f1239",
    accentBg: "#fff1f2",
    accentBorder: "#fecdd3",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "BRIDAL HERITAGE SET",
  },
  "gold-kundan-meenakari": {
    primaryColor: "#991b1b",
    headerBg: "#991b1b",
    accentBg: "#fef2f2",
    accentBorder: "#fecaca",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "KUNDAN MEENAKARI JADAU",
  },
  "gold-polki-heritage": {
    primaryColor: "#92400e",
    headerBg: "#92400e",
    accentBg: "#fefce8",
    accentBorder: "#fef08a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "POLKI & UNCUT DIAMONDS",
  },
  "gold-festive-diwali": {
    primaryColor: "#991b1b",
    headerBg: "#b91c1c",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "SHUBH DEEPAWALI SPECIAL",
  },
  "gold-royal-maratha": {
    primaryColor: "#c2410c",
    headerBg: "#c2410c",
    accentBg: "#fff7ed",
    accentBorder: "#fed7aa",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "ROYAL MARATHA HERITAGE",
  },

  // Emerald Luxe / Vedic
  "gold-emerald-crest": {
    primaryColor: "#064e3b",
    headerBg: "#064e3b",
    accentBg: "#ecfdf5",
    accentBorder: "#a7f3d0",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "EMERALD CREST • LUXURY",
  },
  "gold-shree-ratna": {
    primaryColor: "#065f46",
    headerBg: "#065f46",
    accentBg: "#ecfdf5",
    accentBorder: "#a7f3d0",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "SHREE RATNA JEWELLERY",
  },
  "gold-antique-matte": {
    primaryColor: "#292524",
    headerBg: "#44403c",
    accentBg: "#f5f5f4",
    accentBorder: "#d6d3d1",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "ANTIQUE MATTE GOLD",
  },

  // Sapphire Luxe / Cobalt
  "gold-sapphire-luxe": {
    primaryColor: "#1e3a8a",
    headerBg: "#1e3a8a",
    accentBg: "#eff6ff",
    accentBorder: "#bfdbfe",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "ROYAL SAPPHIRE EDITION",
  },
  "gold-two-tone-duo": {
    primaryColor: "#1e293b",
    headerBg: "#1e3a8a",
    accentBg: "#f8fafc",
    accentBorder: "#e2e8f0",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "TWO-TONE GOLD & PLATINUM",
  },
  "gold-italian-chain": {
    primaryColor: "#172554",
    headerBg: "#1e3a8a",
    accentBg: "#eff6ff",
    accentBorder: "#bfdbfe",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "MILANESE ITALIAN CHAIN",
  },

  // Rose Gold
  "gold-rose-gold-chic": {
    primaryColor: "#9d174d",
    headerBg: "#9d174d",
    accentBg: "#fdf2f8",
    accentBorder: "#fbcfe8",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "ROSE GOLD COUTURE",
  },
  "gold-filigree-delicate": {
    primaryColor: "#831843",
    headerBg: "#9d174d",
    accentBg: "#fdf2f8",
    accentBorder: "#fbcfe8",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "DELICATE FILIGREE CRAFT",
  },

  // Modern / Boutique / Minimal
  "gold-modern-boutique": {
    primaryColor: "#0f172a",
    headerBg: "#0f172a",
    accentBg: "#f8fafc",
    accentBorder: "#e2e8f0",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    hasBanner: true,
    badge: "DESIGNER BOUTIQUE STUDIO",
  },
  "gold-minimal-karat": {
    primaryColor: "#18181b",
    headerBg: "#18181b",
    accentBg: "#fafafa",
    accentBorder: "#e4e4e7",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "PURITY CERTIFIED 916",
  },
  "gold-contemporary-linear": {
    primaryColor: "#09090b",
    headerBg: "#27272a",
    accentBg: "#f4f4f5",
    accentBorder: "#e4e4e7",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "CONTEMPORARY LINEAR",
  },
  "gold-diamond-solitaire": {
    primaryColor: "#0f172a",
    headerBg: "#1e293b",
    accentBg: "#f8fafc",
    accentBorder: "#e2e8f0",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "SOLITAIRE & FINE JEWELS",
  },
  "gold-art-deco": {
    primaryColor: "#1c1917",
    headerBg: "#292524",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "ART DECO 1925 COLLECTION",
  },
  "gold-nouveau-curves": {
    primaryColor: "#451a03",
    headerBg: "#78350f",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "ART NOUVEAU LUXURY",
  },
  "gold-elite-concierge": {
    primaryColor: "#0a0a0a",
    headerBg: "#171717",
    accentBg: "#fafafa",
    accentBorder: "#d4d4d4",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "VIP CLIENT CONCIERGE",
  },

  // Certified Hallmark Ledger / Bullion / Wholesale
  "gold-hallmark-ledger": {
    primaryColor: "#334155",
    headerBg: "#334155",
    accentBg: "#f1f5f9",
    accentBorder: "#cbd5e1",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "GOVERNMENT APPROVED BIS HALLMARK",
  },
  "gold-bullion-simple": {
    primaryColor: "#1e293b",
    headerBg: "#334155",
    accentBg: "#f8fafc",
    accentBorder: "#cbd5e1",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "INVESTMENT BULLION 999.9",
  },
  "gold-pure-999": {
    primaryColor: "#78350f",
    headerBg: "#92400e",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "24 KARAT 999.9 PURE REFINERY",
  },
  "gold-corporate-wholesale": {
    primaryColor: "#1e293b",
    headerBg: "#1e293b",
    accentBg: "#f1f5f9",
    accentBorder: "#cbd5e1",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "B2B WHOLESALE INVOICE",
  },
  "gold-sovereign-vault": {
    primaryColor: "#292524",
    headerBg: "#44403c",
    accentBg: "#f5f5f4",
    accentBorder: "#d6d3d1",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "SWISS VAULT CERTIFIED",
  },
  "gold-artisan-workshop": {
    primaryColor: "#44403c",
    headerBg: "#57534e",
    accentBg: "#f5f5f4",
    accentBorder: "#d6d3d1",
    fontFamily: "Helvetica",
    fontBold: "Helvetica-Bold",
    fontItalic: "Helvetica-Oblique",
    badge: "MASTER GOLDSMITH WORKSHOP",
  },
  "gold-premium-signature": {
    primaryColor: "#0f172a",
    headerBg: "#0f172a",
    accentBg: "#f8fafc",
    accentBorder: "#cbd5e1",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "HAUTE JOAILLERIE SIGNATURE",
  },

  // Traditional Gold / Heritage
  "gold-temple-gold": {
    primaryColor: "#78350f",
    headerBg: "#78350f",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "SOUTH INDIAN TEMPLE GOLD",
  },
  "gold-vintage-ornate": {
    primaryColor: "#78350f",
    headerBg: "#78350f",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "VINTAGE ORNATE EDITION",
  },
  "gold-heritage-palace": {
    primaryColor: "#854d0e",
    headerBg: "#854d0e",
    accentBg: "#fefce8",
    accentBorder: "#fef08a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "PALACE HERITAGE GEMS",
  },
  "gold-bengal-karigari": {
    primaryColor: "#92400e",
    headerBg: "#92400e",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "BENGAL HANDCRAFTED KARIGARI",
  },
  "gold-nizam-hyderabad": {
    primaryColor: "#854d0e",
    headerBg: "#854d0e",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "NIZAM OF HYDERABAD HERITAGE",
  },
  "gold-akshaya-tritiya": {
    primaryColor: "#b45309",
    headerBg: "#b45309",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "AKSHAYA TRITIYA AUSPICIOUS GOLD",
  },
  "gold-bilingual-hindi": {
    primaryColor: "#991b1b",
    headerBg: "#991b1b",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "TAX INVOICE / कर चालान",
  },
  "gold-classic-jewellers": {
    primaryColor: "#78350f",
    headerBg: "#78350f",
    accentBg: "#fffbeb",
    accentBorder: "#fde68a",
    fontFamily: "Times-Roman",
    fontBold: "Times-Bold",
    fontItalic: "Times-Italic",
    badge: "AUTHENTIC GOLD JEWELLERS",
  },
};

function getTheme(templateId?: string | null): TemplateTheme {
  const cleanId = getCleanTemplateId(templateId);
  const overrides = THEME_MAP[cleanId] || {};
  return { ...DEFAULT_THEME, ...overrides };
}

// ---------------------------------------------------------------------------
// Thermal POS Receipt PDF Layout (80mm & 58mm continuous roll)
// ---------------------------------------------------------------------------
interface ThermalPdfProps {
  invoice: SerializedInvoice;
  customer?: InvoicePdfProps["customer"];
  tenantName: string;
  tenantGstin: string | null;
  tenantAddress: string | null;
  tenantPhone: string | null;
  theme: TemplateTheme;
}

const ThermalReceiptPdf: React.FC<ThermalPdfProps> = ({
  invoice,
  customer,
  tenantName,
  tenantGstin,
  tenantAddress,
  tenantPhone,
  theme,
}) => {
  const is58mm = theme.paperSize === "Thermal-58mm";
  const rollWidth = is58mm ? 164.4 : 226.77;
  const rollHeight = 850;

  const styles = StyleSheet.create({
    page: {
      padding: is58mm ? 6 : 10,
      fontFamily: "Helvetica",
      fontSize: is58mm ? 7 : 8,
      color: "#000000",
      lineHeight: 1.25,
    },
    center: { textAlign: "center" as const },
    storeName: {
      fontSize: is58mm ? 10 : 12,
      fontFamily: "Helvetica-Bold",
      textAlign: "center" as const,
      marginBottom: 2,
    },
    metaText: {
      fontSize: is58mm ? 6 : 7,
      textAlign: "center" as const,
      color: "#333333",
      marginBottom: 1,
    },
    badge: {
      fontSize: is58mm ? 5.5 : 6.5,
      fontFamily: "Helvetica-Bold",
      textAlign: "center" as const,
      marginTop: 2,
      paddingVertical: 1,
    },
    dashedLine: {
      borderBottomWidth: 0.8,
      borderBottomColor: "#555555",
      borderBottomStyle: "dashed" as const,
      marginVertical: 4,
    },
    solidLine: {
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      marginVertical: 4,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontFamily: "Helvetica-Bold",
      fontSize: is58mm ? 7.5 : 8.5,
      marginBottom: 2,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 1.5,
    },
    itemBlock: {
      marginBottom: 4,
      paddingBottom: 2,
      borderBottomWidth: 0.5,
      borderBottomColor: "#e5e5e5",
    },
    itemTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontFamily: "Helvetica-Bold",
    },
    itemSubRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: is58mm ? 6 : 7,
      color: "#444444",
      marginTop: 1,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 1.5,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      fontFamily: "Helvetica-Bold",
      fontSize: is58mm ? 9 : 10,
      paddingVertical: 3,
      borderTopWidth: 1,
      borderTopColor: "#000000",
      borderBottomWidth: 1,
      borderBottomColor: "#000000",
      marginVertical: 3,
    },
    footer: {
      textAlign: "center" as const,
      fontSize: is58mm ? 6 : 7,
      color: "#555555",
      marginTop: 8,
      paddingTop: 4,
    },
  });

  const goldExchangePayments = invoice.payments?.filter((p) => p.method === "gold_exchange") || [];
  const nonGoldPayments = invoice.payments?.filter((p) => p.method !== "gold_exchange") || [];

  return (
    <Page size={[rollWidth, rollHeight]} style={styles.page}>
      {/* Centered Store Header */}
      <Text style={styles.storeName}>{tenantName}</Text>
      {tenantAddress && <Text style={styles.metaText}>{tenantAddress}</Text>}
      {tenantPhone && <Text style={styles.metaText}>Tel: {tenantPhone}</Text>}
      {tenantGstin && <Text style={styles.metaText}>GSTIN: {tenantGstin}</Text>}
      {theme.badge && <Text style={styles.badge}>[{theme.badge}]</Text>}

      <View style={styles.dashedLine} />

      {/* Bill Title & Details */}
      <View style={styles.titleRow}>
        <Text>{invoice.status === "draft" ? "DRAFT ESTIMATE" : "TAX INVOICE"}</Text>
        <Text>#{invoice.invoiceNumber}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text>Date: {invoice.invoiceDate}</Text>
        <Text>{invoice.type.toUpperCase()}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text>Customer: {customer?.name || "Walk-in Customer"}</Text>
        {customer?.phone && <Text>{customer.phone}</Text>}
      </View>
      {customer?.gstin && (
        <View style={styles.infoRow}>
          <Text>Cust GSTIN: {customer.gstin}</Text>
        </View>
      )}

      <View style={styles.dashedLine} />

      {/* Line Items */}
      <View style={{ marginBottom: 2 }}>
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: is58mm ? 6.5 : 7.5, marginBottom: 3 }}>
          ITEM DETAILS:
        </Text>
        {invoice.lineItems?.map((line, idx) => (
          <View style={styles.itemBlock} key={line.id || idx}>
            <View style={styles.itemTitleRow}>
              <Text style={{ width: "75%" }}>
                {line.description} {line.karat ? `(${line.karat}K)` : ""}
              </Text>
              <Text style={{ width: "25%", textAlign: "right" }}>
                INR {parseFloat(line.taxableValue).toFixed(2)}
              </Text>
            </View>
            <View style={styles.itemSubRow}>
              <Text>
                G:{parseFloat(line.grossWeight).toFixed(3)}g N:{parseFloat(line.netWeight).toFixed(3)}g @ ₹{parseFloat(line.ratePerGram).toFixed(0)}/g
              </Text>
              <Text>Mk:₹{parseFloat(line.makingCharge).toFixed(0)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.dashedLine} />

      {/* Totals */}
      <View style={styles.totalRow}>
        <Text>Subtotal (Taxable):</Text>
        <Text>INR {invoice.subtotal}</Text>
      </View>

      {parseFloat(invoice.cgstTotal) > 0 && (
        <View style={styles.totalRow}>
          <Text>CGST (1.5%) + SGST (1.5%):</Text>
          <Text>INR {(parseFloat(invoice.cgstTotal) + parseFloat(invoice.sgstTotal)).toFixed(2)}</Text>
        </View>
      )}
      {parseFloat(invoice.igstTotal) > 0 && (
        <View style={styles.totalRow}>
          <Text>IGST (3.0%):</Text>
          <Text>INR {invoice.igstTotal}</Text>
        </View>
      )}

      {goldExchangePayments.length > 0 &&
        goldExchangePayments.map((p, idx) => (
          <View style={styles.totalRow} key={p.id || idx}>
            <Text>Old Gold Credit ({p.exchangeMetalWeight ? parseFloat(p.exchangeMetalWeight).toFixed(3) : "0"}g):</Text>
            <Text>-INR {parseFloat(p.exchangeMetalValue || p.amount).toFixed(2)}</Text>
          </View>
        ))}

      <View style={styles.totalRow}>
        <Text>Round Off:</Text>
        <Text>INR {invoice.roundOff}</Text>
      </View>

      <View style={styles.grandTotalRow}>
        <Text>NET TOTAL:</Text>
        <Text>INR {invoice.grandTotal}</Text>
      </View>

      {nonGoldPayments.map((p, idx) => (
        <View style={styles.totalRow} key={p.id || idx}>
          <Text>Paid ({p.method.toUpperCase()}):</Text>
          <Text>INR {parseFloat(p.amount).toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Balance Due:</Text>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>INR {invoice.balanceDue}</Text>
      </View>

      <View style={styles.dashedLine} />

      {/* Amount in words */}
      <Text style={{ fontSize: is58mm ? 6 : 7, fontStyle: "italic", marginBottom: 4 }}>
        {toIndianWords(parseFloat(invoice.grandTotal))}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Terms: Goods once sold cannot be returned.</Text>
        <Text>Thank you for visiting! Visit again.</Text>
      </View>
    </Page>
  );
};

// ---------------------------------------------------------------------------
// Standard Layout (A4 & A5 formats) for all 38 other templates
// ---------------------------------------------------------------------------
interface StandardPdfProps {
  invoice: SerializedInvoice;
  customer?: InvoicePdfProps["customer"];
  tenantName: string;
  tenantGstin: string | null;
  tenantAddress: string | null;
  tenantPhone: string | null;
  theme: TemplateTheme;
}

const StandardPdfDocument: React.FC<StandardPdfProps> = ({
  invoice,
  customer,
  tenantName,
  tenantGstin,
  tenantAddress,
  tenantPhone,
  theme,
}) => {
  const isPurchase = invoice.type === "purchase";
  const placeOfSupplyText = invoice.placeOfSupply ? `GST State Code: ${invoice.placeOfSupply}` : "N/A";
  const isA5 = theme.paperSize === "A5";
  const isLandscape = theme.orientation === "landscape";

  const styles = StyleSheet.create({
    page: {
      padding: isA5 ? (isLandscape ? 22 : 24) : 34,
      fontFamily: theme.fontFamily,
      fontSize: isA5 ? 7.5 : 8.5,
      color: "#1e293b",
      lineHeight: 1.35,
    },
    voucherBorder: {
      borderWidth: 1.5,
      borderColor: theme.primaryColor,
      borderRadius: 4,
      padding: 12,
      height: "100%",
    },
    banner: {
      height: 4,
      backgroundColor: theme.primaryColor,
      marginBottom: 12,
    },
    titleBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1.5,
      borderBottomColor: theme.accentBorder,
      paddingBottom: 8,
      marginBottom: 12,
    },
    shopTitle: {
      fontSize: isA5 ? 14 : 17,
      fontFamily: theme.fontBold,
      color: theme.primaryColor,
      letterSpacing: 0.5,
    },
    docTitle: {
      fontSize: isA5 ? 11 : 13,
      fontFamily: theme.fontBold,
      color: theme.primaryColor,
      textTransform: "uppercase" as const,
      textAlign: "right" as const,
    },
    badgeTag: {
      fontSize: 7,
      fontFamily: theme.fontBold,
      color: theme.primaryColor,
      backgroundColor: theme.accentBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 2,
      borderWidth: 0.5,
      borderColor: theme.accentBorder,
      marginTop: 2,
      alignSelf: "flex-end" as const,
    },
    metaGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    metaCol: {
      width: "48%",
    },
    card: {
      backgroundColor: theme.accentBg,
      borderColor: theme.accentBorder,
      borderWidth: 0.8,
      borderRadius: 4,
      padding: 8,
      marginBottom: 10,
    },
    cardTitle: {
      fontFamily: theme.fontBold,
      fontSize: isA5 ? 7.5 : 8.5,
      color: theme.primaryColor,
      marginBottom: 4,
      textTransform: "uppercase" as const,
    },
    bold: {
      fontFamily: theme.fontBold,
    },
    regular: {
      color: "#475569",
      marginBottom: 1.5,
    },
    table: {
      width: "100%",
      marginBottom: 12,
      borderWidth: 0.8,
      borderColor: theme.accentBorder,
      borderRadius: 3,
      overflow: "hidden" as const,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: theme.headerBg,
      color: theme.headerText,
      fontFamily: theme.fontBold,
      fontSize: isA5 ? 7 : 7.5,
      paddingVertical: 4.5,
      paddingHorizontal: 4,
      alignItems: "center",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#e2e8f0",
      paddingVertical: 4,
      paddingHorizontal: 4,
      alignItems: "center",
      fontSize: isA5 ? 7 : 7.5,
    },
    colDesc: { width: "24%" },
    colKarat: { width: "8%", textAlign: "center" as const },
    colWeight: { width: "16%", textAlign: "right" as const },
    colRate: { width: "10%", textAlign: "right" as const },
    colMaking: { width: "10%", textAlign: "right" as const },
    colStone: { width: "8%", textAlign: "right" as const },
    colTaxable: { width: "12%", textAlign: "right" as const },
    colGst: { width: "12%", textAlign: "right" as const },
    summaryGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    leftSummary: {
      width: isLandscape ? "52%" : "55%",
    },
    rightSummary: {
      width: isLandscape ? "45%" : "40%",
    },
    totalLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 2.5,
      borderBottomWidth: 0.5,
      borderBottomColor: "#f1f5f9",
      fontSize: isA5 ? 7 : 8,
    },
    grandTotalLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      marginTop: 4,
      borderTopWidth: 1.5,
      borderTopColor: theme.primaryColor,
      borderBottomWidth: 1.5,
      borderBottomColor: theme.primaryColor,
      fontFamily: theme.fontBold,
      fontSize: isA5 ? 9.5 : 10.5,
      color: theme.primaryColor,
    },
    signatoryBox: {
      marginTop: 20,
      borderTopWidth: 0.8,
      borderTopColor: "#94a3b8",
      paddingTop: 4,
      textAlign: "right" as const,
      fontSize: 7.5,
      color: "#64748b",
    },
    footerText: {
      marginTop: 20,
      borderTopWidth: 0.8,
      borderTopColor: "#e2e8f0",
      paddingTop: 8,
      textAlign: "center" as const,
      fontSize: 7,
      color: "#94a3b8",
    },
  });

  const goldExchangePayments = invoice.payments?.filter((p) => p.method === "gold_exchange") || [];
  const nonGoldPayments = invoice.payments?.filter((p) => p.method !== "gold_exchange") || [];
  const hasGoldExchange = goldExchangePayments.length > 0;
  const grossInvoiceValue =
    parseFloat(invoice.subtotal) +
    parseFloat(invoice.cgstTotal) +
    parseFloat(invoice.sgstTotal) +
    parseFloat(invoice.igstTotal);

  const mainContent = (
    <View style={isLandscape ? styles.voucherBorder : undefined}>
      {/* Decorative Top Banner */}
      {theme.hasBanner && <View style={styles.banner} />}

      {/* Header Title Bar */}
      <View style={styles.titleBar}>
        <View>
          <Text style={styles.shopTitle}>{tenantName}</Text>
          <Text style={styles.regular}>{tenantAddress || "Showroom Address"}</Text>
          <Text style={styles.regular}>
            {tenantPhone ? `Tel: ${tenantPhone} • ` : ""}GSTIN: {tenantGstin || "N/A"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.docTitle}>
            {isPurchase ? "Purchase Voucher" : invoice.status === "draft" ? "Draft Estimate" : "Tax Invoice"}
          </Text>
          <Text style={[styles.bold, { fontSize: isA5 ? 9 : 10, marginTop: 2 }]}>
            No: {invoice.invoiceNumber}
          </Text>
          <Text style={styles.regular}>Date: {invoice.invoiceDate}</Text>
          {theme.badge && <Text style={styles.badgeTag}>{theme.badge}</Text>}
        </View>
      </View>

      {/* Party Details Card */}
      <View style={styles.metaGrid}>
        <View style={[styles.card, styles.metaCol]}>
          <Text style={styles.cardTitle}>{isPurchase ? "Supplier / Vendor Details:" : "Billed To (Customer):"}</Text>
          {customer ? (
            <>
              <Text style={styles.bold}>{customer.name}</Text>
              <Text style={styles.regular}>Phone: {customer.phone || "N/A"}</Text>
              {customer.email && <Text style={styles.regular}>Email: {customer.email}</Text>}
              <Text style={styles.regular}>Address: {formatCustomerAddress(customer.addressJson)}</Text>
              {customer.gstin && <Text style={styles.bold}>GSTIN: {customer.gstin}</Text>}
            </>
          ) : (
            <Text style={styles.regular}>Walk-in Retail Customer</Text>
          )}
        </View>

        <View style={[styles.card, styles.metaCol]}>
          <Text style={styles.cardTitle}>Transaction & GST Details:</Text>
          <Text style={styles.regular}>Place of Supply: {placeOfSupplyText}</Text>
          <Text style={styles.regular}>Invoice Type: {invoice.type.toUpperCase()}</Text>
          <Text style={styles.regular}>Payment Status: {invoice.status.toUpperCase()}</Text>
          {invoice.dueDate && <Text style={styles.regular}>Due Date: {invoice.dueDate}</Text>}
          <Text style={[styles.bold, { color: parseFloat(invoice.balanceDue || "0") > 0 ? "#b45309" : "#166534" }]}>
            Balance Outstanding: INR {invoice.balanceDue}
          </Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Item Description</Text>
          <Text style={styles.colKarat}>Karat</Text>
          <Text style={styles.colWeight}>Weight (Gross/Net)</Text>
          <Text style={styles.colRate}>Rate/g</Text>
          <Text style={styles.colMaking}>Making</Text>
          <Text style={styles.colStone}>Stone</Text>
          <Text style={styles.colTaxable}>Taxable</Text>
          <Text style={styles.colGst}>GST</Text>
        </View>

        {invoice.lineItems?.map((line, idx) => {
          const cgst = parseFloat(line.cgstAmount);
          const sgst = parseFloat(line.sgstAmount);
          const igst = parseFloat(line.igstAmount);
          const lineGst = igst > 0 ? igst.toFixed(2) : (cgst + sgst).toFixed(2);

          return (
            <View style={styles.tableRow} key={line.id || idx}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colKarat}>
                {line.karat ? `${line.karat}K` : line.purityFineness ? `${parseFloat(line.purityFineness)}` : "-"}
              </Text>
              <Text style={styles.colWeight}>
                G:{parseFloat(line.grossWeight).toFixed(3)}g{"\n"}N:{parseFloat(line.netWeight).toFixed(3)}g
              </Text>
              <Text style={styles.colRate}>{parseFloat(line.ratePerGram).toFixed(2)}</Text>
              <Text style={styles.colMaking}>{parseFloat(line.makingCharge).toFixed(2)}</Text>
              <Text style={styles.colStone}>{parseFloat(line.stoneCharge).toFixed(2)}</Text>
              <Text style={styles.colTaxable}>{parseFloat(line.taxableValue).toFixed(2)}</Text>
              <Text style={styles.colGst}>{lineGst}</Text>
            </View>
          );
        })}
      </View>

      {/* Summary Section */}
      <View style={styles.summaryGrid}>
        <View style={styles.leftSummary}>
          <Text style={styles.bold}>Amount in Words:</Text>
          <Text style={{ fontFamily: theme.fontItalic, fontSize: isA5 ? 7.5 : 8.5, color: theme.primaryColor, marginBottom: 8 }}>
            {toIndianWords(parseFloat(invoice.grandTotal))}
          </Text>

          <Text style={styles.bold}>Declarations & Terms:</Text>
          <Text style={styles.regular}>1. Weight & purity certified as per Bureau of Indian Standards (BIS).</Text>
          <Text style={styles.regular}>2. Exchange or valuation subject to assaying guidelines.</Text>
          <Text style={styles.regular}>3. Subject to local jurisdiction.</Text>
        </View>

        <View style={styles.rightSummary}>
          <View style={styles.totalLine}>
            <Text style={styles.regular}>Taxable Subtotal:</Text>
            <Text style={styles.bold}>INR {invoice.subtotal}</Text>
          </View>

          {parseFloat(invoice.cgstTotal) > 0 && (
            <>
              <View style={styles.totalLine}>
                <Text style={styles.regular}>CGST (1.5%):</Text>
                <Text style={styles.bold}>INR {invoice.cgstTotal}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.regular}>SGST (1.5%):</Text>
                <Text style={styles.bold}>INR {invoice.sgstTotal}</Text>
              </View>
            </>
          )}

          {parseFloat(invoice.igstTotal) > 0 && (
            <View style={styles.totalLine}>
              <Text style={styles.regular}>IGST (3.0%):</Text>
              <Text style={styles.bold}>INR {invoice.igstTotal}</Text>
            </View>
          )}

          {hasGoldExchange && (
            <>
              <View style={styles.totalLine}>
                <Text style={styles.regular}>Gross Bill Value:</Text>
                <Text style={styles.bold}>INR {grossInvoiceValue.toFixed(2)}</Text>
              </View>
              {goldExchangePayments.map((p, idx) => (
                <View style={styles.totalLine} key={p.id || idx}>
                  <Text style={styles.regular}>
                    Old Gold ({p.exchangeMetalWeight ? parseFloat(p.exchangeMetalWeight).toFixed(3) : "0"}g):
                  </Text>
                  <Text style={styles.bold}>-INR {parseFloat(p.exchangeMetalValue || p.amount).toFixed(2)}</Text>
                </View>
              ))}
            </>
          )}

          <View style={styles.totalLine}>
            <Text style={styles.regular}>Round Off:</Text>
            <Text style={styles.bold}>INR {invoice.roundOff}</Text>
          </View>

          <View style={styles.grandTotalLine}>
            <Text>{hasGoldExchange ? "NET PAYABLE:" : "GRAND TOTAL:"}</Text>
            <Text>INR {invoice.grandTotal}</Text>
          </View>

          {nonGoldPayments.map((p, idx) => (
            <View style={styles.totalLine} key={p.id || idx}>
              <Text style={styles.regular}>
                Paid ({p.method.toUpperCase()}{p.referenceNo ? ` - ${p.referenceNo}` : ""}):
              </Text>
              <Text style={styles.bold}>INR {parseFloat(p.amount).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.totalLine}>
            <Text style={[styles.bold, { color: parseFloat(invoice.balanceDue || "0") > 0 ? "#b45309" : "#166534" }]}>
              Balance Due:
            </Text>
            <Text style={[styles.bold, { color: parseFloat(invoice.balanceDue || "0") > 0 ? "#b45309" : "#166534" }]}>
              INR {invoice.balanceDue}
            </Text>
          </View>

          <View style={styles.signatoryBox}>
            <Text style={styles.bold}>For {tenantName}</Text>
            <Text style={{ marginTop: 15, fontSize: 6.5 }}>Authorized Signatory</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerText}>
        <Text>This is a computer-generated GST tax invoice and does not require a physical signature.</Text>
        <Text>Thank you for choosing {tenantName}!</Text>
      </View>
    </View>
  );

  return (
    <Page
      size={theme.paperSize === "A5" ? "A5" : "A4"}
      orientation={theme.orientation || "portrait"}
      style={styles.page}
    >
      {mainContent}
    </Page>
  );
};

// ---------------------------------------------------------------------------
// Root Invoice PDF Document
// ---------------------------------------------------------------------------
export function InvoicePdfDocument({
  invoice,
  customer,
  tenantName,
  tenantGstin,
  tenantAddress,
  tenantPhone,
  templateId,
}: InvoicePdfProps): React.ReactElement<DocumentProps> {
  const theme = getTheme(templateId);

  return (
    <Document>
      {theme.isThermal ? (
        <ThermalReceiptPdf
          invoice={invoice}
          customer={customer}
          tenantName={tenantName}
          tenantGstin={tenantGstin}
          tenantAddress={tenantAddress}
          tenantPhone={tenantPhone}
          theme={theme}
        />
      ) : (
        <StandardPdfDocument
          invoice={invoice}
          customer={customer}
          tenantName={tenantName}
          tenantGstin={tenantGstin}
          tenantAddress={tenantAddress}
          tenantPhone={tenantPhone}
          theme={theme}
        />
      )}
    </Document>
  );
};
