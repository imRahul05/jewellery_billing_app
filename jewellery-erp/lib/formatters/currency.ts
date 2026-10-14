/**
 * Formats a number into Indian Rupee currency format (e.g. ₹ 1,23,456.78)
 */
export function formatCurrency(amount: number, options: { includeSymbol?: boolean; decimals?: number } = {}): string {
  const { includeSymbol = true, decimals = 2 } = options;

  if (isNaN(amount) || !isFinite(amount)) {
    return includeSymbol ? "₹ 0.00" : "0.00";
  }

  const rounded = Math.abs(amount).toFixed(decimals);
  const [integerPart, decimalPart] = rounded.split(".");

  // Indian Numbering System formatting:
  // Last 3 digits together, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }

  const formattedInteger =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  const result = decimals > 0 && decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  const sign = amount < 0 ? "-" : "";

  return includeSymbol ? `${sign}₹ ${result}` : `${sign}${result}`;
}

export function formatGrams(grams: number, decimals: number = 3): string {
  if (isNaN(grams) || !isFinite(grams)) return "0.000 g";
  return `${grams.toFixed(decimals)} g`;
}

export function formatRatePer10g(rate: number): string {
  return `${formatCurrency(rate, { decimals: 0 })} / 10g`;
}
