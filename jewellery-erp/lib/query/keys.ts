/**
 * Centralized, typed query-key factory. Never build query keys as ad-hoc
 * strings/arrays in components — invalidation must be driven from one place.
 *
 * Usage:
 *   useQuery({ queryKey: qk.invoices.list(tenantId), ... })
 *   queryClient.invalidateQueries({ queryKey: qk.invoices.all(tenantId) })
 */
export const qk = {
  invoices: {
    all: (tenantId: string) => ["invoices", tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ["invoices", tenantId, "list", filters ?? {}] as const,
    detail: (tenantId: string, id: string) =>
      ["invoices", tenantId, "detail", id] as const,
  },
  inventory: {
    all: (tenantId: string) => ["inventory", tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ["inventory", tenantId, "list", filters ?? {}] as const,
    item: (tenantId: string, id: string) =>
      ["inventory", tenantId, "item", id] as const,
  },
  customers: {
    all: (tenantId: string) => ["customers", tenantId] as const,
    list: (tenantId: string, search?: string) =>
      ["customers", tenantId, "list", search ?? ""] as const,
    detail: (tenantId: string, id: string) =>
      ["customers", tenantId, "detail", id] as const,
  },
  dashboard: {
    stats: (tenantId: string) => ["dashboard", tenantId, "stats"] as const,
  },
} as const;
