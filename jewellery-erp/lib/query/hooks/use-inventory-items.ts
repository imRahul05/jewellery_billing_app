"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { inventoryApi, InventoryItemInput } from "@/lib/api/inventory.api";
import axios from "axios";

export function useInventoryItems(
  tenantId: string,
  filters?: { search?: string; productId?: string; status?: string; location?: string }
) {
  return useQuery({
    queryKey: qk.inventory.list(tenantId, filters),
    queryFn: async () => {
      const res = await inventoryApi.getInventoryItems(filters);
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useInventoryItemDetail(tenantId: string, id: string) {
  return useQuery({
    queryKey: qk.inventory.item(tenantId, id),
    queryFn: async () => {
      const res = await inventoryApi.getInventoryItemById(id);
      return res.data;
    },
    enabled: Boolean(tenantId) && Boolean(id),
  });
}

export function useItemMovements(tenantId: string, id: string) {
  return useQuery({
    queryKey: ["inventory", tenantId, "item-movements", id],
    queryFn: async () => {
      const res = await inventoryApi.getItemMovements(id);
      return res.data;
    },
    enabled: Boolean(tenantId) && Boolean(id),
  });
}

export function useCreateInventoryItem(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InventoryItemInput) => {
      const res = await inventoryApi.createInventoryItem(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.inventory.all(tenantId) });
    },
  });
}

export function useUploadAsset() {
  return useMutation({
    mutationFn: async ({ file, purpose }: { file: File; purpose: string }) => {
      // 1. Get presigned upload configuration from REST API
      const presigned = await inventoryApi.getPresignedUploadUrl({
        fileName: file.name,
        contentType: file.type,
        purpose,
      });

      const { uploadUrl, assetId, publicUrl } = presigned.data;

      // 2. PUT the file binary payload directly to the URL
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      return { assetId, publicUrl };
    },
  });
}
