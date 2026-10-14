import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors select-none",
  {
    variants: {
      variant: {
        default: "border-primary-border bg-primary-muted text-primary-text font-semibold",
        secondary: "border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        destructive: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
        outline: "border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300",
        gold: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-serif",
        silver: "border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
        blue: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
