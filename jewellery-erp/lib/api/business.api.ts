import { api } from "./http";
import type { MetalRate, Prisma } from "@prisma/client";

export interface UnifiedBusinessSettings {
  name: string;
  gstin: string | null;
  pan: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressJson: unknown;
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
