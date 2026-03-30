import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Building2, Upload, Trash2, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("name, email, phone, address, timezone, currency, logo_url")
        .eq("id", companyId)
        .single();
      if (data) {
        setName(data.name);
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
        setTimezone(data.timezone ?? "Asia/Kolkata");
        setCurrency(data.currency ?? "INR");
        setLogoUrl(data.logo_url);
      }
      setLoading(false);
    })();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({ name, email, phone, address, timezone, currency })
      .eq("id", companyId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Company settings saved!");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${companyId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("company-logos")
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl + "?t=" + Date.now();

    const { error: updateError } = await supabase
      .from("companies")
      .update({ logo_url: publicUrl })
      .eq("id", companyId);

    setUploading(false);
    if (updateError) {
      toast.error("Failed to save logo URL.");
    } else {
      setLogoUrl(publicUrl);
      toast.success("Logo uploaded!");
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyId) return;
    setUploading(true);

    // List files in the company folder and delete them
    const { data: files } = await supabase.storage
      .from("company-logos")
      .list(companyId);

    if (files && files.length > 0) {
      await supabase.storage
        .from("company-logos")
        .remove(files.map((f) => `${companyId}/${f.name}`));
    }

    await supabase
      .from("companies")
      .update({ logo_url: null })
      .eq("id", companyId);

    setLogoUrl(null);
    setUploading(false);
    toast.success("Logo removed.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Company Settings"
        description="Manage your company profile, logo, and preferences."
      />

      <div className="grid gap-6 max-w-2xl">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 rounded-lg border border-border">
                <AvatarImage src={logoUrl ?? undefined} alt="Company logo" className="object-contain" />
                <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                  <Building2 className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a logo to display on invoices and proposals. Max 2MB, PNG or JPG recommended.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {logoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={uploading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Default Currency</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
