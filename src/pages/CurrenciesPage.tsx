import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

interface CurrencyForm {
  code: string;
  name: string;
  symbol: string;
  is_default: boolean;
}

const emptyForm: CurrencyForm = { code: "", name: "", symbol: "", is_default: false };

export default function CurrenciesPage() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CurrencyForm>(emptyForm);

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ["currencies", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .eq("company_id", companyId)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      if (!form.code.trim() || !form.name.trim() || !form.symbol.trim())
        throw new Error("All fields are required");

      // If setting as default, unset others first
      if (form.is_default) {
        await supabase
          .from("currencies")
          .update({ is_default: false } as any)
          .eq("company_id", companyId);
      }

      if (editId) {
        const { error } = await supabase
          .from("currencies")
          .update({
            code: form.code.toUpperCase(),
            name: form.name,
            symbol: form.symbol,
            is_default: form.is_default,
          } as any)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("currencies").insert({
          company_id: companyId,
          code: form.code.toUpperCase(),
          name: form.name,
          symbol: form.symbol,
          is_default: form.is_default,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currencies"] });
      toast.success(editId ? "Currency updated" : "Currency created");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("currencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currencies"] });
      toast.success("Currency deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({ code: c.code, name: c.name, symbol: c.symbol, is_default: c.is_default });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  return (
    <div>
      <PageHeader
        title="Currencies"
        description="Manage currencies for invoices and proposals."
        actionLabel="Add Currency"
        onAction={openNew}
      />

      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : currencies.length === 0 ? (
        <EmptyState title="No currencies yet" description="Add your first currency to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Code</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Symbol</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Default</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((c: any) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-medium">{c.code}</td>
                      <td className="p-3">{c.name}</td>
                      <td className="p-3 text-lg">{c.symbol}</td>
                      <td className="p-3">
                        {c.is_default && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Currency" : "Add Currency"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Currency Code</Label>
              <Input placeholder="e.g. INR, USD, EUR" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <Label>Currency Name</Label>
              <Input placeholder="e.g. Indian Rupee" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Symbol</Label>
              <Input placeholder="e.g. ₹, $, €" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_default} onCheckedChange={(v) => setForm({ ...form, is_default: v })} />
              <Label>Set as default currency</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : editId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
