import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/shared/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Users, FileText, Receipt, Trash2, UserPlus, ShieldCheck, ShieldOff, UserX, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

export default function SuperAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteCompany, setDeleteCompany] = useState<{ id: string; name: string } | null>(null);
  const [editCompany, setEditCompany] = useState<any | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [roleDialog, setRoleDialog] = useState<{ userId: string; name: string; currentRoles: AppRole[] } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("company_owner");

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      const [companies, profiles, proposals, invoices] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("proposals").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
      ]);
      return {
        companies: companies.count ?? 0,
        users: profiles.count ?? 0,
        proposals: proposals.count ?? 0,
        invoices: invoices.count ?? 0,
      };
    },
  });

  // Companies
  const { data: companies = [] } = useQuery({
    queryKey: ["super-admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Users with roles
  const { data: users = [] } = useQuery({
    queryKey: ["super-admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, user_roles(role, id)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Update company
  const updateCompanyMut = useMutation({
    mutationFn: async (values: { id: string; name: string; subscription_status: SubscriptionStatus }) => {
      const { error } = await supabase
        .from("companies")
        .update({ name: values.name, subscription_status: values.subscription_status })
        .eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-companies"] });
      toast.success("Company updated");
      setEditCompany(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Delete company
  const deleteCompanyMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-companies"] });
      qc.invalidateQueries({ queryKey: ["super-admin-stats"] });
      toast.success("Company deleted");
      setDeleteCompany(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Toggle user active
  const toggleUserMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast.success("User updated");
    },
    onError: (e) => toast.error(e.message),
  });

  // Add role
  const addRoleMut = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast.success("Role added");
      setRoleDialog(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Remove role
  const removeRoleMut = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast.success("Role removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter((u: any) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const kpis = [
    { title: "Companies", value: stats?.companies ?? 0, icon: Building2, trend: "neutral" as const },
    { title: "Users", value: stats?.users ?? 0, icon: Users, trend: "neutral" as const },
    { title: "Proposals", value: stats?.proposals ?? 0, icon: FileText, trend: "neutral" as const },
    { title: "Invoices", value: stats?.invoices ?? 0, icon: Receipt, trend: "neutral" as const },
  ];

  const allRoles: AppRole[] = ["super_admin", "company_owner", "admin", "manager", "staff"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Super Admin</h1>
        <p className="text-muted-foreground mt-1">Platform-wide overview and management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies or users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Companies ({filteredCompanies.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Created</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3">
                        <StatusBadge status={c.subscription_status ?? "trialing"} />
                      </td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        {format(new Date(c.created_at), "MMM dd, yyyy")}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEditCompany({
                              id: c.id,
                              name: c.name,
                              subscription_status: c.subscription_status ?? "trialing",
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteCompany({ id: c.id, name: c.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No companies found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Roles</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u: any) => {
                    const roles: { role: AppRole; id: string }[] = u.user_roles ?? [];
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{u.full_name || "Unnamed"}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {roles.length === 0 && <span className="text-muted-foreground text-xs">—</span>}
                            {roles.map((r) => (
                              <span
                                key={r.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                              >
                                {r.role}
                                <button
                                  onClick={() => removeRoleMut.mutate(r.id)}
                                  className="hover:text-destructive"
                                  title="Remove role"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={u.is_active ? "Active" : "Inactive"} />
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Manage roles"
                            onClick={() =>
                              setRoleDialog({
                                userId: u.user_id,
                                name: u.full_name || "Unnamed",
                                currentRoles: roles.map((r) => r.role),
                              })
                            }
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title={u.is_active ? "Deactivate" : "Activate"}
                            onClick={() =>
                              toggleUserMut.mutate({ id: u.id, is_active: !u.is_active })
                            }
                          >
                            {u.is_active ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserPlus className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Company Dialog */}
      <Dialog open={!!editCompany} onOpenChange={(o) => !o && setEditCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update company details and subscription status.</DialogDescription>
          </DialogHeader>
          {editCompany && (
            <div className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={editCompany.name}
                  onChange={(e) => setEditCompany({ ...editCompany, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Subscription Status</Label>
                <Select
                  value={editCompany.subscription_status}
                  onValueChange={(v) =>
                    setEditCompany({ ...editCompany, subscription_status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["active", "past_due", "canceled", "trialing", "incomplete"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => updateCompanyMut.mutate(editCompany)}
                  disabled={updateCompanyMut.isPending}
                >
                  Save
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <AlertDialog open={!!deleteCompany} onOpenChange={(o) => !o && setDeleteCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteCompany?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCompany && deleteCompanyMut.mutate(deleteCompany.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Role Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(o) => !o && setRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles — {roleDialog?.name}</DialogTitle>
            <DialogDescription>Add a role to this user.</DialogDescription>
          </DialogHeader>
          {roleDialog && (
            <div className="space-y-4">
              <div>
                <Label>Current Roles</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {roleDialog.currentRoles.length > 0
                    ? roleDialog.currentRoles.join(", ")
                    : "No roles assigned"}
                </p>
              </div>
              <div>
                <Label>Add Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoles
                      .filter((r) => !roleDialog.currentRoles.includes(r))
                      .map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    addRoleMut.mutate({ userId: roleDialog.userId, role: selectedRole })
                  }
                  disabled={addRoleMut.isPending || roleDialog.currentRoles.includes(selectedRole)}
                >
                  Add Role
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
