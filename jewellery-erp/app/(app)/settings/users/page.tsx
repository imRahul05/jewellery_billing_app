import { withTenant } from "@/lib/auth/with-tenant";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/rbac/authorize";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteUser, assignRole, revokeRole, deactivateMember } from "./actions";

export default async function SettingsUsersPage() {
  return withTenant(async (ctx) => {
    // 1. Authorize view permission
    await authorize("user:manage");

    // 2. Fetch members, roles, and invitations
    const [members, roles, invitations] = await Promise.all([
      prisma.userTenantMembership.findMany({
        where: { tenantId: ctx.tenantId, isActive: true },
        include: {
          user: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.role.findMany({
        where: { tenantId: ctx.tenantId, deletedAt: null },
        orderBy: { name: "asc" },
      }),
      prisma.invitation.findMany({
        where: { tenantId: ctx.tenantId, status: "pending" },
        include: {
          role: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Handle invitation submit
    async function handleInviteSubmit(formData: FormData) {
      "use server";
      const email = formData.get("email") as string;
      const roleId = formData.get("roleId") as string;

      await inviteUser({ email, roleId });
    }

    // Handle deactivate member submit
    async function handleDeactivateSubmit(formData: FormData) {
      "use server";
      const membershipId = formData.get("membershipId") as string;

      await deactivateMember({ membershipId });
    }

    // Handle toggle role
    async function handleRoleToggleSubmit(formData: FormData) {
      "use server";
      const membershipId = formData.get("membershipId") as string;
      const roleId = formData.get("roleId") as string;
      const action = formData.get("actionType") as string;

      if (action === "assign") {
        await assignRole({ membershipId, roleId });
      } else {
        await revokeRole({ membershipId, roleId });
      }
    }

    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff & Roles</h1>
          <p className="text-muted-foreground">Manage your team members and their permission roles.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Invite User Card */}
          <Card className="md:col-span-1 shadow-sm border h-fit">
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
              <CardDescription>Send an invitation to join your business.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleInviteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="staff@business.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleId">Assign Role</Label>
                  <select
                    id="roleId"
                    name="roleId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  Send Invite
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Members Table Card */}
          <Card className="md:col-span-2 shadow-sm border">
            <CardHeader>
              <CardTitle>Active Staff</CardTitle>
              <CardDescription>All users who currently have access to this business.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground font-medium">
                      <th className="py-2">Name / Email</th>
                      <th className="py-2">Active Roles</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/10">
                        <td className="py-3">
                          <div className="font-semibold text-foreground">
                            {member.user.fullName || "Pending Name Setup"}
                          </div>
                          <div className="text-xs text-muted-foreground">{member.user.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {roles.map((role) => {
                              const hasRole = member.userRoles.some((ur) => ur.roleId === role.id);
                              return (
                                <form key={role.id} action={handleRoleToggleSubmit}>
                                  <input type="hidden" name="membershipId" value={member.id} />
                                  <input type="hidden" name="roleId" value={role.id} />
                                  <input
                                    type="hidden"
                                    name="actionType"
                                    value={hasRole ? "revoke" : "assign"}
                                  />
                                  <button
                                    type="submit"
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none ${hasRole
                                        ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                                        : "bg-muted text-muted-foreground border hover:bg-muted/80"
                                      }`}
                                  >
                                    {role.name}
                                  </button>
                                </form>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <form action={handleDeactivateSubmit}>
                            <input type="hidden" name="membershipId" value={member.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 h-8 px-2"
                            >
                              Deactivate
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invites Card */}
        {invitations.length > 0 && (
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Invites that have been sent but not yet accepted.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground font-medium">
                      <th className="py-2">Email address</th>
                      <th className="py-2">Intended Role</th>
                      <th className="py-2">Expires At</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="border-b">
                        <td className="py-3 font-medium">{inv.email}</td>
                        <td className="py-3">{inv.role.name}</td>
                        <td className="py-3">
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2.5 py-0.5 text-xs font-semibold">
                            Pending
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  });
}
