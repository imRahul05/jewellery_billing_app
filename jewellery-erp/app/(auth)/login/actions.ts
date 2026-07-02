"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export interface AuthActionState {
  error?: string;
  success?: boolean;
}

export async function signInWithEmail(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password must be provided." };
  }

  const { error } = await auth.signIn.email({
    email,
    password,
  });

  if (error) {
    return { error: error.message || "Failed to sign in. Try again." };
  }

  redirect("/dashboard");
}
