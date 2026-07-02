import Link from "next/link";
import { Terminal } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12 md:py-20 text-foreground transition-colors duration-300">
      {/* Muted Slate Grid Pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(100,116,139,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      
      <div className="w-full max-w-[400px] space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="group flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
            <span className="flex size-8 items-center justify-center rounded bg-card border border-border text-muted-foreground transition-colors">
              <Terminal className="size-4" />
            </span>
            <span>
              JEWELLERY_ERP // SYS_ADMIN
            </span>
          </Link>
        </div>
        
        {children}
        
        <div className="flex justify-center items-center gap-3 text-[10px] font-mono text-muted-foreground/60">
          <span>ENV: DEVELOPMENT</span>
          <span>•</span>
          <span>STATUS: ONLINE</span>
        </div>
      </div>
    </main>
  );
}
