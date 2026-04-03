import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Store, ImageIcon, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ShopPage() {
  const companyId = useCompanyId();
  const navigate = useNavigate();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["shop-services", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("category", { ascending: true, nullsFirst: false })
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["shop-company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from("companies").select("name, logo_url, email, phone, address").eq("id", companyId).single();
      return data;
    },
    enabled: !!companyId,
  });

  // Group services by category
  const grouped = services.reduce<Record<string, any[]>>((acc, s: any) => {
    const cat = s.category || "Other";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Shop" description="Your public storefront." />
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div>
        <PageHeader title="Shop" description="Your public storefront showcasing your services." />
        <EmptyState
          icon={Store}
          title="No active services to display"
          description="Add services from the Services page to populate your shop."
          actionLabel="Go to Services"
          onAction={() => navigate("/services")}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Shop Header with Company Branding */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          {company?.logo_url && (
            <img src={company.logo_url} alt="" className="h-14 w-14 rounded-lg object-contain border border-border" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{company?.name ?? "Shop"}</h1>
            <p className="text-sm text-muted-foreground">Browse our services</p>
          </div>
        </div>
        {(company?.email || company?.phone || company?.address) && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2">
            {company?.email && <span>{company.email}</span>}
            {company?.phone && <span>{company.phone}</span>}
            {company?.address && <span>{company.address}</span>}
          </div>
        )}
      </div>

      {/* Services Grid by Category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold mb-3">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s: any) => (
              <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Service Image */}
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-base mb-1">{s.name}</h3>
                  {s.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{s.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {Number(s.price).toFixed(2)}
                    </div>
                    {s.duration && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {s.duration}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
