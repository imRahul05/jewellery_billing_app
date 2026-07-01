import { create } from "zustand";

/**
 * In-progress POS bill draft (UI-only). This is the classic "ephemeral UI
 * state that is NOT yet server data" case: lines the cashier is assembling
 * before the invoice is persisted. On submit, the billing engine (later phase)
 * turns this into a real Invoice via a mutation, and this draft is cleared.
 *
 * Stub shape now — full line model arrives with the billing engine (doc 06/09).
 */
export interface BillDraftLine {
  /** Client-only id for list keys; not a DB id. */
  key: string;
  productId?: string;
  description: string;
  netWeight: number;
  ratePerGram: number;
  makingCharge: number;
  quantity: number;
}

interface BillDraftState {
  customerId: string | null;
  lines: BillDraftLine[];
  setCustomer: (customerId: string | null) => void;
  addLine: (line: BillDraftLine) => void;
  updateLine: (key: string, patch: Partial<BillDraftLine>) => void;
  removeLine: (key: string) => void;
  clear: () => void;
}

export const useBillDraftStore = create<BillDraftState>((set) => ({
  customerId: null,
  lines: [],
  setCustomer: (customerId) => set({ customerId }),
  addLine: (line) => set((s) => ({ lines: [...s.lines, line] })),
  updateLine: (key, patch) =>
    set((s) => ({
      lines: s.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    })),
  removeLine: (key) =>
    set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
  clear: () => set({ customerId: null, lines: [] }),
}));
