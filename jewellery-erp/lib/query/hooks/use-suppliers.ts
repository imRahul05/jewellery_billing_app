"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { supplierApi, SupplierInput } from "@/lib/api/supplier.api";
import { useRouter } from "next/navigation";

export function useSuppliers(tenantId: string, filters?: { search?: string }) {
  return useQuery({
    queryKey: qk.suppliers.list(tenantId, filters?.search),
    queryFn: async () => {
      const res = await supplierApi.getSuppliers(filters);
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useSupplierDetail(tenantId: string, id: string) {
  return useQuery({
    queryKey: qk.suppliers.detail(tenantId, id),
    queryFn: async () => {
      const res = await supplierApi.getSupplierById(id);
      return res.data;
    },
    enabled: Boolean(tenantId) && Boolean(id),
  });
}

export function useCreateSupplier(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: SupplierInput) => {
      const res = await supplierApi.createSupplier(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.suppliers.all(tenantId) });
      router.refresh();
    },
  });
}

export function useUpdateSupplier(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: Partial<SupplierInput>) => {
      const res = await supplierApi.updateSupplier(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.suppliers.detail(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: qk.suppliers.all(tenantId) });
      router.refresh();
    },
  });
}

export function useDeleteSupplier(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      const res = await supplierApi.deleteSupplier(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.suppliers.all(tenantId) });
      router.refresh();
    },
  });
}

