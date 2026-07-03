import { api } from "./http";
import { MetalType } from "@prisma/client";
import { SerializedMetalRate } from "@/app/api/v1/metal-rates/route";

export interface MetalRateInput {
  metalType: MetalType;
  purityFineness?: string | null;
  rateDate: string | Date;
  ratePerGram: string | number;
  source?: string | null;
}

export const metalRateApi = {
  getMetalRates: (params?: { metalType?: MetalType; rateDate?: string }) =>
    api.get<SerializedMetalRate[]>("/metal-rates", params),
  getMetalRateById: (id: string) =>
    api.get<SerializedMetalRate>(`/metal-rates/${id}`),
  createMetalRate: (data: MetalRateInput) =>
    api.post<SerializedMetalRate>("/metal-rates", data),
  updateMetalRate: (id: string, data: { ratePerGram: string | number; source?: string | null }) =>
    api.put<SerializedMetalRate>(`/metal-rates/${id}`, data),
  deleteMetalRate: (id: string) =>
    api.delete<void>(`/metal-rates/${id}`),
};
