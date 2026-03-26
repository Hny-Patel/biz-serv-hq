import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

const mockInvoices = [
  { id: "INV-2087", customer: "Riverside Dental", total: "$1,250", status: "Paid", due: "Mar 20, 2026" },
  { id: "INV-2086", customer: "Acme Corporation", total: "$1,500", status: "Sent", due: "Apr 05, 2026" },
  { id: "INV-2085", customer: "TechStart Inc", total: "$2,800", status: "Draft", due: "Apr 10, 2026" },
  { id: "INV-2084", customer: "Green Solutions", total: "$950", status: "Overdue", due: "Mar 15, 2026" },
];

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader title="Invoices" description="Manage billing and invoices." actionLabel="Create Invoice" />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="p-3 font-mono text-xs">{inv.id}</td>
                    <td className="p-3 font-medium">{inv.customer}</td>
                    <td className="p-3">{inv.total}</td>
                    <td className="p-3"><StatusBadge status={inv.status} /></td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{inv.due}</td>
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
