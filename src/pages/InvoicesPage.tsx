import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function InvoicesPage() {
  const companyId = useCompanyId();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(name)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  return (
    <div>
      <PageHeader title="Invoices" description="Manage billing and invoices." actionLabel="Create Invoice" />
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Create your first invoice to get started." />
      ) : (
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
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="p-3 font-medium">{(inv.customers as any)?.name ?? "—"}</td>
                      <td className="p-3">${Number(inv.total).toFixed(2)}</td>
                      <td className="p-3"><StatusBadge status={inv.status ?? "draft"} /></td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{inv.due_date ? format(new Date(inv.due_date), "MMM dd, yyyy") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
