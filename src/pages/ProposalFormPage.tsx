import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceLineItems, LineItem } from "@/components/invoices/InvoiceLineItems";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ProposalFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [currencyId, setCurrencyId] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);

  const { data: company } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from("customers").select("*").eq("company_id", companyId).eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase.from("currencies").select("*").eq("company_id", companyId).order("is_default", { ascending: false });
      return data ?? [];
    },
    enabled: !!companyId,
  });

  const { data: existing } = useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle();
      if (data) {
        const { data: pItems } = await supabase
          .from("proposal_items")
          .select("*")
          .eq("proposal_id", id);
        return { ...data, line_items: pItems ?? [] };
      }
      return null;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setCustomerId(existing.customer_id);
      setStatus(existing.status ?? "draft");
      setValidUntil(existing.valid_until ?? "");
      setNotes(existing.notes ?? "");
      setTermsAndConditions((existing as any).terms_and_conditions ?? "");
      setCurrencyId((existing as any).currency_id ?? "");
      if ((existing as any).line_items?.length) {
        setItems(
          (existing as any).line_items.map((li: any) => ({
            id: li.id,
            description: li.description,
            quantity: li.quantity,
            unit_price: Number(li.unit_price),
            total: Number(li.quantity) * Number(li.unit_price),
          }))
        );
      }
    }
  }, [existing]);

  useEffect(() => {
    if (!currencyId && currencies.length > 0) {
      const def = currencies.find((c: any) => c.is_default);
      if (def) setCurrencyId((def as any).id);
    }
  }, [currencies, currencyId]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedCurrency = currencies.find((c: any) => (c as any).id === currencyId);
  const currencySymbol = selectedCurrency ? (selectedCurrency as any).symbol : "₹";

  const total = items.reduce((sum, i) => sum + i.total, 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !customerId) throw new Error("Select a customer");
      if (!title.trim()) throw new Error("Enter a title");

      const proposalData: any = {
        company_id: companyId,
        customer_id: customerId,
        title: title.trim(),
        status,
        total,
        valid_until: validUntil || null,
        notes: notes || null,
        terms_and_conditions: termsAndConditions || null,
        currency_id: currencyId || null,
      };

      let proposalId = id;

      if (isEdit) {
        const { error } = await supabase.from("proposals").update(proposalData).eq("id", id!);
        if (error) throw error;
        await supabase.from("proposal_items").delete().eq("proposal_id", id!);
      } else {
        const { data, error } = await supabase.from("proposals").insert(proposalData).select("id").single();
        if (error) throw error;
        proposalId = data.id;
      }

      const itemsToInsert = items
        .filter((i) => i.description.trim())
        .map((i) => ({
          proposal_id: proposalId!,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
        }));

      if (itemsToInsert.length) {
        const { error } = await supabase.from("proposal_items").insert(itemsToInsert as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposals"] });
      toast.success(isEdit ? "Proposal updated" : "Proposal created");
      navigate("/proposals");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/proposals")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Proposal" : "Create Proposal"}
          </h1>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving…" : isEdit ? "Update" : "Save Proposal"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-lg">{company?.name ?? "Your Company"}</p>
            {company?.email && <p className="text-sm text-muted-foreground">{company.email}</p>}
            {company?.phone && <p className="text-sm text-muted-foreground">{company.phone}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Title</Label>
              <Input placeholder="Proposal title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currencyId} onValueChange={setCurrencyId}>
                <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.symbol} {c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceLineItems items={items} onChange={setItems} currencySymbol={currencySymbol} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes for the customer…" />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea rows={4} value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} placeholder="Payment terms, warranty, scope of work…" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg">{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
