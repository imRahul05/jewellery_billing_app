"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminMembership, type TenantDetails, type AdminRole } from "@/lib/api/admin.api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { AlertTriangle, ArrowLeft, Building2, Calendar, CheckCircle2, Edit, Loader2, Mail, Phone, Plus, Shield, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Edit Business Form States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGstin, setEditGstin] = useState("");
  const [editPan, setEditPan] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Add Member Form States
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberFullName, setMemberFullName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRoleId, setMemberRoleId] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getBusiness(id);
        setTenant(res.data.tenant);
        setMemberships(res.data.memberships);
        setRoles(res.data.roles || []);
      } catch (err: unknown) {
        console.error(err);
        toast.error("Failed to load business details");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (tenant) {
      setEditName(tenant.name || "");
      setEditSlug(tenant.slug || "");
      setEditEmail(tenant.contactEmail || "");
      setEditPhone(tenant.contactPhone || "");
      setEditGstin(tenant.gstin || "");
      setEditPan(tenant.pan || "");
    }
  }, [tenant, isEditOpen]);

  const handleToggleStatus = async () => {
    if (!tenant) return;
    setIsTogglingStatus(true);
    const newStatus = !tenant.isActive;

    try {
      const res = await adminApi.updateBusinessStatus(id, { isActive: newStatus });
      setTenant(res.data);
      toast.success(
        newStatus
          ? "Business activated successfully! Tenant members can now log in."
          : "Business deactivated! All tenant members are immediately blocked from access."
      );
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to update business status");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tenant) return;
    setIsSavingDetails(true);
    try {
      const res = await adminApi.updateBusiness(id, {
        name: editName,
        slug: editSlug,
        contactEmail: editEmail || null,
        contactPhone: editPhone || null,
        gstin: editGstin || null,
        pan: editPan || null,
      });
      setTenant(res.data);
      toast.success("Business details updated successfully!");
      setIsEditOpen(false);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to update business details");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberRoleId) {
      toast.error("Please select a role");
      return;
    }
    setIsAddingMember(true);
    try {
      const res = await adminApi.addBusinessMember(id, {
        fullName: memberFullName,
        email: memberEmail,
        roleId: memberRoleId,
        password: memberPassword || undefined,
      });
      setMemberships((prev) => [...prev, res.data]);
      toast.success("Staff member added successfully!");
      setIsAddMemberOpen(false);
      // Reset form
      setMemberFullName("");
      setMemberEmail("");
      setMemberRoleId("");
      setMemberPassword("");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to add staff member");
    } finally {
      setIsAddingMember(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        Loading business details...
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4 text-center py-12">
        <XCircle className="size-12 mx-auto text-red-500" />
        <h2 className="text-xl font-bold">Business Not Found</h2>
        <p className="text-muted-foreground">
          The requested tenant directory could not be resolved.
        </p>
        <Link href="/admin/businesses" passHref>
          <Button variant="outline">Back to directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/businesses" passHref>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">Back to directory</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-sm font-mono text-muted-foreground">ID: {tenant.id}</p>
        </div>
        <div className="flex items-center gap-3">
          {tenant.isActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
              <CheckCircle2 className="size-3.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
              <XCircle className="size-3.5" />
              Deactivated
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Business Metadata */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Business Overview</CardTitle>
                <CardDescription>
                  Registered corporate and operational contact profiles.
                </CardDescription>
              </div>
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="size-4 mr-2" />
                    Edit Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleSaveDetails}>
                    <DialogHeader>
                      <DialogTitle>Edit Business Details</DialogTitle>
                      <DialogDescription>
                        Update the corporate and operational details for this business.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-name">Business Name</Label>
                        <Input
                          id="edit-name"
                          value={editName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-slug">Slug Name</Label>
                        <Input
                          id="edit-slug"
                          value={editSlug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditSlug(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-email">Contact Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-phone">Contact Phone</Label>
                        <Input
                          id="edit-phone"
                          value={editPhone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPhone(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-gstin">GSTIN / Tax ID</Label>
                        <Input
                          id="edit-gstin"
                          value={editGstin}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditGstin(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-pan">PAN ID</Label>
                        <Input
                          id="edit-pan"
                          value={editPan}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPan(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSavingDetails}>
                        {isSavingDetails && <Loader2 className="size-4 animate-spin mr-2" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Building2 className="size-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Slug Name</div>
                  <div className="text-sm font-semibold">{tenant.slug}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="size-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Date Registered</div>
                  <div className="text-sm font-semibold">
                    {new Date(tenant.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="size-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Contact Email</div>
                  <div className="text-sm font-semibold truncate max-w-xs">{tenant.contactEmail || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-4 mt-1 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Contact Phone</div>
                  <div className="text-sm font-semibold">{tenant.contactPhone || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t sm:border-0 pt-3 sm:pt-0">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">GSTIN / Tax ID</div>
                  <div className="text-sm font-semibold">{tenant.gstin || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t sm:border-0 pt-3 sm:pt-0">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">PAN ID</div>
                  <div className="text-sm font-semibold">{tenant.pan || "—"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Members & Staff</CardTitle>
                <CardDescription>
                  Active staff accounts associated with this tenant&apos;s directory.
                </CardDescription>
              </div>
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="size-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleAddMember}>
                    <DialogHeader>
                      <DialogTitle>Add Staff Member</DialogTitle>
                      <DialogDescription>
                        Create a new staff member and assign them a role in this business.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="member-name">Full Name</Label>
                        <Input
                          id="member-name"
                          placeholder="Jane Doe"
                          value={memberFullName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="member-email">Email Address</Label>
                        <Input
                          id="member-email"
                          type="email"
                          placeholder="jane@company.com"
                          value={memberEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="member-role">Assign Role</Label>
                        <Select
                          id="member-role"
                          value={memberRoleId}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMemberRoleId(e.target.value)}
                          required
                        >
                          <option value="">Select a role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="member-password">Password</Label>
                          <span className="text-2xs text-muted-foreground">(Optional)</span>
                        </div>
                        <Input
                          id="member-password"
                          type="password"
                          placeholder="Leave blank to auto-generate"
                          value={memberPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemberPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsAddMemberOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isAddingMember}>
                        {isAddingMember && <Loader2 className="size-4 animate-spin mr-2" />}
                        Add Member
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  No staff members associated with this business yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberships.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm text-foreground">
                                {m.user.fullName || "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">{m.user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {m.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-2xs font-medium text-muted-foreground"
                                >
                                  <Shield className="size-2.5" />
                                  {role}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {m.isActive ? (
                              <span className="text-xs text-green-600 font-medium">Active</span>
                            ) : (
                              <span className="text-xs text-muted-foreground font-medium">Suspended</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {m.joinedAt
                              ? new Date(m.joinedAt).toLocaleDateString(undefined, {
                                  dateStyle: "short",
                                })
                              : "Pending Invite"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Platform Controls */}
        <div className="space-y-6">
          <Card className="border-red-200 dark:border-red-950/40">
            <CardHeader className="bg-red-50/50 dark:bg-red-950/10">
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="size-4 shrink-0" />
                Administrative Actions
              </CardTitle>
              <CardDescription>
                Critical overrides for this business subscription and access.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {tenant.isActive ? (
                    <div className="flex gap-2">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      Deactivating a business blocks all of its users from logging in, accessing billing, inventory, or GST reports instantly. Existing invoices and client data are preserved.
                    </div>
                  ) : (
                    "Activating this business immediately restores system access for all registered staff members under the tenant."
                  )}
                </div>
                <Button
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus}
                  className="w-full mt-2"
                  variant={tenant.isActive ? "destructive" : "default"}
                >
                  {isTogglingStatus ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : tenant.isActive ? (
                    "Deactivate Business"
                  ) : (
                    "Activate Business"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
