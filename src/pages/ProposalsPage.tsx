import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function ProposalsPage() {
  const companyId = useCompanyId();

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("proposals")
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
      <PageHeader title="Proposals" description="Create and track proposals for your customers." actionLabel="New Proposal" />
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : proposals.length === 0 ? (
        <EmptyState title="No proposals yet" description="Create your first proposal to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Total</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="p-3 font-medium">{p.title}</td>
                      <td className="p-3">{(p.customers as any)?.name ?? "—"}</td>
                      <td className="p-3 hidden sm:table-cell">${Number(p.total).toFixed(2)}</td>
                      <td className="p-3"><StatusBadge status={p.status ?? "draft"} /></td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{format(new Date(p.created_at), "MMM dd, yyyy")}</td>
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
