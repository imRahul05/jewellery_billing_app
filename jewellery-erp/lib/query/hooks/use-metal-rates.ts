"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { businessApi } from "@/lib/api/business.api";

export function useMetalRates(tenantId: string, filters?: { metalType?: string; rateDate?: string }) {
  return useQuery({
    queryKey: qk.metalRates.list(tenantId, filters),
    queryFn: async () => {
      const res = await businessApi.getMetalRates(filters);
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useCreateMetalRate(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof businessApi.createMetalRate>[0]) => {
      const res = await businessApi.createMetalRate(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.metalRates.all(tenantId) });
    },
  });
}
