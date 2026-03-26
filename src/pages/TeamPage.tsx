import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockTeam = [
  { name: "John Doe", email: "john@company.com", role: "Owner", status: "Active", initials: "JD" },
  { name: "Sarah Lee", email: "sarah@company.com", role: "Admin", status: "Active", initials: "SL" },
  { name: "Mike Torres", email: "mike@company.com", role: "Staff", status: "Active", initials: "MT" },
  { name: "Anna Kim", email: "anna@company.com", role: "Manager", status: "Active", initials: "AK" },
  { name: "David Chen", email: "david@company.com", role: "Staff", status: "Inactive", initials: "DC" },
];

export default function TeamPage() {
  return (
    <div>
      <PageHeader title="Team" description="Manage your team members and their roles." actionLabel="Invite Member" />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Member</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTeam.map((m) => (
                  <tr key={m.email} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">{m.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{m.email}</td>
                    <td className="p-3">{m.role}</td>
                    <td className="p-3"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
