import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ServiceFormDialog } from "@/components/services/ServiceFormDialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ServicesPage() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("services").delete().eq("id", deleteId);
    if (error) toast.error("Delete failed: " + error.message);
    else { toast.success("Service deleted."); qc.invalidateQueries({ queryKey: ["services"] }); }
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader
        title="Services"
        description="Define and manage the services you offer."
        actionLabel="Add Service"
        onAction={() => { setEditService(null); setDialogOpen(true); }}
      />

      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : services.length === 0 ? (
        <EmptyState
          title="No services yet"
          description="Add your first service to get started."
          actionLabel="Add Service"
          onAction={() => { setEditService(null); setDialogOpen(true); }}
        />
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
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s: any) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium flex items-center gap-2">
                        {s.image_url && (
                          <img src={s.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        {s.name}
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{s.category ?? "—"}</td>
                      <td className="p-3">${Number(s.price).toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{s.duration ?? "—"}</td>
                      <td className="p-3"><StatusBadge status={s.is_active ? "Active" : "Inactive"} /></td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditService(s); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editService}
        onSaved={() => qc.invalidateQueries({ queryKey: ["services"] })}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
