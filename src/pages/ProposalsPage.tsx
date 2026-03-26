import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

const mockProposals = [
  { id: "#1042", customer: "Acme Corporation", total: "$1,500", status: "Sent", date: "Mar 24, 2026" },
  { id: "#1041", customer: "TechStart Inc", total: "$2,800", status: "Approved", date: "Mar 22, 2026" },
  { id: "#1040", customer: "Green Solutions", total: "$950", status: "Draft", date: "Mar 21, 2026" },
  { id: "#1039", customer: "Summit Office Group", total: "$3,200", status: "Rejected", date: "Mar 20, 2026" },
  { id: "#1038", customer: "Riverside Dental", total: "$1,750", status: "Approved", date: "Mar 18, 2026" },
];

export default function ProposalsPage() {
  return (
    <div>
      <PageHeader title="Proposals" description="Create and track proposals for your customers." actionLabel="New Proposal" />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Total</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockProposals.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="p-3 font-mono text-xs">{p.id}</td>
                    <td className="p-3 font-medium">{p.customer}</td>
                    <td className="p-3 hidden sm:table-cell">{p.total}</td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{p.date}</td>
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
