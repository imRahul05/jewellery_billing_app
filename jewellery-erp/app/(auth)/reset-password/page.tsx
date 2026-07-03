"use client";

import * as React from "react";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Password and confirmation password must be provided.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsPending(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (response.error) {
        setError(response.error.message || "Failed to reset password. The link may have expired.");
      } else {
        setSuccess(true);
        toast.success("Password reset successfully. Redirecting to sign in...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsPending(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 font-medium">
          Missing or invalid reset token. If you followed a link, it might be incomplete. Please request a new link.
        </div>
        <Button className="w-full" asChild>
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {success ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500 border border-emerald-500/20 font-medium">
            Password has been successfully updated. Redirecting you to sign in...
          </div>
          <Button className="w-full" asChild>
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
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
            {isPending ? "Resetting Password..." : "Reset Password"}
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Card className="shadow-lg border bg-card/50 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">Reset Password</CardTitle>
        <CardDescription>
          Enter your new password to update your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense
          fallback={
            <div className="flex justify-center py-4 text-xs text-muted-foreground font-mono">
              LOADING_RESET_CONTEXT...
            </div>
          }
        >
          <ResetPasswordFormContent />
        </Suspense>
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
