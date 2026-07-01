import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="flex min-h-svh items-center justify-center p-6 text-center"><div><p className="text-sm font-medium text-primary">404</p><h1 className="mt-2 text-2xl font-semibold">Page not found</h1><p className="mt-2 text-sm text-muted-foreground">The page may have moved or you may not have access.</p><Button asChild className="mt-6"><Link href="/dashboard">Return to dashboard</Link></Button></div></main>;
}
