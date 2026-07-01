import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/app/theme-toggle";

export default function LoginPage() {
  return (
    <Card className="bg-card border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-lg overflow-hidden transition-all duration-300">
      <CardHeader className="space-y-2 pb-6 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-muted-foreground/60" />
            AUTHORIZED_ACCESS_ONLY
          </span>
          <ThemeToggle />
        </div>
        <CardTitle className="text-sm font-mono font-bold tracking-tight text-card-foreground">
          SIGN_IN_REQ
        </CardTitle>
        <CardDescription className="text-xs font-mono text-muted-foreground">
          Enter admin credentials to authorize console session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <LoginForm />
        <div className="text-center font-mono text-[10px] text-muted-foreground">
          Need a new workspace?{" "}
          <Link href="/sign-up" className="text-foreground hover:underline hover:opacity-85 transition-colors">
            register_new_admin()
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
