import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SelectTenantPage() {
  return <Card className="shadow-sm"><CardHeader><CardTitle>Business setup required</CardTitle><CardDescription>Your identity is ready, but no single active business membership could be resolved.</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Business onboarding and multi-business selection are scheduled for a later phase. Ask an administrator to create or activate your membership.</p><Button asChild variant="outline" className="w-full"><Link href="/login">Return to sign in</Link></Button></CardContent></Card>;
}
