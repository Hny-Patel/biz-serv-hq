import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Users,
  Wrench,
  FileText,
  Briefcase,
  Receipt,
  CreditCard,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Shop", icon: Store, path: "/shop" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Services", icon: Wrench, path: "/services" },
  { label: "Proposals", icon: FileText, path: "/proposals" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "Invoices", icon: Receipt, path: "/invoices" },
  { label: "Billing", icon: CreditCard, path: "/billing" },
  { label: "Team", icon: UserCog, path: "/team" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, profile, isSuperAdmin } = useAuth();

  const allNavItems = isSuperAdmin
    ? [...navItems, { label: "Super Admin", icon: ShieldCheck, path: "/admin" }]
    : navItems;

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar-bg border-r border-sidebar-hover transition-all duration-200 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-hover">
        <Zap className="h-7 w-7 text-primary shrink-0" />
        {!collapsed && (
          <span className="ml-2 text-lg font-bold text-sidebar-fg-active tracking-tight">
            ServiFlow
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {allNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <button
        onClick={() => signOut()}
        className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active transition-colors"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span>Sign out</span>}
      </button>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-hover text-sidebar-fg hover:text-sidebar-fg-active transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
