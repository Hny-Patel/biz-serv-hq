import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const mockCustomers = [
  { id: 1, name: "Acme Corporation", email: "contact@acme.com", phone: "+1 555-0101", status: "Active", proposals: 5 },
  { id: 2, name: "TechStart Inc", email: "hello@techstart.io", phone: "+1 555-0102", status: "Active", proposals: 3 },
  { id: 3, name: "Green Solutions", email: "info@greensol.com", phone: "+1 555-0103", status: "Active", proposals: 2 },
  { id: 4, name: "Summit Office Group", email: "admin@summit.co", phone: "+1 555-0104", status: "Inactive", proposals: 1 },
  { id: 5, name: "Riverside Dental", email: "office@riverside.dental", phone: "+1 555-0105", status: "Active", proposals: 4 },
];

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" description="Manage your customer database." actionLabel="Add Customer" />

      <div className="flex items-center gap-3 mb-4 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers…" className="bg-card" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Proposals</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockCustomers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.email}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{c.phone}</td>
                    <td className="p-3 hidden sm:table-cell">{c.proposals}</td>
                    <td className="p-3"><StatusBadge status={c.status} /></td>
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
