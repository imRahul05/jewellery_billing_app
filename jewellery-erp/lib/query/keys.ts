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
    ledger: (tenantId: string, id: string) =>
      ["customers", tenantId, "ledger", id] as const,
  },
  suppliers: {
    all: (tenantId: string) => ["suppliers", tenantId] as const,
    list: (tenantId: string, search?: string) =>
      ["suppliers", tenantId, "list", search ?? ""] as const,
    detail: (tenantId: string, id: string) =>
      ["suppliers", tenantId, "detail", id] as const,
  },
  settings: {
    detail: (tenantId: string) => ["settings", tenantId] as const,
  },
  metalRates: {
    all: (tenantId: string) => ["metal-rates", tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) =>
      ["metal-rates", tenantId, "list", filters ?? {}] as const,
  },
  dashboard: {
    stats: (tenantId: string) => ["dashboard", tenantId, "stats"] as const,
  },
  notifications: {
    all: (tenantId: string) => ["notifications", tenantId] as const,
    list: (tenantId: string) => ["notifications", tenantId, "list"] as const,
  },
} as const;
