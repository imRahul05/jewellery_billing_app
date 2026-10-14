import { GeneralCorporateClean } from "./GeneralCorporateClean";
import { GeneralMinimalMono } from "./GeneralMinimalMono";
import { GeneralBoldHeader } from "./GeneralBoldHeader";
import { GeneralClassicLedger } from "./GeneralClassicLedger";
import { GeneralModernGrid } from "./GeneralModernGrid";
import { GeneralFreelancerSimple } from "./GeneralFreelancerSimple";
import { GeneralTradeInvoice } from "./GeneralTradeInvoice";
import { GeneralServicePro } from "./GeneralServicePro";
import { GeneralTwoToneTax } from "./GeneralTwoToneTax";
import { GeneralCompactA5 } from "./GeneralCompactA5";

export {
  GeneralCorporateClean,
  GeneralMinimalMono,
  GeneralBoldHeader,
  GeneralClassicLedger,
  GeneralModernGrid,
  GeneralFreelancerSimple,
  GeneralTradeInvoice,
  GeneralServicePro,
  GeneralTwoToneTax,
  GeneralCompactA5,
};

export const GENERAL_TEMPLATE_COMPONENTS: Record<string, React.ComponentType<import("@/types/template.types").TemplateProps>> = {
  "general-corporate-clean": GeneralCorporateClean,
  "general-minimal-mono": GeneralMinimalMono,
  "general-bold-header": GeneralBoldHeader,
  "general-classic-ledger": GeneralClassicLedger,
  "general-modern-grid": GeneralModernGrid,
  "general-freelancer-simple": GeneralFreelancerSimple,
  "general-trade-invoice": GeneralTradeInvoice,
  "general-service-pro": GeneralServicePro,
  "general-two-tone-tax": GeneralTwoToneTax,
  "general-compact-a5": GeneralCompactA5,
};
