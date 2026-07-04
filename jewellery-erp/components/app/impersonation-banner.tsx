"use client";

import { useState } from "react";
import { adminApi } from "@/lib/api/admin.api";
import { Button } from "@/components/ui/button";
import { Eye, LogOut } from "lucide-react";
import { toast } from "sonner";

interface ImpersonationBannerProps {
  tenantName: string;
}

export function ImpersonationBanner({ tenantName }: ImpersonationBannerProps) {
  const [isStopping, setIsStopping] = useState(false);

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await adminApi.stopImpersonation();
      toast.success("Impersonation session stopped.");
      window.location.href = "/admin/businesses";
    } catch {
      toast.error("Failed to stop impersonation");
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="bg-amber-600 dark:bg-amber-950 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold tracking-wide shadow-md shrink-0 select-none">
      <div className="flex items-center gap-2">
        <Eye className="size-4 shrink-0 animate-pulse text-amber-100" />
        <span>
          ADMIN_SESSION: Impersonating <span className="underline decoration-wavy font-bold">{tenantName}</span> (ReadOnly / Write actions will log as Super Admin)
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={isStopping}
        onClick={handleStop}
        className="h-7 hover:bg-white/10 hover:text-white text-white border border-white/20 bg-transparent flex items-center gap-1.5 px-2.5 rounded-md"
      >
        <LogOut className="size-3" />
        {isStopping ? "Stopping..." : "Stop Session"}
      </Button>
    </div>
  );
}
