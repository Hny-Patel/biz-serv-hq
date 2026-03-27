import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function JobsPage() {
  const companyId = useCompanyId();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("jobs")
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
      <PageHeader title="Service Jobs" description="Track and manage work orders." />
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs yet" description="Jobs will appear here when created from proposals." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Scheduled</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="p-3 font-medium">{(j.customers as any)?.name ?? "—"}</td>
                      <td className="p-3"><StatusBadge status={j.status ?? "pending"} /></td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{j.scheduled_date ? format(new Date(j.scheduled_date), "MMM dd, yyyy") : "—"}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{format(new Date(j.created_at), "MMM dd, yyyy")}</td>
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
