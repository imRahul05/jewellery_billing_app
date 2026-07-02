"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export interface AuthActionState {
  error?: string;
  success?: boolean;
}

export async function signUpWithEmail(
  _prevState: AuthActionState | null,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!email || !name || !password) {
    return { error: "Name, email, and password must be provided." };
  }

  const { error } = await auth.signUp.email({
    email,
    name,
    password,
  });

  if (error) {
    return { error: error.message || "Failed to create account." };
  }

  redirect("/dashboard");
}
