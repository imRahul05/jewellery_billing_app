"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { signInWithEmail, signInAsDemo } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);
  const [demoState, demoFormAction, isDemoPending] = useActionState(signInAsDemo, null);

  return (
    <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
              {state.error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isPending || isDemoPending}>
            {isPending ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card/50 backdrop-blur-sm px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <form action={demoFormAction}>
          {demoState?.error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
              {demoState.error}
            </div>
          )}
          <Button type="submit" variant="secondary" className="w-full font-medium" disabled={isPending || isDemoPending}>
            {isDemoPending ? "Entering Demo..." : "Try Demo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
