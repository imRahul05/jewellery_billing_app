import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { acceptInvite } from "@/app/(app)/settings/users/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptPage({ params }: PageProps) {
  const { token } = await params;

  // Resolve invitation details
  const invitation = await prisma.invitation.findFirst({
    where: { token, status: "pending" },
    include: {
      tenant: true,
      role: true,
    },
  });

  if (!invitation) {
    return (
      <Card className="shadow-sm border max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid or has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please ask the administrator who invited you to send a new invitation link.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (new Date() > invitation.expiresAt) {
    return (
      <Card className="shadow-sm border max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle className="text-destructive">Invitation Expired</CardTitle>
          <CardDescription>This invitation link has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Invitations expire 7 days after being issued. Please ask the administrator for a new invite.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle invite accept form action
  async function handleAccept() {
    "use server";
    const res = await acceptInvite(token);
    if (res.success) {
      redirect("/dashboard");
    }
  }

  return (
    <Card className="shadow-sm border max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Invitation Received</CardTitle>
        <CardDescription>
          You have been invited to join a business.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/30 p-4 border space-y-2 text-sm">
          <div>
            <span className="font-semibold text-muted-foreground">Business: </span>
            <span className="font-semibold text-foreground">{invitation.tenant.name}</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground">Assigned Role: </span>
            <span className="font-semibold text-foreground">{invitation.role.name}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          By accepting this invitation, your user account will be mapped to this business.
        </p>

        <form action={handleAccept}>
          <Button type="submit" className="w-full">
            Accept Invitation & Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
