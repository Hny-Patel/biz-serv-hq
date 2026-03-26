import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";

const mockServices = [
  { id: 1, name: "Deep Cleaning", category: "Cleaning", price: "$250", duration: "3 hrs", status: "Active" },
  { id: 2, name: "Window Washing", category: "Cleaning", price: "$120", duration: "2 hrs", status: "Active" },
  { id: 3, name: "HVAC Maintenance", category: "Maintenance", price: "$350", duration: "4 hrs", status: "Active" },
  { id: 4, name: "Carpet Shampooing", category: "Cleaning", price: "$180", duration: "2.5 hrs", status: "Inactive" },
  { id: 5, name: "Pest Control", category: "Maintenance", price: "$200", duration: "1.5 hrs", status: "Active" },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHeader title="Services" description="Define and manage the services you offer." actionLabel="Add Service" />
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
                {mockServices.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{s.category}</td>
                    <td className="p-3">{s.price}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{s.duration}</td>
                    <td className="p-3"><StatusBadge status={s.status} /></td>
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
