"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2, Users } from "lucide-react";

export default function SettingsLandingPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure your jewellery enterprise settings, tax rules, staff roles, and access controls.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/settings/business" className="block group">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer shadow-sm border">
            <CardHeader className="flex flex-row items-center space-y-0 gap-4 pb-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Settings2 className="size-5" />
              </span>
              <div>
                <CardTitle className="group-hover:text-primary transition-colors text-lg">Business Configuration</CardTitle>
                <CardDescription>Enterprise profile, tax policies, and pricing.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Update enterprise legal profile, default GST rates, making charge modes, sequence numbers, and log daily gold/silver spot prices.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/users" className="block group">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer shadow-sm border">
            <CardHeader className="flex flex-row items-center space-y-0 gap-4 pb-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="size-5" />
              </span>
              <div>
                <CardTitle className="group-hover:text-primary transition-colors text-lg">Staff & Roles</CardTitle>
                <CardDescription>Manage staff members and security permissions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Invite team members, assign role-based access control, manage permissions, and track active staff directory status.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
