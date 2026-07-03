"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { inventoryApi, StockAdjustmentInput } from "@/lib/api/inventory.api";
import { useRouter } from "next/navigation";

export function useCreateAdjustment(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: StockAdjustmentInput) => {
      const res = await inventoryApi.postStockAdjustment(data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific item and listings
      queryClient.invalidateQueries({ queryKey: qk.inventory.item(tenantId, variables.inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: qk.inventory.all(tenantId) });
      // Invalidate movements
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId, "item-movements", variables.inventoryItemId] });
      router.refresh();
    },
  });
}

export function useCreateTransfer(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: { inventoryItemId: string; toLocation: string }) => {
      const res = await inventoryApi.postStockTransfer(data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.inventory.item(tenantId, variables.inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: qk.inventory.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId, "item-movements", variables.inventoryItemId] });
      router.refresh();
    },
  });
}

export function useReceiveTransfer(tenantId: string, inventoryItemId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (transferId: string) => {
      const res = await inventoryApi.receiveStockTransfer(transferId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.inventory.item(tenantId, inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: qk.inventory.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId, "item-movements", inventoryItemId] });
      router.refresh();
    },
  });
}

