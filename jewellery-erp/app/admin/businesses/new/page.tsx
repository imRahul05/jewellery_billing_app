"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin.api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Eye, EyeOff, KeyRound, Loader2, Mail, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";

const FormSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegisterBusinessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, ownerPassword: password }));
    toast.success("Generated secure password!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const result = FormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await adminApi.createBusiness(formData);
      toast.success("Business and Owner registered successfully!");
      router.push("/admin/businesses");
    } catch (err: unknown) {
      console.error(err);
      let errMsg = "Failed to register business. Ensure email is unique.";
      if (err && typeof err === "object" && "response" in err) {
        const responseData = (err as { response?: { data?: { error?: string } } }).response?.data;
        if (responseData?.error) {
          errMsg = responseData.error;
        }
      }
      toast.error(errMsg);
    } finally {

      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/businesses" passHref>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">Back to Businesses</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Register New Business</h1>
        <p className="text-muted-foreground">
          Provision a brand new tenant store and set up its business owner credentials.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Business Configuration</CardTitle>
            <CardDescription>
              Complete the credentials below to onboard the new business.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Details */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="businessName"
                  placeholder="e.g. Shree Laxmi Jewellers"
                  className="pl-9"
                  value={formData.businessName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              {errors.businessName && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.businessName}</p>
              )}
            </div>

            <div className="border-t my-4 pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Owner Setup</h3>
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="ownerName"
                  placeholder="e.g. Ramesh Gupta"
                  className="pl-9"
                  value={formData.ownerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ownerName: e.target.value }))}
                />
              </div>
              {errors.ownerName && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.ownerName}</p>
              )}
            </div>

            {/* Owner Email */}
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="e.g. owner@jeweller.com"
                  className="pl-9"
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ownerEmail: e.target.value }))}
                />
              </div>
              {errors.ownerEmail && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.ownerEmail}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ownerPassword">Initial Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs text-red-600 hover:text-red-700"
                  onClick={generatePassword}
                >
                  Generate Password
                </Button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="ownerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className="pl-9 pr-9"
                  value={formData.ownerPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ownerPassword: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
                </Button>
              </div>
              {errors.ownerPassword && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.ownerPassword}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <Link href="/admin/businesses" passHref>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating Store...
                </>
              ) : (
                "Create & Launch Store"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
