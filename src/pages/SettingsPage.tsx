import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Configure your company profile and preferences." />

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input defaultValue="Acme Services Co." />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input defaultValue="admin@acmeservices.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input defaultValue="+1 555-0100" />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input defaultValue="123 Business Ave, Suite 200" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input defaultValue="America/New_York" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input defaultValue="USD" />
            </div>
            <Button>Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
