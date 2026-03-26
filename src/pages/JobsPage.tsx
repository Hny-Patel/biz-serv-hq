import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

const mockJobs = [
  { id: "JOB-301", customer: "Acme Corporation", service: "Deep Cleaning", staff: "Mike T.", status: "In Progress", date: "Mar 26, 2026" },
  { id: "JOB-300", customer: "TechStart Inc", service: "HVAC Maintenance", staff: "Sarah L.", status: "Pending", date: "Mar 27, 2026" },
  { id: "JOB-299", customer: "Riverside Dental", service: "Window Washing", staff: "John D.", status: "Complete", date: "Mar 24, 2026" },
  { id: "JOB-298", customer: "Green Solutions", service: "Pest Control", staff: "Mike T.", status: "Complete", date: "Mar 23, 2026" },
];

export default function JobsPage() {
  return (
    <div>
      <PageHeader title="Service Jobs" description="Track and manage work orders." />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Job ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Assigned</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {mockJobs.map((j) => (
                  <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="p-3 font-mono text-xs">{j.id}</td>
                    <td className="p-3 font-medium">{j.customer}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{j.service}</td>
                    <td className="p-3 hidden md:table-cell">{j.staff}</td>
                    <td className="p-3"><StatusBadge status={j.status} /></td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{j.date}</td>
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
