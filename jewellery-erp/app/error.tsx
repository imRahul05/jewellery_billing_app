"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="flex min-h-svh items-center justify-center p-6"><div className="max-w-md text-center"><AlertCircle className="mx-auto size-10 text-destructive" /><h1 className="mt-4 text-xl font-semibold">Something went wrong</h1><p className="mt-2 text-sm text-muted-foreground">The request could not be completed. Retry, or contact support if the problem continues.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></main>;
}
