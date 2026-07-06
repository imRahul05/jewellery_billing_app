"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { signUpWithEmail } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  return (
    <>
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Sign Up Disabled</h2>
        <p className="text-muted-foreground text-sm">
          New account creation is currently disabled.
        </p>
        <Button variant="outline" asChild>
          <Link href="/login">Return to Sign In</Link>
        </Button>
      </div>
      {/*
      <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight">Create Account</CardTitle>
          <CardDescription>
            Sign up for a new account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                required
                disabled={isPending}
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-6 py-4">
          <span className="text-xs text-muted-foreground">
            Already have an account?
          </span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
      */}
    </>
  );
}
