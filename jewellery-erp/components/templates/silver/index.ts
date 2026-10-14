import { SilverlineClassic } from "./SilverlineClassic";
import { SilverFiligreeFrame } from "./SilverFiligreeFrame";
import { SilverModernMint } from "./SilverModernMint";
import { SilverLedgerPure } from "./SilverLedgerPure";
import { SilverTempleSilver } from "./SilverTempleSilver";
import { SilverRusticArtisan } from "./SilverRusticArtisan";
import { SilverCoinBar } from "./SilverCoinBar";
import { SilverMinimalSterling } from "./SilverMinimalSterling";
import { SilverBoutiqueSilver } from "./SilverBoutiqueSilver";
import { SilverCompactCounter } from "./SilverCompactCounter";

export {
  SilverlineClassic,
  SilverFiligreeFrame,
  SilverModernMint,
  SilverLedgerPure,
  SilverTempleSilver,
  SilverRusticArtisan,
  SilverCoinBar,
  SilverMinimalSterling,
  SilverBoutiqueSilver,
  SilverCompactCounter,
};

export const SILVER_TEMPLATE_COMPONENTS: Record<string, React.ComponentType<import("@/types/template.types").TemplateProps>> = {
  "silver-silverline-classic": SilverlineClassic,
  "silver-filigree-frame": SilverFiligreeFrame,
  "silver-modern-mint": SilverModernMint,
  "silver-ledger-pure": SilverLedgerPure,
  "silver-temple-silver": SilverTempleSilver,
  "silver-rustic-artisan": SilverRusticArtisan,
  "silver-coin-bar": SilverCoinBar,
  "silver-minimal-sterling": SilverMinimalSterling,
  "silver-boutique-silver": SilverBoutiqueSilver,
  "silver-compact-counter": SilverCompactCounter,
};
