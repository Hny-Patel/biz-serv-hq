import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  duration: string | null;
  is_active: boolean | null;
  image_url?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSaved: () => void;
}

export function ServiceFormDialog({ open, onOpenChange, service, onSaved }: Props) {
  const companyId = useCompanyId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description ?? "");
      setCategory(service.category ?? "");
      setPrice(String(service.price));
      setDuration(service.duration ?? "");
      setIsActive(service.is_active ?? true);
      setImageUrl((service as any).image_url ?? null);
    } else {
      setName("");
      setDescription("");
      setCategory("");
      setPrice("");
      setDuration("");
      setIsActive(true);
      setImageUrl(null);
    }
  }, [service, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${companyId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("service-images").upload(fileName, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("service-images").getPublicUrl(fileName);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!companyId || !name.trim()) { toast.error("Service name is required."); return; }
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description || null,
      category: category || null,
      price: parseFloat(price) || 0,
      duration: duration || null,
      is_active: isActive,
      image_url: imageUrl,
      company_id: companyId,
    };

    let error;
    if (service) {
      ({ error } = await supabase.from("services").update(payload).eq("id", service.id));
    } else {
      ({ error } = await supabase.from("services").insert(payload));
    }

    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    toast.success(service ? "Service updated!" : "Service created!");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Add Service"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 rounded-lg border border-border">
              <AvatarImage src={imageUrl ?? undefined} className="object-cover" />
              <AvatarFallback className="rounded-lg bg-muted"><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                {imageUrl ? "Change" : "Upload Image"}
              </Button>
              {imageUrl && (
                <Button variant="outline" size="sm" onClick={() => setImageUrl(null)} className="text-destructive hover:text-destructive ml-2">
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lawn Mowing" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Landscaping" />
            </div>
            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 1 hour" />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {service ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
