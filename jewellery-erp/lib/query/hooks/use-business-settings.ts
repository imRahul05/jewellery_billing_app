"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { businessApi } from "@/lib/api/business.api";

export function useBusinessSettings(tenantId: string) {
  return useQuery({
    queryKey: qk.settings.detail(tenantId),
    queryFn: async () => {
      const res = await businessApi.getSettings();
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useUpdateBusinessSettings(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof businessApi.updateSettings>[0]) => {
      const res = await businessApi.updateSettings(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.settings.detail(tenantId) });
    },
  });
}
