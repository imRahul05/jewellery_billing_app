/**
 * Indian money & weight formatting.
 *
 * Money is stored as `Decimal(14,2)` rupees (rupees.paise, e.g. 121.12) — these
 * helpers take a RUPEE value (not paise) and render Indian (lakh/crore) grouping.
 * See base-setup design §2 (overrides doc 07's paise-integer note).
 */

type Num = number | string | { toNumber(): number };

const toNumber = (v: Num): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (v && typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
};

/** `formatINR(121.12)` → `₹121.12`; `formatINR(121212.5)` → `₹1,21,212.50`. */
export function formatINR(rupees: Num): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(rupees));
}

/** Bare Indian-grouped number, no symbol: `formatIndianNumber(1234567)` → `12,34,567`. */
export function formatIndianNumber(value: Num): string {
  return new Intl.NumberFormat("en-IN").format(toNumber(value));
}

/** Grams with 3dp + unit: `formatWeight(12.5)` → `12.500 g`. */
export function formatWeight(grams: Num): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(toNumber(grams));
  return `${formatted} g`;
}

/**
 * Compact rupee display for dashboards.
 * `formatINRWords(120000)` → `₹1.20 L`; `formatINRWords(34000000)` → `₹3.40 Cr`.
 * Below ₹1 lakh falls back to full `formatINR`.
 */
export function formatINRWords(rupees: Num): string {
  const r = toNumber(rupees);
  const abs = Math.abs(r);
  const sign = r < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  return formatINR(r);
}
