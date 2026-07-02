"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { inventoryApi, ProductInput } from "@/lib/api/inventory.api";

export function useCategories(tenantId: string) {
  return useQuery({
    queryKey: ["categories", tenantId],
    queryFn: async () => {
      const res = await inventoryApi.getCategories();
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useCreateCategory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof inventoryApi.createCategory>[0]) => {
      const res = await inventoryApi.createCategory(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", tenantId] });
    },
  });
}

export function useProducts(
  tenantId: string,
  filters?: { search?: string; categoryId?: string; metalType?: string }
) {
  return useQuery({
    queryKey: qk.inventory.list(tenantId, filters),
    queryFn: async () => {
      const res = await inventoryApi.getProducts(filters);
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useCreateProduct(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const res = await inventoryApi.createProduct(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.inventory.all(tenantId) });
    },
  });
}
