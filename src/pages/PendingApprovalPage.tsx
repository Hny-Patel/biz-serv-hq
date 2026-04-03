import { Zap, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApprovalPage() {
  const { signOut, profile } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Account Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Hi {profile?.full_name || "there"}! Your account has been created successfully but is waiting for approval from a company owner.
          </p>
          <p className="text-muted-foreground text-sm">
            You'll be able to access the platform once your account is approved and linked to a company.
          </p>
          <Button variant="outline" onClick={signOut} className="mt-4">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
