import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Download, Pencil, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

export default function InvoicesPage() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(name, email, phone, address)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success("Invoice deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownloadPdf = async (inv: any) => {
    const { data: lineItems } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", inv.id)
      .order("sort_order" as any);

    const cust = inv.customers as any;
    generateInvoicePdf({
      invoiceNumber: inv.invoice_number,
      companyName: company?.name ?? "Company",
      companyEmail: company?.email,
      companyPhone: company?.phone,
      companyAddress: company?.address,
      customerName: cust?.name ?? "",
      customerEmail: cust?.email,
      customerPhone: cust?.phone,
      customerAddress: cust?.address,
      dueDate: inv.due_date ? format(new Date(inv.due_date), "MMM dd, yyyy") : null,
      createdAt: format(new Date(inv.created_at), "MMM dd, yyyy"),
      items: (lineItems ?? []).map((li: any) => ({
        description: li.description,
        quantity: li.quantity,
        unit_price: Number(li.unit_price),
        total: Number(li.total),
      })),
      subtotal: Number(inv.subtotal),
      discountType: (inv as any).discount_type,
      discountValue: Number((inv as any).discount_value ?? 0),
      discountAmount:
        (inv as any).discount_type === "percentage"
          ? Number(inv.subtotal) * (Number((inv as any).discount_value ?? 0) / 100)
          : Number((inv as any).discount_value ?? 0),
      taxRate: Number(inv.tax_rate ?? 0),
      taxAmount: Number(inv.tax_amount ?? 0),
      total: Number(inv.total),
      notes: inv.notes,
      status: inv.status,
    });
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Manage billing and invoices."
        actionLabel="Create Invoice"
        onAction={() => navigate("/invoices/new")}
      />
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Create your first invoice to get started." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Due Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Attachment</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="p-3 font-medium">{(inv.customers as any)?.name ?? "—"}</td>
                      <td className="p-3">${Number(inv.total).toFixed(2)}</td>
                      <td className="p-3"><StatusBadge status={inv.status ?? "draft"} /></td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        {inv.due_date ? format(new Date(inv.due_date), "MMM dd, yyyy") : "—"}
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {(inv as any).attachment_url ? (
                          <a href={(inv as any).attachment_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <FileText className="h-3 w-3" /> View
                          </a>
                        ) : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(inv)} title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/${inv.id}/edit`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(inv.id)}>
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
    </div>
  );
}
