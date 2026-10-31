import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, GitBranch } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full shadow-lg border">
      <CardHeader className="text-center space-y-1">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <KeyRound className="w-5 h-5" />
        </div>
        <CardTitle className="text-xl">Authentication — Password Reset</CardTitle>
        <CardDescription>
          Placeholder page for password recovery requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed p-4 text-center bg-muted/30 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Assigned to Member 1 (Admin & Backend)
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted px-2.5 py-1 rounded">
            <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
            feature/admin-backend
          </div>
          <p className="text-xs text-muted-foreground">
            Password recovery email trigger and reset callback handling will be implemented here.
          </p>
        </div>

        <div className="pt-2 text-center text-xs text-muted-foreground space-y-2">
          <div>
            Remember your credentials?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
