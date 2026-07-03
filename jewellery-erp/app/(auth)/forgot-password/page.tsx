"use client";

import * as React from "react";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) {
      setError("Email address must be provided.");
      return;
    }

    setIsPending(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (response.error) {
        setError(response.error.message || "Failed to send reset link. Try again.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">Forgot Password</CardTitle>
        <CardDescription>
          Enter your email to receive a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500 border border-emerald-500/20 font-medium">
              We&apos;ve sent a password reset link to your email address. Please check your inbox.
            </div>
            <Button className="w-full" asChild>
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Sending Link..." : "Send Reset Link"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-6 py-4">
        <span className="text-xs text-muted-foreground">
          Remembered your password?
        </span>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
