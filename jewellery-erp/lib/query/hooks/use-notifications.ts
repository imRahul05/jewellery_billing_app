"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { businessApi } from "@/lib/api/business.api";

export function useNotifications(tenantId: string) {
  return useQuery({
    queryKey: qk.notifications.list(tenantId),
    queryFn: async () => {
      const res = await businessApi.getNotifications();
      return res.data;
    },
    enabled: Boolean(tenantId),
    refetchInterval: 15000, // Poll notifications every 15s for real-time feel
  });
}

export function useMarkNotificationRead(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await businessApi.markNotificationRead(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list(tenantId) });
    },
  });
}

export function useMarkAllNotificationsRead(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await businessApi.markAllNotificationsRead();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.list(tenantId) });
    },
  });
}
