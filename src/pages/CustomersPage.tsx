import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Pencil, Trash2 } from "lucide-react";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export default function CustomersPage() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"customers"> | null>(null);
  const [deleting, setDeleting] = useState<Tables<"customers"> | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("customers").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("customers").insert({ ...values, company_id: companyId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer created"); setFormOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase.from("customers").update(values).eq("id", editing!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer updated"); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").delete().eq("id", deleting!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer deleted"); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Customers" description="Manage your customer database." actionLabel="Add Customer" onAction={() => { setEditing(null); setFormOpen(true); }} />

      <div className="flex items-center gap-3 mb-4 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers…" className="bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : filtered.length === 0 ? (
        <EmptyState title="No customers yet" description="Add your first customer to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-muted-foreground">{c.email}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{c.phone}</td>
                      <td className="p-3"><StatusBadge status={c.is_active ? "Active" : "Inactive"} /></td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        customer={editing}
        onSubmit={(v) => editing ? updateMutation.mutate(v) : createMutation.mutate(v)}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {deleting && (
        <DeleteCustomerDialog
          open={!!deleting}
          onOpenChange={(o) => { if (!o) setDeleting(null); }}
          customerName={deleting.name}
          onConfirm={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
