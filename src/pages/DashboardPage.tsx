import {
  Users,
  FileText,
  Briefcase,
  Receipt,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

const kpis = [
  { title: "Total Customers", value: 124, change: "+12 this month", icon: Users, trend: "up" as const },
  { title: "Open Proposals", value: 18, change: "3 pending approval", icon: FileText, trend: "neutral" as const },
  { title: "Active Jobs", value: 7, change: "+2 from last week", icon: Briefcase, trend: "up" as const },
  { title: "Unpaid Invoices", value: 5, change: "$4,320 outstanding", icon: Receipt, trend: "down" as const },
  { title: "Monthly Revenue", value: "$12,840", change: "+18% vs last month", icon: DollarSign, trend: "up" as const },
  { title: "Completion Rate", value: "94%", change: "+3% improvement", icon: TrendingUp, trend: "up" as const },
];

const recentActivity = [
  { action: "New proposal sent", detail: "Proposal #1042 for Acme Corp", time: "2 min ago", status: "Sent" },
  { action: "Job completed", detail: "Deep Clean — Summit Office", time: "1 hour ago", status: "Complete" },
  { action: "Invoice paid", detail: "Invoice #2087 — $1,250", time: "3 hours ago", status: "Paid" },
  { action: "New customer added", detail: "Rachel Green — Green Co.", time: "5 hours ago", status: "Active" },
  { action: "Proposal approved", detail: "Proposal #1038 by TechStart", time: "Yesterday", status: "Approved" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <StatusBadge status={item.status} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
