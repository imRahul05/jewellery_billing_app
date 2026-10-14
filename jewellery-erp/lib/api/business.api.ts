import { api } from "./http";
import type { MetalRate, Prisma } from "@prisma/client";

export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function isAddressDetails(val: unknown): val is AddressDetails {
  if (!val || typeof val !== "object") return false;
  const v = val as Record<string, unknown>;
  return (
    typeof v.street === "string" &&
    typeof v.city === "string" &&
    typeof v.state === "string" &&
    typeof v.postalCode === "string"
  );
}

export function formatAddress(address: unknown): string | null {
  if (!address) return null;
  if (typeof address === "string") return address.trim() || null;
  if (typeof address === "object" && address !== null) {
    const addr = address as Partial<AddressDetails>;
    const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.country]
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .map((p) => p.trim());
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

export type PaymentModeDefault = "cash" | "upi" | "card" | "split" | "due";

export interface UnifiedBusinessSettings {
  name: string;
  gstin: string | null;
  pan: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressJson: unknown;
  address: AddressDetails | null;
  logoAssetId: string | null;
  baseCurrency: string;
  defaultGstRate: Prisma.Decimal | string | number;
  gstRegistered: boolean;
  makingChargeMode: string;
  defaultMakingCharge: Prisma.Decimal | string | number;
  invoicePrefix: string;
  invoiceNextSeq: string | number | bigint;
  financialYearStartMonth: number;
  defaultTemplateId: string | null;
  defaultPaymentMode: PaymentModeDefault;
}

export interface AppNotification {
  id: string;
  tenantId: string;
  userId: string | null;
  channel: string;
  status: string;
  category: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface AppAuditLog {
  id: string;
  occurredAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  actor: {
    email: string;
    fullName: string | null;
  } | null;
}

export const businessApi = {
  getSettings: () => api.get<UnifiedBusinessSettings>("/settings/business"),
  updateSettings: (data: Partial<UnifiedBusinessSettings>) => 
    api.patch<UnifiedBusinessSettings>("/settings/business", data),
  getMetalRates: (params?: { metalType?: string; rateDate?: string }) => 
    api.get<MetalRate[]>("/settings/metal-rates", params),
  createMetalRate: (data: { metalType: string; purityFineness?: string; rateDate: string; ratePerGram: string; source?: string }) => 
    api.post<MetalRate>("/settings/metal-rates", data),
  getNotifications: () => api.get<AppNotification[]>("/notifications"),
  markNotificationRead: (id: string) => api.patch<{ success: boolean }>("/notifications", { id }),
  markAllNotificationsRead: () => api.patch<{ success: boolean }>("/notifications", { all: true }),
  getAuditLogs: () => api.get<AppAuditLog[]>("/audit-logs"),
};
