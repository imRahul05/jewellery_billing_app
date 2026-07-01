import { AlertTriangle, IndianRupee, PackageCheck, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINRWords } from "@/lib/format";
const STATS = [
  { title: "Today's Sales", value: formatINRWords(0), note: "No invoices yet", icon: IndianRupee },
  { title: "Outstanding", value: formatINRWords(0), note: "Customer receivables", icon: WalletCards },
  { title: "Stock Value", value: formatINRWords(0), note: "Current inventory", icon: PackageCheck },
  { title: "Low Stock", value: "0", note: "Items need attention", icon: AlertTriangle },
] as const;
export default function DashboardPage() {
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Your business at a glance.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business summary">{STATS.map(({ title, value, note, icon: Icon }) => <Card key={title} className="shadow-sm"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle><Icon className="size-4 text-primary" /></CardHeader><CardContent><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></CardContent></Card>)}</section><Card className="border-dashed bg-background/60"><CardContent className="py-10 text-center"><h2 className="font-medium">Foundation ready</h2><p className="mt-1 text-sm text-muted-foreground">Billing, inventory, and reporting workflows will populate this workspace in later phases.</p></CardContent></Card></div>;
}
