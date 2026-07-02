"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const result = await authClient.signIn.email(values);
    if (result.error) {
      toast.error(result.error.message || "Unable to sign in");
      return;
    }
    toast.success("Successfully authenticated");
    router.push("/dashboard");
    router.refresh();
  }

  const isLoading = form.formState.isSubmitting;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          admin_email
        </Label>
        <Input 
          id="email" 
          type="email" 
          autoComplete="email" 
          placeholder="root@local.dev" 
          disabled={isLoading}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring/25 focus-visible:border-border font-mono text-sm transition-all duration-200"
          aria-invalid={!!form.formState.errors.email} 
          {...form.register("email")} 
        />
        {form.formState.errors.email && <p className="text-[10px] font-mono text-rose-500">{form.formState.errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            access_key
          </Label>
          <Link href="/forgot-password" className="text-[10px] font-mono text-muted-foreground hover:text-foreground hover:underline transition-colors">
            recover_key()
          </Link>
        </div>
        <Input 
          id="password" 
          type="password" 
          autoComplete="current-password" 
          disabled={isLoading}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring/25 focus-visible:border-border font-mono text-sm transition-all duration-200"
          aria-invalid={!!form.formState.errors.password} 
          {...form.register("password")} 
        />
        {form.formState.errors.password && <p className="text-[10px] font-mono text-rose-500">{form.formState.errors.password.message}</p>}
      </div>
      <Button 
        type="submit" 
        size="lg" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 active:scale-[0.98] font-mono uppercase tracking-wider text-xs font-bold shadow-sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            AUTHORIZING...
          </span>
        ) : (
          "initialize_session()"
        )}
      </Button>
    </form>
  );
}
