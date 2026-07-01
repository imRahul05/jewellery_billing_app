import { create } from "zustand";

/**
 * Client-side MIRROR of the active tenant for convenience in client components.
 *
 * The SERVER SESSION is the source of truth (see lib/auth/session.ts).
 * This store is hydrated once from the server-resolved session in the (app)
 * layout and read-only thereafter — never treat it as authoritative for
 * access control, and never write server data here.
 */
interface TenantState {
  tenantId: string | null;
  tenantName: string | null;
  setTenant: (tenant: { id: string; name: string } | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenantId: null,
  tenantName: null,
  setTenant: (tenant) =>
    set({
      tenantId: tenant?.id ?? null,
      tenantName: tenant?.name ?? null,
    }),
}));
