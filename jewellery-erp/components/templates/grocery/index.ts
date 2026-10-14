import { GroceryKiranaClassic } from "./GroceryKiranaClassic";
import { GroceryFreshMart } from "./GroceryFreshMart";
import { GroceryThermal80mm } from "./GroceryThermal80mm";
import { GroceryThermal58mm } from "./GroceryThermal58mm";
import { GroceryWholesaleLedger } from "./GroceryWholesaleLedger";
import { GroceryDailyNeeds } from "./GroceryDailyNeeds";
import { GroceryFarmFresh } from "./GroceryFarmFresh";
import { GroceryMiniMartCompact } from "./GroceryMiniMartCompact";
import { GroceryBazaarBold } from "./GroceryBazaarBold";
import { GrocerySuperSaver } from "./GrocerySuperSaver";

export {
  GroceryKiranaClassic,
  GroceryFreshMart,
  GroceryThermal80mm,
  GroceryThermal58mm,
  GroceryWholesaleLedger,
  GroceryDailyNeeds,
  GroceryFarmFresh,
  GroceryMiniMartCompact,
  GroceryBazaarBold,
  GrocerySuperSaver,
};

export const GROCERY_TEMPLATE_COMPONENTS: Record<string, React.ComponentType<import("@/types/template.types").TemplateProps>> = {
  "grocery-kirana-classic": GroceryKiranaClassic,
  "grocery-fresh-mart": GroceryFreshMart,
  "grocery-thermal-80mm": GroceryThermal80mm,
  "grocery-thermal-58mm": GroceryThermal58mm,
  "grocery-wholesale-ledger": GroceryWholesaleLedger,
  "grocery-daily-needs": GroceryDailyNeeds,
  "grocery-farm-fresh": GroceryFarmFresh,
  "grocery-mini-mart-compact": GroceryMiniMartCompact,
  "grocery-bazaar-bold": GroceryBazaarBold,
  "grocery-super-saver": GrocerySuperSaver,
};
