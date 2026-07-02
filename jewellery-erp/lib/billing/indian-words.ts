import { Prisma } from "@prisma/client";

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertBelowThousand(num: number): string {
  if (num === 0) return "";
  if (num < 20) return ONES[num];
  const ten = Math.floor(num / 10);
  const one = num % 10;
  if (num < 100) {
    return TENS[ten] + (one !== 0 ? "-" + ONES[one] : "");
  }
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  return ONES[hundred] + " Hundred" + (remainder !== 0 ? " " + convertBelowThousand(remainder) : "");
}

/**
 * Converts a number to Indian numbering words system (Lakhs, Crores).
 */
export function toIndianWords(amount: Prisma.Decimal | number | string): string {
  const dec = new Prisma.Decimal(amount);
  const absolute = dec.abs();
  
  // Split into integer and fractional parts
  const integerPart = Math.floor(absolute.toNumber());
  const fractionalPart = absolute.minus(integerPart).mul(100).round().toNumber();

  if (integerPart === 0 && fractionalPart === 0) {
    return "Rupees Zero Only";
  }

  let words = "";

  if (integerPart > 0) {
    let temp = integerPart;
    const parts: string[] = [];

    // Crore (1,00,00,000)
    if (temp >= 10000000) {
      const crore = Math.floor(temp / 10000000);
      parts.push(toIndianWordsHelper(crore) + " Crore");
      temp %= 10000000;
    }

    // Lakh (1,00,000)
    if (temp >= 100000) {
      const lakh = Math.floor(temp / 100000);
      parts.push(convertBelowThousand(lakh) + " Lakh");
      temp %= 100000;
    }

    // Thousand (1,000)
    if (temp >= 1000) {
      const thousand = Math.floor(temp / 1000);
      parts.push(convertBelowThousand(thousand) + " Thousand");
      temp %= 1000;
    }

    // Below 1000
    if (temp > 0) {
      parts.push(convertBelowThousand(temp));
    }

    words = "Rupees " + parts.filter(p => p !== "").join(" ");
  }

  if (fractionalPart > 0) {
    const paiseWords = convertBelowThousand(fractionalPart) + " Paise";
    if (words !== "") {
      words += " and " + paiseWords;
    } else {
      words = paiseWords;
    }
  }

  return words + " Only";
}

function toIndianWordsHelper(num: number): string {
  if (num === 0) return "";
  let temp = num;
  const parts: string[] = [];

  if (temp >= 10000000) {
    const crore = Math.floor(temp / 10000000);
    parts.push(toIndianWordsHelper(crore) + " Crore");
    temp %= 10000000;
  }
  if (temp >= 100000) {
    const lakh = Math.floor(temp / 100000);
    parts.push(convertBelowThousand(lakh) + " Lakh");
    temp %= 100000;
  }
  if (temp >= 1000) {
    const thousand = Math.floor(temp / 1000);
    parts.push(convertBelowThousand(thousand) + " Thousand");
    temp %= 1000;
  }
  if (temp > 0) {
    parts.push(convertBelowThousand(temp));
  }
  return parts.filter(p => p !== "").join(" ");
}
