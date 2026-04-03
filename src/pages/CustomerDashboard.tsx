import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, ImageIcon, Clock, DollarSign, Receipt, ShoppingBag } from "lucide-react";
import { KpiCard } from "@/components/shared/KpiCard";

export default function CustomerDashboard() {
  const { profile, user } = useAuth();
  const companyId = profile?.belongs_to_company_id;

  const { data: company } = useQuery({
    queryKey: ["customer-company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from("companies").select("name, logo_url, email, phone").eq("id", companyId).single();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["customer-services", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("services").select("*").eq("company_id", companyId).eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["customer-invoices", companyId],
    queryFn: async () => {
      if (!companyId || !user?.email) return [];
      const { data: customers } = await supabase
        .from("customers")
        .select("id")
        .eq("company_id", companyId)
        .eq("email", user.email);
      if (!customers?.length) return [];
      const customerIds = customers.map((c) => c.id);
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .in("customer_id", customerIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!user?.email,
  });

  const totalDue = invoices.filter((i: any) => i.status !== "paid").reduce((sum: number, i: any) => sum + Number(i.total), 0);

  // Group services by category
  const grouped = services.reduce<Record<string, any[]>>((acc, s: any) => {
    const cat = s.category || "Other";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Company Header */}
      <div className="flex items-center gap-4 mb-6">
        {company?.logo_url && (
          <img src={company.logo_url} alt="" className="h-12 w-12 rounded-lg object-contain border border-border" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{company?.name ?? "Your Company"}</h1>
          <p className="text-sm text-muted-foreground">Customer Portal</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard title="Total Invoices" value={invoices.length} icon={Receipt} />
        <KpiCard title="Amount Due" value={`$${totalDue.toFixed(2)}`} icon={DollarSign} />
        <KpiCard title="Services Available" value={services.length} icon={ShoppingBag} />
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Your Invoices</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{inv.invoice_number}</td>
                      <td className="p-3">${Number(inv.total).toFixed(2)}</td>
                      <td className="p-3">
                        <Badge variant={inv.status === "paid" ? "default" : "secondary"}>{inv.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{inv.due_date ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services Shop */}
      <h2 className="text-lg font-semibold mb-3">Available Services</h2>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s: any) => (
              <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold">{s.name}</h4>
                  {s.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{s.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-primary font-semibold">${Number(s.price).toFixed(2)}</span>
                    {s.duration && <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{s.duration}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {services.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No services available yet.</CardContent></Card>
      )}
    </div>
  );
}
