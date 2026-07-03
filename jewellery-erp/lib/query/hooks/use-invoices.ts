"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { invoiceApi, InvoiceCreateInput, PaymentCreateInput, ReturnInvoiceInput } from "@/lib/api/invoices.api";
import { useRouter } from "next/navigation";

export function useInvoices(
  tenantId: string,
  filters?: { customerId?: string; status?: string; type?: string; limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: qk.invoices.list(tenantId, filters),
    queryFn: async () => {
      const res = await invoiceApi.getInvoices(filters);
      return res.data;
    },
    enabled: Boolean(tenantId),
  });
}

export function useInvoiceDetail(tenantId: string, id: string) {
  return useQuery({
    queryKey: qk.invoices.detail(tenantId, id),
    queryFn: async () => {
      const res = await invoiceApi.getInvoiceById(id);
      return res.data;
    },
    enabled: Boolean(tenantId) && Boolean(id),
  });
}

export function useCreateInvoice(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: InvoiceCreateInput) => {
      const res = await invoiceApi.createInvoice(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invoices.all(tenantId) });
      router.refresh();
    },
  });
}

export function useFinalizeInvoice(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await invoiceApi.finalizeInvoice(id);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: qk.invoices.detail(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: qk.invoices.all(tenantId) });
      router.refresh();
    },
  });
}

export function useCancelInvoice(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await invoiceApi.cancelInvoice(id, reason);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: qk.invoices.detail(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: qk.invoices.all(tenantId) });
      router.refresh();
    },
  });
}

export function useRecordPayment(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PaymentCreateInput }) => {
      const res = await invoiceApi.createPayment(id, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: qk.invoices.detail(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: qk.invoices.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: qk.customers.all(tenantId) });
      router.refresh();
    },
  });
}

export function useProcessReturn(tenantId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReturnInvoiceInput }) => {
      const res = await invoiceApi.createReturn(id, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: qk.invoices.detail(tenantId, id) });
      queryClient.invalidateQueries({ queryKey: qk.invoices.all(tenantId) });
      router.refresh();
    },
  });
}

