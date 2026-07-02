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

export const businessApi = {
  getSettings: () => api.get<UnifiedBusinessSettings>("/settings/business"),
  updateSettings: (data: Partial<UnifiedBusinessSettings>) => 
    api.patch<UnifiedBusinessSettings>("/settings/business", data),
  getMetalRates: (params?: { metalType?: string; rateDate?: string }) => 
    api.get<MetalRate[]>("/settings/metal-rates", params),
  createMetalRate: (data: { metalType: string; purityFineness?: string; rateDate: string; ratePerGram: string; source?: string }) => 
    api.post<MetalRate>("/settings/metal-rates", data),
};
