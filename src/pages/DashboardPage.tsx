import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Users, FileText, Briefcase, Receipt, DollarSign, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function DashboardPage() {
  const companyId = useCompanyId();

  const { data: counts } = useQuery({
    queryKey: ["dashboard-counts", companyId],
    queryFn: async () => {
      if (!companyId) return { customers: 0, proposals: 0, jobs: 0, invoices: 0, unpaidTotal: 0 };
      const [cust, prop, job, inv] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["draft", "sent"]),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["pending", "in_progress"]),
        supabase.from("invoices").select("total").eq("company_id", companyId).in("status", ["sent", "overdue"]),
      ]);
      const unpaidTotal = (inv.data ?? []).reduce((s, i) => s + Number(i.total), 0);
      return { customers: cust.count ?? 0, proposals: prop.count ?? 0, jobs: job.count ?? 0, invoices: (inv.data ?? []).length, unpaidTotal };
    },
    enabled: !!companyId,
  });

  const { data: recentInvoices = [] } = useQuery({
    queryKey: ["dashboard-recent", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from("invoices").select("*, customers(name)").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const kpis = [
    { title: "Total Customers", value: counts?.customers ?? 0, icon: Users, trend: "neutral" as const },
    { title: "Open Proposals", value: counts?.proposals ?? 0, icon: FileText, trend: "neutral" as const },
    { title: "Active Jobs", value: counts?.jobs ?? 0, icon: Briefcase, trend: "neutral" as const },
    { title: "Unpaid Invoices", value: counts?.invoices ?? 0, change: `$${(counts?.unpaidTotal ?? 0).toLocaleString()} outstanding`, icon: Receipt, trend: "down" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => <KpiCard key={kpi.title} {...kpi} />)}
      </div>

      <Card className="animate-fade-in">
        <CardHeader><CardTitle className="text-lg">Recent Invoices</CardTitle></CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.customers?.name ?? "—"} · ${Number(inv.total).toFixed(2)}</p>
                  </div>
                  <StatusBadge status={inv.status ?? "draft"} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
