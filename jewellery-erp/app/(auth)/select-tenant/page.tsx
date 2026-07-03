import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserByAuthIdQuery } from "@/lib/db/queries/user";
import { getUserMembershipsQuery } from "@/lib/db/queries/members";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onboardBusinessAction, selectTenantAction } from "./actions";

export default async function SelectTenantPage() {
  // Neon Auth reads request cookies internally, so defer this page to request time.
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Find app user projection
  const user = await getUserByAuthIdQuery(session.user.id);

  const memberships = user
    ? await getUserMembershipsQuery(user.id)
    : [];

  // 1. Onboarding Form (User has no profile yet or has 0 active memberships)
  if (!user || memberships.length === 0) {
    async function handleOnboardSubmit(formData: FormData) {
      "use server";
      const res = await onboardBusinessAction(formData);
      if (res.success) {
        redirect("/dashboard");
      }
    }

    return (
      <Card className="shadow-sm border max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Welcome to Jewellery ERP</CardTitle>
          <CardDescription>
            Let&apos;s set up your business workspace to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleOnboardSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your Full Name</Label>
              <Input
                id="ownerName"
                name="ownerName"
                type="text"
                placeholder="Enter your name"
                defaultValue={session.user.name || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="e.g. Shree Laxmi Jewellers"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Create Business & Onboard
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // 2. Business Selection Picker (User is active in >0 businesses)
  async function handleSelectTenant(formData: FormData) {
    "use server";
    const tenantId = formData.get("tenantId") as string;
    const res = await selectTenantAction(tenantId);
    if (res.success) {
      redirect("/dashboard");
    }
  }

  return (
    <Card className="shadow-sm border max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Select Business</CardTitle>
        <CardDescription>
          Pick the business workspace you want to log into.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {memberships.map((membership) => (
            <form key={membership.tenant.id} action={handleSelectTenant}>
              <input type="hidden" name="tenantId" value={membership.tenant.id} />
              <Button
                type="submit"
                variant="outline"
                className="w-full justify-between hover:bg-primary/5 hover:text-primary transition-colors text-left font-medium"
              >
                <span>{membership.tenant.name}</span>
                <span className="text-xs text-muted-foreground">Select →</span>
              </Button>
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
