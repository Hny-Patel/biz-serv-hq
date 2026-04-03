import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/shared/KpiCard";
import { Briefcase, DollarSign, Clock, CheckCircle } from "lucide-react";

export default function VendorDashboard() {
  const { user, profile } = useAuth();

  const { data: jobs = [] } = useQuery({
    queryKey: ["vendor-jobs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("jobs")
        .select("*, customers(name)")
        .eq("assigned_to", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeJobs = jobs.filter((j: any) => j.status === "pending" || j.status === "in_progress");
  const completedJobs = jobs.filter((j: any) => j.status === "complete");

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "in_progress": return "default";
      case "complete": return "outline";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vendor Portal</h1>
        <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name ?? "Vendor"}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard title="Active Jobs" value={activeJobs.length} icon={Briefcase} />
        <KpiCard title="Completed Jobs" value={completedJobs.length} icon={CheckCircle} />
        <KpiCard title="Total Jobs" value={jobs.length} icon={Clock} />
      </div>

      {/* Jobs List */}
      <h2 className="text-lg font-semibold mb-3">Your Jobs</h2>
      {jobs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No jobs assigned to you yet.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Scheduled</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: any) => (
                    <tr key={job.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{job.customers?.name ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant={statusColor(job.status) as any}>{job.status?.replace("_", " ")}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{job.scheduled_date ?? "—"}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{job.notes ?? "—"}</td>
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
