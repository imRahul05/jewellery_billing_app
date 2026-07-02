"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { customerApi, CustomerInput } from "@/lib/api/customer.api";

export function useCustomers(tenantId: string, filters?: { search?: string }) {
  return useQuery({
    queryKey: qk.customers.list(tenantId, filters?.search),
    queryFn: async () => {
      const res = await customerApi.getCustomers(filters);
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useCustomerDetail(tenantId: string, id: string) {
  return useQuery({
    queryKey: qk.customers.detail(tenantId, id),
    queryFn: async () => {
      const res = await customerApi.getCustomerById(id);
      return res.data;
    },
    enabled: Boolean(tenantId) && Boolean(id),
  });
}

export function useCustomerLedger(tenantId: string, id: string) {
  return useQuery({
    queryKey: qk.customers.ledger(tenantId, id),
    queryFn: async () => {
      const res = await customerApi.getCustomerLedger(id);
      return res.data;
    },
    enabled: Boolean(tenantId) && Boolean(id),
  });
}

export function useCreateCustomer(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CustomerInput) => {
      const res = await customerApi.createCustomer(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.customers.all(tenantId) });
    },
  });
}

export function useUpdateCustomer(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CustomerInput>) => {
      const res = await customerApi.updateCustomer(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.customers.detail(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: qk.customers.all(tenantId) });
    },
  });
}

export function useDeleteCustomer(tenantId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await customerApi.deleteCustomer(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.customers.all(tenantId) });
    },
  });
}
