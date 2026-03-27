import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ServicesPage() {
  const companyId = useCompanyId();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("services").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  return (
    <div>
      <PageHeader title="Services" description="Define and manage the services you offer." actionLabel="Add Service" />
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : services.length === 0 ? (
        <EmptyState title="No services yet" description="Add your first service to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Service</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Duration</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{s.category ?? "—"}</td>
                      <td className="p-3">${Number(s.price).toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{s.duration ?? "—"}</td>
                      <td className="p-3"><StatusBadge status={s.is_active ? "Active" : "Inactive"} /></td>
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
