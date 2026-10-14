export type ThemeMode = "light" | "dark" | "system";

export type ColorPalette =
  | "amber"
  | "emerald"
  | "blue"
  | "violet"
  | "monochrome"
  | "rose";

export type FontStyle = "sans" | "serif" | "mono";

export interface PaletteOption {
  id: ColorPalette;
  name: string;
  description: string;
  primaryColor: string;
  accentClass: string;
  badgeClass: string;
  borderClass: string;
  bgGlowClass: string;
}

export interface FontOption {
  id: FontStyle;
  name: string;
  fontFamily: string;
  description: string;
  previewText: string;
}

export const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: "amber",
    name: "Royal Amber / Gold",
    description: "Warm gold & amber hues, perfect for jewellery & luxury billing",
    primaryColor: "#f59e0b",
    accentClass: "text-amber-500 dark:text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
    borderClass: "border-amber-500/30",
    bgGlowClass: "from-amber-500/10",
  },
  {
    id: "emerald",
    name: "Fresh Emerald / Green",
    description: "Crisp natural green, ideal for groceries & kirana stores",
    primaryColor: "#10b981",
    accentClass: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    borderClass: "border-emerald-500/30",
    bgGlowClass: "from-emerald-500/10",
  },
  {
    id: "blue",
    name: "Corporate Sapphire",
    description: "Professional blue accent for IT, trade & corporate enterprises",
    primaryColor: "#3b82f6",
    accentClass: "text-blue-600 dark:text-blue-400",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    borderClass: "border-blue-500/30",
    bgGlowClass: "from-blue-500/10",
  },
  {
    id: "violet",
    name: "Studio Violet",
    description: "Vibrant royal purple for modern boutiques and design studios",
    primaryColor: "#8b5cf6",
    accentClass: "text-violet-600 dark:text-violet-400",
    badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
    borderClass: "border-violet-500/30",
    bgGlowClass: "from-violet-500/10",
  },
  {
    id: "rose",
    name: "Ruby Rose",
    description: "High-contrast luxury rose for festive & bridal commerce",
    primaryColor: "#f43f5e",
    accentClass: "text-rose-600 dark:text-rose-400",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    borderClass: "border-rose-500/30",
    bgGlowClass: "from-rose-500/10",
  },
  {
    id: "monochrome",
    name: "Monochrome / Noir",
    description: "Pure black, slate and clean stark white with zero distraction",
    primaryColor: "#71717a",
    accentClass: "text-neutral-900 dark:text-neutral-100",
    badgeClass: "bg-neutral-500/10 text-neutral-800 dark:text-neutral-200 border-neutral-500/20",
    borderClass: "border-neutral-500/30",
    bgGlowClass: "from-neutral-500/10",
  },
];

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "sans",
    name: "Modern Sans (Inter / Geist)",
    fontFamily: "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
    description: "Clean, balanced, modern user interface typography",
    previewText: "₹ 1,24,500.00 — Tax Invoice",
  },
  {
    id: "serif",
    name: "Heritage Serif (Classic Luxury)",
    fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
    description: "Traditional, elegant craftsmanship style typography",
    previewText: "₹ 1,24,500.00 — Tax Invoice",
  },
  {
    id: "mono",
    name: "Technical Mono (POS Terminal)",
    fontFamily: "var(--font-geist-mono), ui-monospace, Menlo, monospace",
    description: "Precision tabular numeric monospace typography",
    previewText: "₹ 1,24,500.00 — Tax Invoice",
  },
];
