"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  businessName: z.string().trim().min(2, "Enter your business name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", businessName: "", email: "", password: "" },
  });

  async function onSubmit({ name, email, password }: SignUpValues) {
    const result = await authClient.signUp.email({ name, email, password });
    if (result.error) {
      toast.error(result.error.message || "Unable to create your account");
      return;
    }
    toast.success("Account created. Continue with business setup.");
    router.push("/select-tenant");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="name" label="Full name" error={form.formState.errors.name?.message}>
          <Input id="name" autoComplete="name" {...form.register("name")} />
        </FormField>
        <FormField id="businessName" label="Business name" error={form.formState.errors.businessName?.message}>
          <Input id="businessName" autoComplete="organization" {...form.register("businessName")} />
        </FormField>
      </div>
      <FormField id="email" label="Email address" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
      </FormField>
      <FormField id="new-password" label="Password" error={form.formState.errors.password?.message}>
        <Input id="new-password" type="password" autoComplete="new-password" {...form.register("password")} />
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">Business provisioning follows after identity creation; no tenant data is trusted from the browser.</p>
    </form>
  );
}

function FormField({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}
