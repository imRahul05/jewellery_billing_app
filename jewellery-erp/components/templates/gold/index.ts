import { GoldClassicJewellers } from "./GoldClassicJewellers";
import { GoldRoyalZari } from "./GoldRoyalZari";
import { GoldMinimalKarat } from "./GoldMinimalKarat";
import { GoldHallmarkLedger } from "./GoldHallmarkLedger";
import { GoldVintageOrnate } from "./GoldVintageOrnate";
import { GoldModernBoutique } from "./GoldModernBoutique";
import { GoldTempleGold } from "./GoldTempleGold";
import { GoldBridalCollection } from "./GoldBridalCollection";
import { GoldBullionSimple } from "./GoldBullionSimple";
import { GoldCompactCounter } from "./GoldCompactCounter";

export {
  GoldClassicJewellers,
  GoldRoyalZari,
  GoldMinimalKarat,
  GoldHallmarkLedger,
  GoldVintageOrnate,
  GoldModernBoutique,
  GoldTempleGold,
  GoldBridalCollection,
  GoldBullionSimple,
  GoldCompactCounter,
};

export const GOLD_TEMPLATE_COMPONENTS: Record<string, React.ComponentType<import("@/types/template.types").TemplateProps>> = {
  "gold-classic-jewellers": GoldClassicJewellers,
  "gold-royal-zari": GoldRoyalZari,
  "gold-minimal-karat": GoldMinimalKarat,
  "gold-hallmark-ledger": GoldHallmarkLedger,
  "gold-vintage-ornate": GoldVintageOrnate,
  "gold-modern-boutique": GoldModernBoutique,
  "gold-temple-gold": GoldTempleGold,
  "gold-bridal-collection": GoldBridalCollection,
  "gold-bullion-simple": GoldBullionSimple,
  "gold-compact-counter": GoldCompactCounter,
};
