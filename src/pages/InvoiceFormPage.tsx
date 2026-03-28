import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InvoiceLineItems, LineItem } from "@/components/invoices/InvoiceLineItems";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Plus } from "lucide-react";
import { format } from "date-fns";

export default function InvoiceFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { profile } = useAuth();
  const qc = useQueryClient();

  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [taxRateId, setTaxRateId] = useState<string>("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [taxDialogOpen, setTaxDialogOpen] = useState(false);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");

  // Fetch company
  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from("customers").select("*").eq("company_id", companyId).eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: !!companyId,
  });

  // Fetch tax rates
  const { data: taxRates = [], refetch: refetchTax } = useQuery({
    queryKey: ["tax_rates", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from("tax_rates").select("*").eq("company_id", companyId).eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: !!companyId,
  });

  // Fetch existing invoice for edit
  const { data: existingInvoice } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
      if (data) {
        const { data: lineItems } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", id)
          .order("sort_order" as any);
        return { ...data, line_items: lineItems ?? [] };
      }
      return null;
    },
    enabled: !!id,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingInvoice) {
      setCustomerId(existingInvoice.customer_id);
      setDueDate(existingInvoice.due_date ?? "");
      setNotes(existingInvoice.notes ?? "");
      setStatus(existingInvoice.status ?? "draft");
      setDiscountType((existingInvoice as any).discount_type ?? "percentage");
      setDiscountValue(Number((existingInvoice as any).discount_value ?? 0));
      setAttachmentUrl((existingInvoice as any).attachment_url ?? "");
      if ((existingInvoice as any).line_items?.length) {
        setItems(
          (existingInvoice as any).line_items.map((li: any) => ({
            id: li.id,
            description: li.description,
            quantity: li.quantity,
            unit_price: Number(li.unit_price),
            total: Number(li.total),
          }))
        );
      }
    }
  }, [existingInvoice]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedTax = taxRates.find((t: any) => t.id === taxRateId);

  // Calculations
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const discountAmount = discountType === "percentage" ? subtotal * (discountValue / 100) : discountValue;
  const afterDiscount = subtotal - discountAmount;
  const taxRate = selectedTax ? Number((selectedTax as any).rate) : 0;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  // Generate invoice number
  const { data: nextNumber } = useQuery({
    queryKey: ["invoice_count", companyId],
    queryFn: async () => {
      if (!companyId) return "INV-001";
      const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true }).eq("company_id", companyId);
      return `INV-${String((count ?? 0) + 1).padStart(3, "0")}`;
    },
    enabled: !!companyId && !isEdit,
  });

  const invoiceNumber = isEdit ? existingInvoice?.invoice_number ?? "" : nextNumber ?? "INV-001";

  // Save
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !customerId) throw new Error("Please select a customer");
      if (items.length === 0 || items.every((i) => !i.description)) throw new Error("Add at least one item");

      const invoiceData: any = {
        company_id: companyId,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        due_date: dueDate || null,
        notes: notes || null,
        status,
        discount_type: discountType,
        discount_value: discountValue,
        attachment_url: attachmentUrl || null,
      };

      let invoiceId = id;

      if (isEdit) {
        const { error } = await supabase.from("invoices").update(invoiceData).eq("id", id!);
        if (error) throw error;
        await supabase.from("invoice_items").delete().eq("invoice_id", id!);
      } else {
        const { data, error } = await supabase.from("invoices").insert(invoiceData).select("id").single();
        if (error) throw error;
        invoiceId = data.id;
      }

      const itemsToInsert = items
        .filter((i) => i.description.trim())
        .map((i, idx) => ({
          invoice_id: invoiceId!,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total: i.total,
          sort_order: idx,
        }));

      if (itemsToInsert.length) {
        const { error } = await supabase.from("invoice_items").insert(itemsToInsert as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(isEdit ? "Invoice updated" : "Invoice created");
      navigate("/invoices");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Create tax rate
  const createTaxMutation = useMutation({
    mutationFn: async () => {
      if (!newTaxName.trim() || !newTaxRate) throw new Error("Fill tax name and rate");
      const { data, error } = await supabase.from("tax_rates").insert({
        company_id: companyId!,
        name: newTaxName.trim(),
        rate: Number(newTaxRate),
      } as any).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      refetchTax();
      setTaxRateId(data.id);
      setTaxDialogOpen(false);
      setNewTaxName("");
      setNewTaxRate("");
      toast.success("Tax rate created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownloadPdf = () => {
    generateInvoicePdf({
      invoiceNumber,
      companyName: company?.name ?? "Company",
      companyEmail: company?.email,
      companyPhone: company?.phone,
      companyAddress: company?.address,
      customerName: selectedCustomer?.name ?? "",
      customerEmail: selectedCustomer?.email,
      customerPhone: selectedCustomer?.phone,
      customerAddress: selectedCustomer?.address,
      dueDate: dueDate ? format(new Date(dueDate), "MMM dd, yyyy") : null,
      createdAt: format(new Date(), "MMM dd, yyyy"),
      items: items.filter((i) => i.description.trim()),
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxName: selectedTax ? (selectedTax as any).name : undefined,
      taxRate,
      taxAmount,
      total,
      notes,
      status,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? "Edit Invoice" : "Create Invoice"}
            </h1>
            <p className="text-muted-foreground text-sm">#{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : isEdit ? "Update" : "Save Invoice"}
          </Button>
        </div>
      </div>

      {/* Company & Customer Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{company?.name ?? "Your Company"}</p>
            {company?.email && <p className="text-sm text-muted-foreground">{company.email}</p>}
            {company?.phone && <p className="text-sm text-muted-foreground">{company.phone}</p>}
            {company?.address && <p className="text-sm text-muted-foreground">{company.address}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bill To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomer && (
              <div className="text-sm text-muted-foreground space-y-0.5">
                {selectedCustomer.email && <p>{selectedCustomer.email}</p>}
                {selectedCustomer.phone && <p>{selectedCustomer.phone}</p>}
                {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Attachment URL</Label>
              <Input
                placeholder="https://..."
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineItems items={items} onChange={setItems} />
        </CardContent>
      </Card>

      {/* Tax, Discount & Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Tax */}
            <div>
              <Label>Tax Rate</Label>
              <div className="flex gap-2">
                <Select value={taxRateId} onValueChange={setTaxRateId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="No tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tax</SelectItem>
                    {taxRates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setTaxDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Discount */}
            <div>
              <Label>Discount</Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, thank you note, etc." />
            </div>

            {attachmentUrl && (
              <div>
                <Label>Attachment</Label>
                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <FileText className="h-4 w-4" /> View Attachment
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
                  </span>
                  <span className="font-medium text-destructive">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedTax ? `${(selectedTax as any).name} (${taxRate}%)` : `Tax (${taxRate}%)`}
                  </span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Tax Dialog */}
      <Dialog open={taxDialogOpen} onOpenChange={setTaxDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Tax Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tax Name</Label>
              <Input placeholder="e.g. GST, VAT" value={newTaxName} onChange={(e) => setNewTaxName(e.target.value)} />
            </div>
            <div>
              <Label>Rate (%)</Label>
              <Input type="number" min={0} step={0.01} placeholder="e.g. 18" value={newTaxRate} onChange={(e) => setNewTaxRate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTaxDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => createTaxMutation.mutate()} disabled={createTaxMutation.isPending}>
                {createTaxMutation.isPending ? "Saving…" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
