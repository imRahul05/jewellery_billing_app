import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return <Card className="shadow-sm"><CardHeader><CardTitle className="text-xl">Create your business account</CardTitle><CardDescription>Start with a secure owner identity.</CardDescription></CardHeader><CardContent className="space-y-5"><SignUpForm /><p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></p></CardContent></Card>;
}
